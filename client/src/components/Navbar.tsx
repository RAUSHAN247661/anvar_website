import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, ShoppingCart, X, Laptop, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/utils";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { items, isOpen, setIsOpen, total, removeFromCart } = useCart();
  const [isAdmin, setIsAdmin] = useState(false);
  const [_, navigate] = useLocation();

  

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : "";
    if (!token) {
      setIsAdmin(false);
      return;
    }
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    fetch(`${apiBase}/admin/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => { if (!r.ok) throw new Error("unauthorized"); return r.json(); })
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false));
  }, []);


  function logout() {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
      }
      setIsAdmin(false);
      navigate("/admin");
    } catch {}
  }

  return (
    <nav
      className={"fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/10"}
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-2xl font-display font-bold tracking-widest hover:text-primary transition-colors">
          <Laptop className="w-8 h-8 text-primary" />
          NEXTECH
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Home</Link>
          <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Products</Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">About</Link>
          <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Contact</Link>
          <Link href="/history" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">History</Link>
          {isAdmin ? (
            <>
              <Link href="/admin/dashboard" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Dashboard</Link>
              <button onClick={logout} className="text-sm font-bold hover:text-destructive transition-colors uppercase tracking-wide cursor-pointer">Logout</button>
            </>
          ) : (
            <Link href="/admin" className="text-sm font-bold hover:text-primary transition-colors uppercase tracking-wide cursor-pointer">Admin</Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                <ShoppingCart className="w-5 h-5" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-xs font-bold rounded-full flex items-center justify-center animate-in zoom-in">
                    {items.length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md border-l border-white/10 bg-card/95 backdrop-blur-xl">
              <SheetHeader>
                <SheetTitle className="font-display text-2xl">Your Cart</SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-6 h-[calc(100vh-200px)] overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">
                    Your cart is empty.
                  </div>
                ) : (
                  items.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center bg-white/5 p-4 rounded-lg border border-white/5">
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded bg-background" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-primary text-sm">{formatINR(item.price)}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive hover:bg-white/5"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
              {items.length > 0 && (
                <div className="pt-6 border-t border-white/10">
                  <div className="flex justify-between mb-4 text-lg font-bold">
                    <span>Total</span>
                    <span>{formatINR(total)}</span>
                  </div>
                  <Link href="/checkout">
                    <SheetTrigger asChild>
                      <Button className="w-full font-bold bg-primary text-background hover:bg-primary/90">
                        Checkout Now
                      </Button>
                    </SheetTrigger>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Mobile Menu Toggle */}
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/10">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] border-r border-white/10 bg-background/95 backdrop-blur-xl p-0">
              <div className="p-6 border-b border-white/10">
                 <div className="flex items-center gap-2 text-xl font-display font-bold tracking-widest text-white">
                    <Laptop className="w-6 h-6 text-primary" />
                    NEXTECH
                  </div>
              </div>
              <div className="flex flex-col p-6 gap-2">
                <Link href="/">
                  <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                    Home <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
                <Link href="/products">
                  <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                    Products <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
                <Link href="/about">
                  <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                    About <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
                <Link href="/contact">
                  <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                    Contact <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
                <Link href="/history">
                  <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                    History <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
                {isAdmin ? (
                  <Link href="/admin/dashboard">
                    <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                      Dashboard <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </Link>
                ) : (
                  <Link href="/admin">
                    <button onClick={() => setIsMobileOpen(false)} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-primary text-left transition-all group">
                      Admin <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </Link>
                )}
                {isAdmin && (
                  <button onClick={() => { logout(); setIsMobileOpen(false); }} className="flex items-center justify-between w-full p-4 rounded-xl text-lg font-display hover:bg-white/5 hover:text-destructive text-left transition-all group">
                    Logout <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 border-t border-white/10">
                 <p className="text-xs text-muted-foreground text-center">
                   &copy; 2025 NexTech Electronics
                 </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
