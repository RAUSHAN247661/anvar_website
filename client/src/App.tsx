import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import ProductDetails from "@/pages/ProductDetails";
import Checkout from "@/pages/Checkout";
import History from "@/pages/History";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsersCount from "@/pages/AdminUsersCount";

import { CartProvider } from "@/lib/cart";
import { HistoryProvider } from "@/lib/history";
import ScrollToTop from "@/components/ScrollToTop";

function Router() {
  function AdminGuard({ component: C }: { component: React.ComponentType<any> }) {
    const [_, navigate] = useLocation();
    const ok = typeof window !== "undefined" && Boolean(localStorage.getItem("admin_token"));
    if (!ok) {
      navigate("/admin");
      return null;
    }
    return <C />;
  }
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/history" component={History} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin" component={() => { const [_, navigate] = useLocation(); useEffect(() => { navigate("/login"); }, []); return null; }} />
      <Route path="/admin/dashboard" component={() => <AdminGuard component={AdminDashboard} />} />
      <Route path="/admin/users-count" component={() => <AdminGuard component={AdminUsersCount} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/track`).catch(() => {});
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <HistoryProvider>
        <CartProvider>
          <ScrollToTop />
          <Router />
          <Toaster />
        </CartProvider>
      </HistoryProvider>
    </QueryClientProvider>
  );
}

export default App;
