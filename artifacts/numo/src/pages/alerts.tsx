import { useGetAlerts, useGetAlertHistory, useDeleteAlert, useSnoozeAlert } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Clock, CheckCircle2, TrendingUp, TrendingDown, Activity, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function Alerts() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading: loadingAlerts } = useGetAlerts({ query: { queryKey: ["/api/alerts"] } });
  const { data: history, isLoading: loadingHistory } = useGetAlertHistory({ query: { queryKey: ["/api/alerts/history"] } });

  const deleteMutation = useDeleteAlert({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }) }
  });

  const snoozeMutation = useSnoozeAlert({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }) }
  });

  const getAlertMeta = (type: string) => {
    switch (type) {
      case "price_above": return { icon: TrendingUp, color: "text-success", bg: "bg-success/10" };
      case "price_below": return { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" };
      case "pct_change": return { icon: Activity, color: "text-yellow-400", bg: "bg-yellow-400/10" };
      default: return { icon: Bell, color: "text-primary", bg: "bg-primary/10" };
    }
  };

  const getAlertDescription = (alert: any) => {
    if (alert.alertType === "price_above") return `Notify when price goes above ${formatCurrency(alert.targetPrice)}`;
    if (alert.alertType === "price_below") return `Notify when price drops below ${formatCurrency(alert.targetPrice)}`;
    if (alert.alertType === "pct_change") return `Notify on ${formatPercentage(alert.pctThreshold)} move`;
    return "Unknown alert type";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Notifications</p>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        </div>
        <Button className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" /> New Alert
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-auto mb-6 p-1">
          <TabsTrigger value="active" className="px-6">
            Active
            {Array.isArray(alerts) && alerts.length > 0 && (
              <span className="ml-2 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {alerts.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="px-6">History</TabsTrigger>
        </TabsList>

        {/* Active Alerts */}
        <TabsContent value="active" className="space-y-3">
          {loadingAlerts ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : !Array.isArray(alerts) || alerts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">No active alerts</h3>
              <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
                Set up alerts to get notified when assets hit your target prices.
              </p>
              <Button size="sm"><Plus className="w-3.5 h-3.5 mr-1.5" /> Create First Alert</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => {
                const meta = getAlertMeta(alert.alertType);
                const AlertIcon = meta.icon;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-secondary/20 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", meta.bg)}>
                        <AlertIcon className={cn("w-5 h-5", meta.color)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base">{alert.ticker}</span>
                          {!alert.isActive && (
                            <Badge variant="secondary" className="text-[10px] py-0">Snoozed</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{getAlertDescription(alert)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {alert.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => snoozeMutation.mutate({ id: alert.id, data: { duration: "24h" } })}
                        >
                          <Clock className="w-3 h-3 mr-1.5" /> Snooze 24h
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                          Snoozed until {alert.snoozedUntil ? new Date(alert.snoozedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => deleteMutation.mutate({ id: alert.id })}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : !Array.isArray(history) || history.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold mb-1">No alert history</h3>
              <p className="text-sm text-muted-foreground">Triggered alerts will appear here.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/40 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Asset</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3 text-right">Price at Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {history.map((entry) => {
                    const meta = getAlertMeta(entry.alertType);
                    const EntryIcon = meta.icon;
                    return (
                      <tr key={entry.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {new Date(entry.triggeredAt).toLocaleString(undefined, {
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                        <td className="px-6 py-4 font-bold">{entry.ticker}</td>
                        <td className="px-6 py-4">
                          <div className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md font-medium", meta.bg, meta.color)}>
                            <EntryIcon className="w-3 h-3" />
                            {entry.alertType.replace("_", " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold tabular-nums">
                          {formatCurrency(entry.priceAtTrigger)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
