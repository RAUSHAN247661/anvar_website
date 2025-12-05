import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useState } from "react";
import { formatINR } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function useAdminApi(secret: string) {
  const base = (path: string) => `${import.meta.env.VITE_ADMIN_API_URL || "http://localhost:4000"}/api/admin${path}`;
  const headers = { "Content-Type": "application/json", "x-admin-secret": secret } as Record<string, string>;
  return {
    listProducts: async () => {
      const r = await fetch(base("/products"), { headers });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    createProduct: async (data: any) => {
      const r = await fetch(base("/products"), { method: "POST", headers, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    updateProduct: async (id: string, data: any) => {
      const r = await fetch(base(`/products/${id}`), { method: "PUT", headers, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    deleteProduct: async (id: string) => {
      const r = await fetch(base(`/products/${id}`), { method: "DELETE", headers });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    listNotifications: async () => {
      const r = await fetch(base("/notifications"), { headers });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
    sendNotification: async (data: any) => {
      const r = await fetch(base("/notifications/send"), { method: "POST", headers, body: JSON.stringify(data) });
      if (!r.ok) throw new Error("failed");
      return r.json();
    },
  };
}

export default function Admin() {
  const [secret, setSecret] = useState<string>(localStorage.getItem("admin_secret") || "");
  const [newProduct, setNewProduct] = useState({ name: "", price: "", image: "", stock: "" });
  const [notif, setNotif] = useState({ title: "", message: "", audience: "all" });
  const { toast } = useToast();
  const qc = useQueryClient();
  const api = useAdminApi(secret);

  const productsQuery = useQuery({ queryKey: ["admin-products", secret], queryFn: api.listProducts, enabled: !!secret });
  const notificationsQuery = useQuery({ queryKey: ["admin-notifications", secret], queryFn: api.listNotifications, enabled: !!secret });

  const createProduct = useMutation({ mutationFn: api.createProduct, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products", secret] }); toast({ title: "Product created" }); setNewProduct({ name: "", price: "", image: "", stock: "" }); } });
  const updateProduct = useMutation({ mutationFn: ({ id, data }: any) => api.updateProduct(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products", secret] }); toast({ title: "Product updated" }); } });
  const deleteProduct = useMutation({ mutationFn: (id: string) => api.deleteProduct(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products", secret] }); toast({ title: "Product deleted" }); } });
  const sendNotification = useMutation({ mutationFn: api.sendNotification, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-notifications", secret] }); toast({ title: "Notification sent" }); setNotif({ title: "", message: "", audience: "all" }); } });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-3xl font-display font-bold text-white">Admin Dashboard</h1>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Admin secret" className="max-w-sm" />
            <Button onClick={() => { localStorage.setItem("admin_secret", secret); toast({ title: "Admin secret set" }); }}>Set</Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <Input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
              <Input placeholder="Price" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
              <Input placeholder="Image URL" value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
              <Input placeholder="Stock" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
            </div>
            <Button onClick={() => createProduct.mutate({ name: newProduct.name, price: Number(newProduct.price || 0), image: newProduct.image, stock: Number(newProduct.stock || 0) })} disabled={!secret}>Add Product</Button>

            <div className="mt-6">
              {productsQuery.isLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(productsQuery.data || []).map((p: any) => (
                      <TableRow key={p._id}>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{formatINR(p.price)}</TableCell>
                        <TableCell>{p.stock}</TableCell>
                        <TableCell className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => updateProduct.mutate({ id: p._id, data: { stock: Number(p.stock) + 1 } })} disabled={!secret}>+1 Stock</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteProduct.mutate(p._id)} disabled={!secret}>Delete</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <Input placeholder="Title" value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} />
              <Input placeholder="Message" value={notif.message} onChange={(e) => setNotif({ ...notif, message: e.target.value })} />
              <Input placeholder="Audience" value={notif.audience} onChange={(e) => setNotif({ ...notif, audience: e.target.value })} />
            </div>
            <Button onClick={() => sendNotification.mutate(notif)} disabled={!secret}>Send Notification</Button>

            <div className="mt-6">
              {notificationsQuery.isLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(notificationsQuery.data || []).map((n: any) => (
                      <TableRow key={n._id}>
                        <TableCell>{n.title}</TableCell>
                        <TableCell>{n.message}</TableCell>
                        <TableCell>{n.audience}</TableCell>
                        <TableCell>{new Date(n.sentAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
