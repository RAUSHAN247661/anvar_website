import { motion } from "framer-motion";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/data";
import { formatINR } from "@/lib/utils";
import { useCart } from "@/lib/cart";

import { Link } from "wouter";

export default function ProductCard({ product, index }: { product: any; index: number }) {
  const { addToCart } = useCart();
  const pid = product?.id ?? product?._id;
  const imgSrc = product?.image ?? (Array.isArray(product?.images) ? product.images[0] : "");
  function hashId(input: string): number {
    let h = 0;
    for (let i = 0; i < input.length; i++) {
      h = (h * 31 + input.charCodeAt(i)) >>> 0;
    }
    return h || Math.floor(Math.random() * 1e9);
  }
  function toCartProduct(p: any): Product {
    if (typeof p?.id === "number") return p as Product;
    const id = typeof p?._id === "string" ? hashId(p._id) : Math.floor(Math.random() * 1e9);
    const price = Number(p?.discountedPrice ?? p?.price ?? 0);
    const imagesArr = Array.isArray(p?.images) ? p.images : (imgSrc ? [imgSrc] : []);
    return {
      id,
      name: p?.name || "Product",
      price,
      image: imgSrc || "",
      images: imagesArr,
      category: p?.category || "",
      rating: Number(p?.rating ?? 0),
      description: p?.description || "",
      longDescription: p?.longDescription || "",
      specs: Array.isArray(p?.features) ? p.features : Array.isArray(p?.specs) ? p.specs : [],
      originalPrice: p?.originalPrice,
      discountPercent: p?.discountPercent,
      discountedPrice: p?.discountedPrice,
      benefits: undefined,
    };
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative bg-card/50 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]"
    >
      <Link href={`/product/${pid}`}>
        <div className="aspect-square overflow-hidden bg-black/40 relative cursor-pointer">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div
            className="absolute bottom-4 right-4 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              addToCart(toCartProduct(product));
            }}
          >
            <Button
              className="bg-primary text-background hover:bg-primary/90 rounded-full w-12 h-12 p-0 shadow-lg shadow-primary/20"
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Link>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-yellow-500 text-xs">
            <Star className="w-3 h-3 fill-current" />
            <span>{product.rating}</span>
          </div>
        </div>
        
        <Link href={`/product/${pid}`}>
          <h3 className="text-xl font-bold font-display mb-2 text-white group-hover:text-primary transition-colors cursor-pointer">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.description}
        </p>
        {Array.isArray(product?.features) && product.features.length > 0 || Array.isArray(product?.specs) ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              (Array.isArray(product.features) && product.features.length > 0 ? product.features : (Array.isArray(product.specs) ? product.specs : []))
            ).slice(0, 3).map((f: string, i: number) => (
              <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                {f}
              </span>
            ))}
          </div>
        ) : null}
        {(product.warranty2yr || product.freeShipping || product.thirtyDayReturns || product.warrantyText || product.shippingText || product.returnsText) ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {(product.warranty2yr || product.warrantyText) ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                {product.warrantyText || "2 Year Warranty"}
              </span>
            ) : null}
            {(product.freeShipping || product.shippingText) ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                {product.shippingText || "Free Shipping"}
              </span>
            ) : null}
            {(product.thirtyDayReturns || product.returnsText) ? (
              <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/80">
                {product.returnsText || "30 Day Returns"}
              </span>
            ) : null}
          </div>
        ) : null}
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {product.originalPrice ? (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(product.originalPrice)}
              </span>
            ) : null}
            <span className="text-xl font-bold text-white">
              {formatINR(product.discountedPrice ?? product.price)}
            </span>
          </div>
          <Button 
            variant="link" 
            className="text-white p-0 h-auto hover:text-primary"
            onClick={() => { addToCart(toCartProduct(product)); }}
          >
            Add to Cart
          </Button>
        </div>
        <div className="mt-2 text-xs text-primary font-bold">
          {product.discountPercent ? `${product.discountPercent}% Off` : ""}
          {(product.warranty2yr || product.warrantyText) ? ` | ${product.warrantyText || "2 Year Warranty"}` : ""}
          {(product.freeShipping || product.shippingText) ? ` | ${product.shippingText || "Free Shipping"}` : ""}
          {(product.thirtyDayReturns || product.returnsText) ? ` | ${product.returnsText || "30 Day Returns"}` : ""}
        </div>
      </div>
    </motion.div>
  );
}
