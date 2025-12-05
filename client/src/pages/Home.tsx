import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { setDocumentMeta, setCanonical } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Home() {
  const [serverProducts, setServerProducts] = useState<any[]>([]);
  useEffect(() => {
    setDocumentMeta(
      "NexTech | Future Electronics",
      "Premium modern electronics for the digital age. Shop the latest in high-tech gadgets."
    )
    setCanonical()
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/track`).catch(() => {})
    fetch(`${API}/admin/products`).then((r) => r.json()).then((d) => setServerProducts(Array.isArray(d) ? d : [])).catch(() => {});
    const wsUrl = API.replace(/^http/, "ws");
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg?.type === "products_changed") {
          fetch(`${API}/admin/products`).then((r) => r.json()).then((d) => setServerProducts(Array.isArray(d) ? d : [])).catch(() => {});
        }
      } catch {}
    };
    return () => { ws.close(); };
  }, [])
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      
      <Hero />

      <section className="py-16 container mx-auto px-4 hidden lg:hidden">
        <div className="text-center mb-10">
          <span className="text-primary font-bold tracking-wider uppercase mb-2 block">Highlights</span>
          <h2 className="text-3xl font-display font-bold text-white">Explore Our Best</h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {serverProducts.slice(0, 3).map((product: any, i: number) => (
            <ProductCard key={product._id ?? product.id ?? i} product={product} index={i} />
          ))}
        </div>
      </section>

      <section className="py-24 container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-white">Our Products</h2>
          <span className="text-primary font-bold tracking-wider uppercase mb-2 block">Explore our products</span>
        </div>
        
        {serverProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 md:grid-cols-3 gap-8 mb-12">
            {serverProducts.slice(0, 4).map((product: any, index: number) => (
              <ProductCard key={product._id ?? product.id ?? index} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">No products yet</div>
        )}

        <div className="text-center">
           <Link href="/products">
             <Button variant="outline" size="lg" className="rounded-full px-8">View All Products</Button>
           </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
