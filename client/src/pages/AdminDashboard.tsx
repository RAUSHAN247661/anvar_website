import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { setDocumentMeta, setCanonical, setNoIndex } from "@/lib/utils";

export default function AdminDashboard() {
  const [_, navigate] = useLocation();
  const [usersCount, setUsersCount] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const emptyProductsIntervalRef = useRef<any>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    longDescription: "",
    category: "",
    rating: "",
    originalPrice: "",
    discountPercent: "",
    discountedPrice: "",
    feature1: "",
    feature2: "",
    feature3: "",
    feature4: "",
    warranty2yr: false,
    freeShipping: false,
    thirtyDayReturns: false,
    warrantyText: "",
    shippingText: "",
    returnsText: "",
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [invalidImageMsg, setInvalidImageMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  function refreshOrders(base: string) {
    fetch(`${base}/orders`).then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
  }

  
  function setStatus(id: string, status: "pending" | "on_the_way" | "delivered") {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    fetch(`${apiBase}/admin/order/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" }, body: JSON.stringify({ status }) })
      .then(async (r) => {
        const data = await r.text();
        if (!r.ok) throw new Error(data || "Failed");
        toast({ title: "Status updated", description: `Order ${id} → ${status.replace("_", " ")}` });
        refreshOrders(apiBase);
      })
      .catch((e) => toast({ title: e.message || "Failed to update", variant: "destructive" }));
  }
  useEffect(() => {
    setDocumentMeta("Admin Dashboard • NexTech", "Manage orders and visitor analytics.");
    setCanonical();
    setNoIndex();
  }, []);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    fetch(`${apiBase}/admin/auth/me`, { headers: { Authorization: token ? `Bearer ${token}` : "" } })
      .then((r) => { if (!r.ok) throw new Error("unauthorized"); })
      .catch(() => navigate("/admin"));
  }, []);

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    if (products.length === 0) {
      if (!emptyProductsIntervalRef.current) {
        emptyProductsIntervalRef.current = setInterval(() => {
          fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
        }, 5000);
      }
    } else {
      if (emptyProductsIntervalRef.current) {
        clearInterval(emptyProductsIntervalRef.current);
        emptyProductsIntervalRef.current = null;
      }
    }
    return () => {
      if (emptyProductsIntervalRef.current) {
        clearInterval(emptyProductsIntervalRef.current);
        emptyProductsIntervalRef.current = null;
      }
    };
  }, [products.length]);
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    fetch(`${apiBase}/admin/users-count`).then((r) => r.json()).then((d) => setUsersCount(d.totalUsers || 0)).catch(() => {});
    fetch(`${apiBase}/orders`).then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
    if (apiBase.startsWith("http")) {
      const wsUrl = apiBase.replace(/^http/, "ws");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === "orders_changed") {
          fetch(`${apiBase}/orders`).then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => {});
        } else if (msg?.type === "users_count") {
          setUsersCount(msg.totalUsers || 0);
        } else if (msg?.type === "products_changed") {
          fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
        }
      } catch {}
    };
      ws.onclose = () => { wsRef.current = null; };
      return () => { ws.close(); };
    }
  }, []);

  function onImagesSelected(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5);
    const previews: string[] = [];
    let pending = arr.length;
    let bad = false;
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const w = img.width, h = img.height;
          if (w < 500 || h < 500 || Math.abs(w - h) > 5) {
            bad = true;
          } else {
            previews.push(url);
          }
          pending -= 1;
          if (pending === 0) {
            if (bad) {
              setInvalidImageMsg("Upload square images at least 500x500. Max 5 images.");
            }
            setImagePreviews(previews);
          }
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImageAt(index: number) {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImagesToCloudinary(images: string[]) {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    try {
      const r = await fetch(`${apiBase}/admin/upload-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
        body: JSON.stringify({ images }),
      });
      if (!r.ok) {
        return images;
      }
      const data = await r.json();
      return Array.isArray(data.urls) ? data.urls : images;
    } catch {
      return images;
    }
  }

  async function addProduct() {
    try {
      if (imagePreviews.length < 1) {
        toast({ title: "Select images", description: "Choose 1–5 square images" });
        return;
      }
      setUploading(true);
      const urls = await uploadImagesToCloudinary(imagePreviews);
      const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
      const payload = {
        name: productForm.name,
        price: Number(productForm.price || 0),
        description: productForm.description,
        longDescription: productForm.longDescription,
        images: urls,
        category: productForm.category || undefined,
        rating: productForm.rating ? Number(productForm.rating) : undefined,
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        discountPercent: productForm.discountPercent ? Number(productForm.discountPercent) : undefined,
        discountedPrice: productForm.discountedPrice ? Number(productForm.discountedPrice) : undefined,
        features: [productForm.feature1, productForm.feature2, productForm.feature3, productForm.feature4].map((x) => x.trim()).filter(Boolean),
        warranty2yr: Boolean(productForm.warranty2yr),
        freeShipping: Boolean(productForm.freeShipping),
        thirtyDayReturns: Boolean(productForm.thirtyDayReturns),
        warrantyText: productForm.warrantyText?.trim() || undefined,
        shippingText: productForm.shippingText?.trim() || undefined,
        returnsText: productForm.returnsText?.trim() || undefined,
      };
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
      const r = await fetch(`${apiBase}/admin/add-product`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" }, body: JSON.stringify(payload) });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Failed");
      toast({ title: "Product added", description: productForm.name });
      setProductForm({ name: "", price: "", description: "", longDescription: "", category: "", rating: "", originalPrice: "", discountPercent: "", discountedPrice: "", feature1: "", feature2: "", feature3: "", feature4: "", warranty2yr: false, freeShipping: false, thirtyDayReturns: false, warrantyText: "", shippingText: "", returnsText: "" });
      setImagePreviews([]);
      fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (e: any) {
      toast({ title: e?.message || "Failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  function deleteProductById(id: string) {
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    fetch(`${apiBase}/admin/product/${id}`, { method: "DELETE", headers: { Authorization: token ? `Bearer ${token}` : "" } })
      .then(async (r) => {
        const txt = await r.text();
        if (!r.ok) throw new Error(txt || "Failed");
        toast({ title: "Product deleted" });
        fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
      })
      .catch((e) => toast({ title: e?.message || "Failed", variant: "destructive" }));
  }

  function openEditProduct(p: any) {
    setEditingProduct(p);
    setProductForm({
      name: p.name || "",
      price: String(p.price ?? ""),
      description: p.description || "",
      longDescription: p.longDescription || "",
      category: p.category || "",
      rating: String(p.rating ?? ""),
      originalPrice: String(p.originalPrice ?? ""),
      discountPercent: String(p.discountPercent ?? ""),
      discountedPrice: String(p.discountedPrice ?? ""),
      feature1: Array.isArray(p.features) ? (p.features[0] || "") : "",
      feature2: Array.isArray(p.features) ? (p.features[1] || "") : "",
      feature3: Array.isArray(p.features) ? (p.features[2] || "") : "",
      feature4: Array.isArray(p.features) ? (p.features[3] || "") : "",
      warranty2yr: Boolean(p.warranty2yr),
      freeShipping: Boolean(p.freeShipping),
      thirtyDayReturns: Boolean(p.thirtyDayReturns),
      warrantyText: p.warrantyText || "",
      shippingText: p.shippingText || "",
      returnsText: p.returnsText || "",
    });
    const imgs = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    setImagePreviews(imgs);
  }

  async function saveProductUpdate() {
    if (!editingProduct) return;
    try {
      setUploading(true);
      const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
      const toUpload = imagePreviews.filter((u) => typeof u === "string" && u.startsWith("data:"));
      const keep = imagePreviews.filter((u) => typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://")));
      const uploaded = toUpload.length > 0 ? await uploadImagesToCloudinary(toUpload) : [];
      const finalImages = [...keep, ...uploaded];
      const payload = {
        name: productForm.name,
        price: Number(productForm.price || 0),
        description: productForm.description,
        longDescription: productForm.longDescription,
        images: finalImages,
        category: productForm.category || undefined,
        rating: productForm.rating ? Number(productForm.rating) : undefined,
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        discountPercent: productForm.discountPercent ? Number(productForm.discountPercent) : undefined,
        discountedPrice: productForm.discountedPrice ? Number(productForm.discountedPrice) : undefined,
        features: [productForm.feature1, productForm.feature2, productForm.feature3, productForm.feature4].map((x) => x.trim()).filter(Boolean),
        warranty2yr: Boolean(productForm.warranty2yr),
        freeShipping: Boolean(productForm.freeShipping),
        thirtyDayReturns: Boolean(productForm.thirtyDayReturns),
        warrantyText: productForm.warrantyText?.trim() || undefined,
        shippingText: productForm.shippingText?.trim() || undefined,
        returnsText: productForm.returnsText?.trim() || undefined,
      };
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
      const r = await fetch(`${apiBase}/admin/product/${editingProduct._id}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" }, body: JSON.stringify(payload) });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Failed");
      toast({ title: "Product updated", description: productForm.name });
      setEditingProduct(null);
      setProductForm({ name: "", price: "", description: "", longDescription: "", category: "", rating: "", originalPrice: "", discountPercent: "", discountedPrice: "", feature1: "", feature2: "", feature3: "", feature4: "", warranty2yr: false, freeShipping: false, thirtyDayReturns: false, warrantyText: "", shippingText: "", returnsText: "" });
      setImagePreviews([]);
      fetch(`${apiBase}/admin/products`).then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(() => {});
    } catch (e: any) {
      toast({ title: e?.message || "Failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <h1 className="text-3xl font-display font-bold text-white mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-white/5 p-6 rounded-xl">
            <div className="text-sm text-muted-foreground">Visitors</div>
            <div className="text-3xl font-bold text-white">{usersCount}</div>
            <Button asChild className="mt-4" variant="outline">
              <a href="/admin/users-count">View Count</a>
            </Button>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Products</CardTitle>
              <CardDescription>Upload 1–5 square images with 500 * 500 pixels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-3 w-full">
                  <div className="space-y-2">
                    <Label className="text-white">Product Name</Label>
                    <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full" />
                  </div>
                    <div className="space-y-2">
                      <Label className="text-white">Product Price ( Optional)</Label>
                      <Input value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Product Category</Label>
                      <Input value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
                    </div>
                
                    <div className="space-y-2">
                      <Label className="text-white"> Product Rating</Label>
                      <Input value={productForm.rating} onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Original Amount</Label>
                      <Input value={productForm.originalPrice} onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Product Discount %</Label>
                      <Input value={productForm.discountPercent} onChange={(e) => setProductForm({ ...productForm, discountPercent: e.target.value })} />
                    </div>
                 
                  <div className="space-y-2">
                      <Label className="text-white">Discounted Price</Label>
                      <Input value={productForm.discountedPrice} onChange={(e) => setProductForm({ ...productForm, discountedPrice: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white"> Feature 1</Label>
                      <Input value={productForm.feature1} onChange={(e) => setProductForm({ ...productForm, feature1: e.target.value })} />
                    </div>
                
                  <div className="space-y-2">
                    <Label className="text-white">Feature 2</Label>
                    <Input value={productForm.feature2} onChange={(e) => setProductForm({ ...productForm, feature2: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Feature 3</Label>
                    <Input value={productForm.feature3} onChange={(e) => setProductForm({ ...productForm, feature3: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Feature 4</Label>
                    <Input value={productForm.feature4} onChange={(e) => setProductForm({ ...productForm, feature4: e.target.value })} />
                  </div>
                 
                   
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-white">Warranty </Label>
                      <Input value={productForm.warrantyText} onChange={(e) => setProductForm({ ...productForm, warrantyText: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Delivery Fee</Label>
                      <Input value={productForm.shippingText} onChange={(e) => setProductForm({ ...productForm, shippingText: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Returns Product ( days )</Label>
                      <Input value={productForm.returnsText} onChange={(e) => setProductForm({ ...productForm, returnsText: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 hidden">
                    <div className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-sm text-white">2 Year Warranty</span>
                      <Switch checked={productForm.warranty2yr} onCheckedChange={(v) => setProductForm({ ...productForm, warranty2yr: Boolean(v) })} />
                    </div>
                    <div className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-sm text-white">Free Shipping</span>
                      <Switch checked={productForm.freeShipping} onCheckedChange={(v) => setProductForm({ ...productForm, freeShipping: Boolean(v) })} />
                    </div>
                    <div className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2">
                      <span className="text-sm text-white">30 Day Returns</span>
                      <Switch checked={productForm.thirtyDayReturns} onCheckedChange={(v) => setProductForm({ ...productForm, thirtyDayReturns: Boolean(v) })} />
                    </div>
                  </div>
            
                  <div className="space-y-2">
                    <Label className="text-white">Short Description</Label>
                    <Textarea rows={2} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Long Description</Label>
                    <Textarea rows={3} value={productForm.longDescription} onChange={(e) => setProductForm({ ...productForm, longDescription: e.target.value })} />
                  </div>
                </div>
              </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white">Images</Label>
                    <Input type="file" accept="image/*" multiple onChange={(e) => onImagesSelected(e.target.files)} />
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
                          <img src={src} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded" onClick={() => removeImageAt(i)}>Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    {editingProduct ? (
                      <Button onClick={saveProductUpdate} disabled={uploading} className="w-full bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg">
                        {uploading ? "Saving..." : "Save Changes"}
                      </Button>
                    ) : (
                      <Button onClick={addProduct} disabled={uploading} className="w-full bg-cyan-400 text-black hover:bg-cyan-300 rounded-lg">
                        {uploading ? "Uploading..." : "Add Product"}
                      </Button>
                    )}
                  </div>
                </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Product List</CardTitle>
              <CardDescription>Latest products</CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-sm text-muted-foreground">No products</div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p._id} className="flex items-center gap-3 border border-white/10 rounded-lg p-3">
                      <div className="w-16 h-16 rounded overflow-hidden bg-white/5 border border-white/10">
                        {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground">₹{p.discountedPrice ?? p.price}</div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEditProduct(p)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setConfirmDeleteProductId(p._id)}>Delete</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="mt-10 bg-card border border-white/5 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">Orders</h2>
          {orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">No orders yet</div>
          ) : (
            <div className="space-y-6">
              {orders.map((o) => (
                <div key={o._id} className="border border-white/10 rounded-lg p-4">
                  <div className="flex flex-col  mb-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold whitespace-nowrap">{o.status}</span>
                      <Button size="sm" aria-label={`Set order ${o._id} pending`} onClick={() => setStatus(o._id, "pending")}>Pending</Button>
                      <Button size="sm" aria-label={`Set order ${o._id} on the way`} onClick={() => setStatus(o._id, "on_the_way")}>On the way</Button>
                      <Button size="sm" aria-label={`Set order ${o._id} delivered`} onClick={() => setStatus(o._id, "delivered")}>Delivered</Button>
                      {o.status === "delivered" && (
                        <Button size="sm" aria-label={`Delete delivered order ${o._id}`} variant="destructive" onClick={() => setConfirmDeleteId(o._id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                      )}
                    </div>
                    <div className="mt-5">
                      <div className="font-mono text-primary font-bold">#{String(o._id).toUpperCase()}</div>
                      <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Customer</div>
                      <div className="text-sm">{o.customer?.name} ({o.customer?.email})</div>
                      <div className="text-xs text-muted-foreground break-words">{o.customer?.address}</div>
                      <div className="text-xs text-muted-foreground">Phone: {o.customer?.phone || "-"}</div>
                      {o.customer?.locationLink && (
                        <a
                          href={
                            o.customer.locationLink.startsWith("http://") || o.customer.locationLink.startsWith("https://")
                              ? o.customer.locationLink
                              : `https://${o.customer.locationLink}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary break-all"
                        >
                          Location Link
                        </a>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Request</div>
                      <div className="text-xs">Desired Count: {o.customer?.desiredCount}</div>
                      <div className="text-xs">Details: {o.customer?.details}</div>
                      <div className="text-xs font-bold">Total: ₹{o.total}</div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {o.items.map((it: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {it.image ? (
                                <img src={it.image} alt={it.name} className="w-10 h-10 rounded object-cover border border-white/10" />
                              ) : null}
                              <span>{it.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{it.quantity}</TableCell>
                          <TableCell>₹{it.price}</TableCell>
                          <TableCell>₹{it.price * it.quantity}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => setConfirmDeleteId(open ? confirmDeleteId : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete delivered order?</DialogTitle>
            <DialogDescription>
              This action will permanently remove this delivered order from records.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDeleteId) return;
                const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
                const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
                fetch(`${apiBase}/admin/order/${confirmDeleteId}`, { method: "DELETE", headers: { Authorization: token ? `Bearer ${token}` : "" } })
                  .then(async (r) => {
                    const txt = await r.text();
                    if (!r.ok) throw new Error(txt || "Failed");
                    toast({ title: "Order deleted", description: `Order ${confirmDeleteId} removed` });
                    setConfirmDeleteId(null);
                    refreshOrders(apiBase);
                  })
                  .catch((e) => toast({ title: e.message || "Failed to delete", variant: "destructive" }));
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!confirmDeleteProductId} onOpenChange={(open) => setConfirmDeleteProductId(open ? confirmDeleteProductId : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This will remove the product from the catalog. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteProductId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!confirmDeleteProductId) return;
                deleteProductById(confirmDeleteProductId);
                setConfirmDeleteProductId(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!invalidImageMsg} onOpenChange={(open) => setInvalidImageMsg(open ? invalidImageMsg : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invalid image size</DialogTitle>
            <DialogDescription>
              Upload square images (1:1) at least 500x500 pixels. Maximum 5 images.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button onClick={() => setInvalidImageMsg(null)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">
              {editingProduct ? "Saving changes..." : "Uploading product..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
