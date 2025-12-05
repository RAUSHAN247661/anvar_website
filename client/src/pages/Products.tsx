import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { setDocumentMeta, setCanonical } from "@/lib/utils";

export default function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [serverProducts, setServerProducts] = useState<any[]>([]);
  useEffect(() => {
    setDocumentMeta(
      "Products | NexTech Electronics",
      "Explore futuristic electronics: smartphones, audio, wearables, and computing."
    )
    setCanonical()
  }, [])
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/admin/products`).then((r) => r.json()).then((d) => {
      setServerProducts(Array.isArray(d) ? d : []);
    }).catch(() => {});
    const wsUrl = API.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === "products_changed") {
          fetch(`${API}/admin/products`).then((r) => r.json()).then((d) => {
            setServerProducts(Array.isArray(d) ? d : []);
          }).catch(() => {});
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [])

  const filteredProducts = serverProducts.filter((product: any) =>
    (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="pt-32 pb-20 container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-white mb-4">Our Collection</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Explore our range of futuristic electronics designed to elevate your digital lifestyle.
          </p>
          
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 bg-white/5 border-white/10 text-white focus:border-primary h-12 rounded-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-cols-3 gap-8">
            {filteredProducts.map((product: any, index: number) => (
              <ProductCard key={product._id ?? product.id ?? index} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No products found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
