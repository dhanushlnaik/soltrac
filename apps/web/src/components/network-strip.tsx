"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Zap, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
const CONGESTION_CONFIG = {
  LOW:      { color: "text-green-400",  dotColor: "bg-green-400",  label: "Low" },
  MODERATE: { color: "text-amber-400",  dotColor: "bg-amber-400",  label: "Moderate" },
  HIGH:     { color: "text-red-400",    dotColor: "bg-red-400",    label: "High" },
  CRITICAL: { color: "text-red-500",    dotColor: "bg-red-500",    label: "Critical" },
};

type NetworkData = {
  tps: number;
  congestionLabel: keyof typeof CONGESTION_CONFIG;
  feeTiers: { label: string; priorityFeeMicroLamports: number }[];
};

export default function NetworkStrip() {
  const [status, setStatus] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/network");
        const data = await res.json();
        if (data.success) {
          setStatus(data.data);
        }
      } catch {
        // Silently fail — network strip is non-critical
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 mt-6">
        <div className="flex items-center justify-center gap-6 rounded-xl border border-border/20 bg-card/40 backdrop-blur-sm px-5 py-3">
          <div className="h-3 w-20 rounded shimmer" />
          <div className="h-3 w-16 rounded shimmer" />
          <div className="h-3 w-24 rounded shimmer" />
        </div>
      </div>
    );
  }

  if (!status) return null;

  const congestion = CONGESTION_CONFIG[status.congestionLabel] ?? CONGESTION_CONFIG.LOW;
  const standardFee = status.feeTiers.find((t) => t.label === "standard")?.priorityFeeMicroLamports ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-2xl mx-auto px-4 mt-6"
    >
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 rounded-xl border border-border/20 bg-card/40 backdrop-blur-sm px-5 py-3">
        {/* Congestion */}
        <div className="flex items-center gap-2">
          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Congestion:</span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              congestion.color
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  congestion.dotColor,
                  (status.congestionLabel === "HIGH" || status.congestionLabel === "CRITICAL") && "animate-ping"
                )}
              />
              <span
                className={cn(
                  "relative inline-flex h-1.5 w-1.5 rounded-full",
                  congestion.dotColor
                )}
              />
            </span>
            {congestion.label}
          </span>
        </div>

        {/* TPS */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">TPS:</span>
          <span className="text-xs font-medium text-foreground font-mono">
            {status.tps.toLocaleString()}
          </span>
        </div>

        {/* Recommended Fee */}
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Fee:</span>
          <span className="text-xs font-medium text-foreground font-mono">
            {standardFee > 0 ? `${standardFee.toLocaleString()} μL` : "Standard"}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
