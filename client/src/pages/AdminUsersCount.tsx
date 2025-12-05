import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { setDocumentMeta, setCanonical, setNoIndex } from "@/lib/utils";

export default function AdminUsersCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setDocumentMeta("Admin • Visitors • NexTech", "View total visitors tracked.");
    setCanonical();
    setNoIndex();
    const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
    fetch(`${API}/admin/users-count`).then((r) => r.json()).then((d) => setCount(d.totalUsers || 0)).catch(() => {});
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-md">
        <h1 className="text-3xl font-display font-bold text-white mb-6">Visitors</h1>
        <div className="bg-card border border-white/5 p-6 rounded-xl text-center">
          <div className="text-sm text-muted-foreground">Total Users</div>
          <div className="text-4xl font-bold text-white">{count}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
