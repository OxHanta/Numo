import { useGetAlerts, useGetAlertHistory, useDeleteAlert, useSnoozeAlert } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Trash2, Clock, CheckCircle2, AlertTriangle, PlayCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Alerts() {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading: loadingAlerts } = useGetAlerts({ query: { queryKey: ["/api/alerts"] } });
  const { data: history, isLoading: loadingHistory } = useGetAlertHistory({ query: { queryKey: ["/api/alerts/history"] } });

  const deleteMutation = useDeleteAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const snoozeMutation = useSnoozeAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  });

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "price_above": return <TrendingUp className="w-4 h-4 text-success" />;
      case "price_below": return <TrendingDown className="w-4 h-4 text-destructive" />;
      case "pct_change": return <Activity className="w-4 h-4 text-warning" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getAlertDescription = (alert: any) => {
    if (alert.alertType === "price_above") return `Goes above ${formatCurrency(alert.targetPrice)}`;
    if (alert.alertType === "price_below") return `Drops below ${formatCurrency(alert.targetPrice)}`;
    if (alert.alertType === "pct_change") return `Moves by ${formatPercentage(alert.pctThreshold)}`;
    return "Unknown alert";
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New Alert
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="active">Active Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {loadingAlerts ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : alerts?.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <Bell className="w-12 h-12 mx-auto text-muted mb-4" />
              <h3 className="text-lg font-medium mb-1">No active alerts</h3>
              <p className="text-muted-foreground mb-4">Set up alerts to get notified when assets hit your target prices.</p>
              <Button><Plus className="w-4 h-4 mr-2" /> Create First Alert</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {alerts?.map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{alert.ticker}</span>
                        {!alert.isActive && <Badge variant="secondary">Snoozed</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{getAlertDescription(alert)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {alert.isActive ? (
                      <Button variant="outline" size="sm" onClick={() => snoozeMutation.mutate({ id: alert.id, data: { duration: "24h" } })}>
                        <Clock className="w-4 h-4 mr-2" /> Snooze 24h
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Snoozed until {alert.snoozedUntil ? new Date(alert.snoozedUntil).toLocaleTimeString() : ""}
                      </Button>
                    )}
                    <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate({ id: alert.id })}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
             <div className="space-y-3">
             {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
           </div>
          ) : history?.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-lg">
              <CheckCircle2 className="w-12 h-12 mx-auto text-muted mb-4" />
              <h3 className="text-lg font-medium mb-1">No alert history</h3>
              <p className="text-muted-foreground">Your triggered alerts will appear here.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Trigger</th>
                    <th className="px-6 py-4 text-right">Price at Trigger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history?.map(entry => (
                    <tr key={entry.id} className="hover:bg-secondary/20">
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(entry.triggeredAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-bold">{entry.ticker}</td>
                      <td className="px-6 py-4">{entry.alertType}</td>
                      <td className="px-6 py-4 text-right font-medium tabular-nums">{formatCurrency(entry.priceAtTrigger)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Additional icons needed
import { TrendingUp, TrendingDown, Activity, Plus } from "lucide-react";
