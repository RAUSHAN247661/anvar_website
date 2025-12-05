import { motion } from "framer-motion";
import { assets } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="py-24 bg-secondary/20 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src={assets.about} 
                alt="Our Office" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
            </div>
            {/* Decorative BG element */}
            <div className="absolute -top-10 -left-10 w-full h-full border-2 border-primary/20 rounded-2xl -z-10" />
            <div className="absolute -bottom-10 -right-10 w-2/3 h-2/3 bg-primary/5 rounded-full blur-3xl -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <span className="text-primary font-bold tracking-wider uppercase mb-2 block">About NexTech</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              Designing the <span className="text-primary">Future</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              At NexTech, we believe that technology should be seamless, powerful, and beautiful. Our mission is to curate and create electronics that push the boundaries of what's possible, blending cutting-edge performance with stunning industrial design.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                "Premium Quality Components",
                "Award-Winning Industrial Design",
                "Sustainable Manufacturing",
                "24/7 Expert Support"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>

            <Button size="lg" variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10 hover:border-primary hover:text-primary transition-all">
              Learn More About Us
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
