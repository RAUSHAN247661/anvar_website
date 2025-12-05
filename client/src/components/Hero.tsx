import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { assets } from "@/lib/data";
import { products } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

import { Link } from "wouter";

export default function Hero() {
  const [loadingContact, setLoadingContact] = useState(false);
  const [_, setLocation] = useLocation();
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={assets.hero}
          alt="Future Electronics"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div
          className="absolute left-0 inset-y-0 w-full pointer-events-none backdrop-blur-sm md:backdrop-blur-md bg-gradient-to-r from-background/65 via-background/30 to-transparent"
          style={{ WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))', maskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))' }}
        />
      </div>

      <div className="container mx-auto px-4 z-10 relative lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="max-w-3xl mx-auto text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-primary font-bold tracking-[0.2em] uppercase mb-4 block">
              Next Gen Tech
            </span>
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-white">
              Experience <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                The Future
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Discover a curated collection of high-performance electronics designed for the digital frontier. Innovation meets elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-center sm:justify-start">
              <Link href="/products">
                <Button size="lg" className="bg-primary text-background hover:bg-primary/90 font-bold text-md px-41 lg:px-15 h-14 rounded-full w-full sm:w-auto">
                  Shop Now
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 font-medium text-md px-8 h-14 rounded-full backdrop-blur-sm w-full sm:w-auto"
                onClick={() => {
                  setLoadingContact(true);
                  setTimeout(() => {
                    setLocation("/contact");
                    setLoadingContact(false);
                  }, 800);
                }}
              >
                Contact Us <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
          <div className="mt-8 sm:hidden">
            <div className="grid grid-cols-3 gap-3">
              {products.slice(0, 3).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-xl overflow-hidden border border-white/10 bg-white/5"
                >
                  <img src={p.image} alt={p.name} loading="lazy" className="w-full h-24 object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
      {loadingContact && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Redirecting to Contact...</span>
          </div>
        </div>
      )}
    </section>
  );
}
