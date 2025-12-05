import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "./data";

interface HistoryItem {
  id: string;
  date: string;
  total: number;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  customer: {
    name: string;
    address: string;
    details?: string;
    desiredCount?: number;
  };
}

interface HistoryContextType {
  history: HistoryItem[];
  addToHistory: (item: Omit<HistoryItem, "id" | "date">) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem("order_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as any[];
        const migrated = Array.isArray(parsed)
          ? parsed.map((h) => {
              if (h?.customer && ("firstName" in h.customer || "lastName" in h.customer)) {
                const name = [h.customer.firstName, h.customer.lastName].filter(Boolean).join(" ").trim();
                return {
                  ...h,
                  customer: {
                    name,
                    address: h.customer.address,
                    details: h.customer.details,
                  },
                } as HistoryItem;
              }
              return h as HistoryItem;
            })
          : [];
        setHistory(migrated);
      } catch (e) {
        console.error("Failed to parse history from localStorage");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("order_history", JSON.stringify(history));
  }, [history]);

  const addToHistory = (item: Omit<HistoryItem, "id" | "date">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
    };
    setHistory((prev) => [newItem, ...prev]);
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addToHistory, removeFromHistory, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
}
