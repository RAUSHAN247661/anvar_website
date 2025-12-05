import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Product = { _id: string; name: string; price: number; description: string; image?: string };

export default function AdminProducts() {
  const { toast } = useToast();
  const [list, setList] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  function load() {
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/admin/products`).then((r) => r.json()).then(setList).catch(() => {});
  }
  useEffect(() => {
    load();
  }, []);
  function addProduct() {
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/admin/add-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, price, description, image }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(() => {
        toast({ title: "Product added" });
        setName("");
        setPrice(0);
        setDescription("");
        setImage("");
        load();
      })
      .catch(() => toast({ title: "Failed", variant: "destructive" }));
  }
  function removeProduct(id: string) {
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/admin/product/${id}`, { method: "DELETE" })
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then(() => {
        toast({ title: "Product deleted" });
        load();
      })
      .catch(() => toast({ title: "Failed", variant: "destructive" }));
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <h1 className="text-3xl font-display font-bold text-white mb-6">Manage Products</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card border border-white/5 p-6 rounded-xl space-y-4">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.valueAsNumber)} />
            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Input placeholder="Image URL (optional)" value={image} onChange={(e) => setImage(e.target.value)} />
            <Button onClick={addProduct}>Add Product</Button>
          </div>
          <div className="bg-card border border-white/5 p-6 rounded-xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.price}</TableCell>
                    <TableCell>{p.description}</TableCell>
                    <TableCell>
                      <Button variant="destructive" onClick={() => removeProduct(p._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
