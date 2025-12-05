import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { setDocumentMeta, setCanonical, setNoIndex } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [_, navigate] = useLocation();
  useEffect(() => {
    setDocumentMeta("Admin Login • NexTech", "Access the NexTech admin dashboard.");
    setCanonical();
    setNoIndex();
  }, []);
  async function onLogin() {
    try {
      const apiBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL) : "/api";
      const r = await fetch(`${apiBase}/admin/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const txt = await r.text();
      if (!r.ok) throw new Error(txt || "Invalid credentials");
      const data = JSON.parse(txt);
      if (data?.token) {
        localStorage.setItem("admin_token", data.token);
        navigate("/admin/dashboard");
      } else {
        throw new Error("Invalid response");
      }
    } catch (e: any) {
      toast({ title: e?.message || "Invalid credentials", variant: "destructive" });
    }
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-md">
        <div className="bg-card border border-white/5 p-6 rounded-xl shadow-lg">
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold text-white">Admin Login</h1>
            <p className="text-sm text-muted-foreground">Sign in to access the dashboard</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input aria-label="Admin email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Password</Label>
              <div className="relative">
                <Input aria-label="Admin password" type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button aria-label={showPassword ? "Hide password" : "Show password"} type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button className="w-full" onClick={onLogin}>Login</Button>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contact support if you need access</span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
