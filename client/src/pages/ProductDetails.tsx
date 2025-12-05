import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import { products } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { Star, ArrowLeft, ShoppingCart, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function ProductDetails() {
  const params = useParams();
  const rawId = params.id || "";
  const numId = Number(rawId);
  const staticProduct = Number.isFinite(numId) ? products.find((p) => p.id === numId) : undefined;
  const [dbProduct, setDbProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const product: any = dbProduct || staticProduct;

  function makeNumericId(input: any): number {
    if (typeof input === "number" && Number.isFinite(input)) return input;
    const s = String(input || Math.random());
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function toCartProduct(p: any) {
    if (typeof p?.id === "number") return p;
    const id = makeNumericId(p?._id ?? p?.id);
    const price = Number(p?.discountedPrice ?? p?.price ?? 0);
    const image = p?.image ?? (Array.isArray(p?.images) && p.images.length ? p.images[0] : "");
    const images = Array.isArray(p?.images) ? p.images : (image ? [image] : []);
    const specs = Array.isArray(p?.specs) ? p.specs : (Array.isArray(p?.features) ? p.features : []);
    return {
      id,
      name: String(p?.name ?? "Product"),
      price,
      image,
      images,
      category: String(p?.category ?? ""),
      rating: Number(p?.rating ?? 0),
      description: String(p?.description ?? ""),
      longDescription: String(p?.longDescription ?? ""),
      specs,
      originalPrice: p?.originalPrice,
      discountPercent: p?.discountPercent,
      discountedPrice: p?.discountedPrice,
      benefits: Array.isArray(p?.benefits) ? p.benefits : undefined,
    };
  }

  useEffect(() => {
    if (!staticProduct) {
      setLoading(true);
      const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
      fetch(`${API}/admin/products`).then((r) => r.json()).then((d) => {
        const list = Array.isArray(d) ? d : [];
        const found = list.find((p: any) => String(p._id) === String(rawId));
        setDbProduct(found || null);
      }).catch(() => setDbProduct(null)).finally(() => setLoading(false));
    }
  }, [rawId]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white">
        <h1 className="text-4xl font-display mb-4">{loading ? "Loading..." : "Product Not Found"}</h1>
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-6xl">
        <Link href="/products">
          <Button variant="ghost" className="mb-8 text-muted-foreground hover:text-primary pl-0">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back to Products
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Image Slider Section */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5"
          >
            <Carousel className="w-full">
              <CarouselContent>
                {product.images && product.images.length > 0 ? (
                  product.images.map((img: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="aspect-square flex items-center justify-center bg-black/20 p-4">
                         <img 
                          src={img} 
                          alt={`${product.name} view ${index + 1}`} 
                          className="w-full h-full object-contain hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                     <div className="aspect-square flex items-center justify-center bg-black/20 p-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </motion.div>

          {/* Details Section - More Compact */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-xs mb-1 block">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-muted'}`} 
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">({product.rating})</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {product.originalPrice ? (
                <span className="text-lg text-muted-foreground line-through">
                  {formatINR(product.originalPrice)}
                </span>
              ) : null}
              <span className="text-2xl font-bold text-white">
                {formatINR(product.discountedPrice ?? product.price)}
              </span>
              {product.discountPercent ? (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                  {product.discountPercent}% Off
                  {(product.warranty2yr || product.warrantyText) ? ` | ${product.warrantyText || "2 Year Warranty"}` : ""}
                  {(product.freeShipping || product.shippingText) ? ` | ${product.shippingText || "Free Shipping"}` : ""}
                  {(product.thirtyDayReturns || product.returnsText) ? ` | ${product.returnsText || "30 Day Returns"}` : ""}
                </span>
              ) : null}
            </div>

            <p className="text-base text-muted-foreground leading-relaxed line-clamp-6">
              {product.longDescription}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {(Array.isArray(product.features) && product.features.length > 0 ? product.features : (Array.isArray(product.specs) ? product.specs : [])).map((spec: string, i: number) => (
                <div key={i} className="bg-white/5 border border-white/5 rounded p-2 text-xs text-white/80">
                  {spec}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button 
                size="lg" 
                className="w-full bg-primary text-background hover:bg-primary/90 font-bold h-12 rounded-full"
                onClick={() => { addToCart(toCartProduct(product)) }}
              >
                <ShoppingCart className="mr-2 w-5 h-5" /> Add to Cart
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4">
              {(product.warranty2yr || product.warrantyText) ? (
                <div className="flex flex-col items-center text-center gap-1">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{product.warrantyText || "2 Year Warranty"}</span>
                </div>
              ) : null}
              {(product.freeShipping || product.shippingText) ? (
                <div className="flex flex-col items-center text-center gap-1">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{product.shippingText || "Free Shipping"}</span>
                </div>
              ) : null}
              {(product.thirtyDayReturns || product.returnsText) ? (
                <div className="flex flex-col items-center text-center gap-1">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{product.returnsText || "30 Day Returns"}</span>
                </div>
              ) : null}
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
