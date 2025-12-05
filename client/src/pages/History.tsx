import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useHistory } from "@/lib/history";
import { Button } from "@/components/ui/button";
import { Trash2, Download, ShoppingBag, Calendar, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEffect, useRef, useState } from "react";

export default function History() {
  const { history, removeFromHistory, clearHistory } = useHistory();
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<string | null>(null);
  const [remoteOrders, setRemoteOrders] = useState<any[] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    const email = localStorage.getItem("last_checkout_email");
    if (email) {
      const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const load = () => {
        fetch(`${API}/orders?email=${encodeURIComponent(email)}`)
          .then((r) => r.json())
          .then((d) => setRemoteOrders(Array.isArray(d) ? d : []))
          .catch(() => setRemoteOrders([]));
      };
      load();
      const wsUrl = API.replace(/^http/, "ws");
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === "orders_changed") load();
        } catch {}
      };
      ws.onclose = () => { wsRef.current = null; };
      return () => { ws.close(); };
    }
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Order History - NexTech Electronics", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), "PPpp")}`, 14, 30);

    let yPos = 40;

    history.forEach((order, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`Order #${order.id.toUpperCase()}`, 14, yPos);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Date: ${format(new Date(order.date), "PPp")}`, 14, yPos + 6);
      doc.text(`Total: ${formatINR(order.total)}`, 14, yPos + 12);
      doc.text(`Ship To: ${order.customer.name}, ${order.customer.address}`, 14, yPos + 18);

      const tableBody = order.items.map(item => [
        item.name,
        item.quantity,
        `${formatINR(item.price)}`,
        `${formatINR(item.price * item.quantity)}`
      ]);

      autoTable(doc, {
        startY: yPos + 25,
        head: [['Item', 'Qty', 'Price', 'Total']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [6, 182, 212] },
      });

      // @ts-ignore
      yPos = doc.lastAutoTable.finalY + 20;
    });

    doc.save("nextech-order-history.pdf");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Order History</h1>
            <p className="text-muted-foreground">View and manage your past purchases.</p>
          </div>
          
          {history.length > 0 ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={downloadPDF} className="gap-2 border-white/20 hover:bg-white/10">
                <Download className="w-4 h-4" /> Download PDF
              </Button>
              <Button variant="destructive" onClick={() => setIsClearOpen(true)} className="gap-2">
                <Trash2 className="w-4 h-4" /> Clear All
              </Button>
            </div>
          ) : null}
        </div>

        {(remoteOrders && remoteOrders.length === 0) && history.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
            <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to fill your history with amazing tech.</p>
            <Button asChild className="bg-primary text-background hover:bg-primary/90 font-bold">
              <a href="/products">Browse Products</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {remoteOrders && remoteOrders.length > 0 && history.length === 0 && (
              <div className="text-xs text-muted-foreground mb-2">These orders are managed by admin and cannot be cleared here.</div>
            )}
            {(remoteOrders && remoteOrders.length > 0 ? remoteOrders : history).map((order: any) => (
              <div key={order.id || order._id} className="bg-card border border-white/5 rounded-xl p-6 hover:border-primary/30 transition-all">
                <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-primary font-mono font-bold text-lg">#{(order.id || order._id || "").toString().toUpperCase()}</span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{order.status || "delivered"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(order.date || order.createdAt), "PPP 'at' p")}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{formatINR(order.total)}</div>
                    <div className="text-sm text-muted-foreground">{order.items.length} items</div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-4 mb-6">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded bg-white/5 overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{formatINR(item.price)} x {item.quantity}</p>
                      </div>
                      <div className="font-bold text-sm text-white">
                        {formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="text-xs text-muted-foreground max-w-[70%] truncate">
                    Ship to: {order.customer.address}
                  </div>
                  {order.id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsDeleteOpen(order.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Clear all history?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Do you want to clear all history?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsClearOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { clearHistory(); setIsClearOpen(false); }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!isDeleteOpen} onOpenChange={(open) => setIsDeleteOpen(open ? isDeleteOpen : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Delete this product?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from history?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { if (isDeleteOpen) removeFromHistory(isDeleteOpen); setIsDeleteOpen(null); }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
