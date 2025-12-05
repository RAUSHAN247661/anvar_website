import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { useHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { formatINR } from "@/lib/utils";
import { Truck, CheckCircle, MapPin, Loader2 } from "lucide-react";
import { useState } from "react";

const checkoutSchema = z.object({
  name: z.string().min(2, "Full Name is required"),
  productName: z.string().min(2, "Product Name is required"),
  email: z.string().email("Invalid email"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  zip: z.string().min(5, "Valid ZIP code is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  productDetails: z.string().min(5, "Please add product details"),
  desiredCount: z.coerce.number().min(1, "Minimum 1 product"),
  locationLink: z.string().optional(),
});

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { addToHistory } = useHistory();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: "",
      productName: "",
      email: "",
      address: "",
      city: "",
      zip: "",
      phone: "",
      productDetails: "",
      desiredCount: 1,
      locationLink: "",
    },
  });

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setIsProcessing(true);
    try {
      addToHistory({
        total,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        customer: {
          name: values.name.trim(),
          address: `${values.address}, ${values.city}, ${values.zip}`,
          details: values.productDetails,
          desiredCount: values.desiredCount,
        }
      });
    localStorage.setItem("last_checkout_email", values.email);
    const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
    const r = await fetch(`${apiBase}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total,
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image
          })),
          customer: {
            name: values.name.trim(),
            email: values.email,
            address: `${values.address}, ${values.city}, ${values.zip}`,
            details: values.productDetails,
            desiredCount: values.desiredCount,
            phone: values.phone,
            locationLink: values.locationLink,
          },
          status: "pending",
        }),
      });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Failed to place order");
      toast({
        title: "Order Placed Successfully!",
        description: `Thank you, ${values.name}. Your order for ${formatINR(total)} has been saved.`,
        duration: 5000,
      });
      clearCart();
      setLocation("/history");
    } catch (e: any) {
      toast({ title: e?.message || "Failed to place order", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
          
          // Update form with coordinates and generate link
          form.setValue("address", `${lat}, ${lng} (Current Location)`);
          form.setValue("city", "Detected City");
          form.setValue("zip", "12345");
          form.setValue("locationLink", googleMapsLink);
          
          toast({
            title: "Location Found",
            description: "Address updated and Google Maps link generated.",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to get location details",
            variant: "destructive",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        toast({
          title: "Location Error",
          description: "Unable to retrieve your location. Please allow access.",
          variant: "destructive",
        });
      }
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-3xl font-display font-bold mb-4">Your Cart is Empty</h1>
          <Button onClick={() => setLocation("/")}>Continue Shopping</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="mb-10">
          <h1 className="text-4xl font-display font-bold text-white">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Shipping Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-white/5 p-6 rounded-xl"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Truck className="text-primary" /> Shipping Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productName"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel className="text-white">Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" placeholder="(555) 000-0000" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Address</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">City</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="productDetails"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Product Details</FormLabel>
                          <FormControl>
                            <textarea {...field} rows={3} className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="desiredCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">How Many Products</FormLabel>
                          <FormControl>
                            <Input type="number" value={typeof field.value === "number" ? field.value : 1} onChange={(e) => field.onChange(Number(e.target.value))} className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locationLink"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-white">Location Link (Google Maps)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://maps.google.com/..." className="bg-white/5 border-white/10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>

                <Button type="submit" size="lg" className="w-full bg-primary text-background hover:bg-primary/90 font-bold text-lg h-14" disabled={isProcessing}>
                  {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</> : <>Complete Order (₹{total})</>}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl sticky top-24 backdrop-blur-md">
              <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-start">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded bg-background/50" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{item.name}</h4>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                        <span className="text-sm font-bold text-primary">{formatINR(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10 mt-2">
                  <span>Total</span>
                  <span>{formatINR(total)}</span>
                </div>
              </div>

              <div className="mt-6 bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center gap-3">
                <span className="text-xs text-primary">Secure Checkout</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Completing your order...</span>
          </div>
        </div>
      )}
    </div>
  );
}
