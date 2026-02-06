import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { STAGE_CONFIG, LeadStage, Lead } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, TrendingUp, Activity, Sparkles, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StageBadge } from "@/components/ui/StageBadge";

export default function Dashboard() {
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [activeClients, setActiveClients] = useState<number>(0);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [funnelData, setFunnelData] = useState<
    { stage: LeadStage; count: number; config: (typeof STAGE_CONFIG)[LeadStage] }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);

      // Fetch all leads
      const { data: leadsData, count: totalCount } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(5);

      if (totalCount !== null) {
        setTotalLeads(totalCount);
      }

      if (leadsData) {
        setRecentLeads(leadsData as Lead[]);
      }

      // Active clients (stage = subscribed_active)
      const { count: activeCount } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("stage", "subscribed_active");

      if (activeCount !== null) {
        setActiveClients(activeCount);
      }

      // Funnel data - count leads by stage
      const funnelStages: LeadStage[] = ["captured_form", "checkout_started", "payment_pending", "subscribed_active"];
      const funnelResults = await Promise.all(
        funnelStages.map(async (stage) => {
          const { count } = await supabase.from("leads").select("*", { count: "exact", head: true }).eq("stage", stage);
          return {
            stage,
            count: count || 0,
            config: STAGE_CONFIG[stage],
          };
        }),
      );
      setFunnelData(funnelResults);

      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  // Calculate conversion rate
  const conversionRate = totalLeads > 0 ? Math.round((activeClients / totalLeads) * 100) : 0;
  const maxFunnelCount = Math.max(...funnelData.map((f) => f.count), 1);

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <span className="heading-display">Dashboard</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Visão geral do Clube do Tarot Veranah Alma
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Sistema operacional</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <MetricCard 
            title="Total de Leads" 
            value={totalLeads} 
            icon={<Users className="h-6 w-6" />}
            variant="info"
          />
          <MetricCard
            title="Clientes Ativos"
            value={activeClients}
            icon={<UserCheck className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel Overview */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <Activity className="h-4 w-4 text-accent" />
              </div>
              Funil de Conversão
            </h2>
            {funnelData.length === 0 && !loading ? (
              <div className="empty-state">
                <div className="empty-state-icon inline-block">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum lead no funil</h3>
                <p className="text-muted-foreground text-sm">
                  Os leads aparecerão aqui quando forem capturados.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {funnelData.map((item, index) => {
                  const percentage = maxFunnelCount > 0 ? (item.count / maxFunnelCount) * 100 : 0;
                  const stageColors: Record<LeadStage, string> = {
                    captured_form: "from-info to-info/70",
                    checkout_started: "from-purple to-purple/70",
                    payment_pending: "from-warning to-warning/70",
                    subscribed_active: "from-success to-success/70",
                    conectado: "from-info to-info/70",
                    subscribed_onboarding: "from-accent to-accent/70",
                    subscribed_past_due: "from-warning to-warning/70",
                    subscribed_canceled: "from-destructive to-destructive/70",
                    nurture: "from-purple to-purple/70",
                    lost: "from-muted-foreground to-muted-foreground/70",
                    blocked: "from-muted-foreground to-muted-foreground/70",
                    lead_captured: "from-info to-info/70",
                    agent_captured: "from-info to-info/70",
                  };

                  return (
                    <div key={item.stage} className="space-y-2.5 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {index + 1}
                          </span>
                          <StageBadge stage={item.stage} />
                        </div>
                        <span className="font-bold text-foreground text-lg">{item.count}</span>
                      </div>
                      <div className="progress-premium ml-9">
                        <div
                          className={`progress-premium-bar bg-gradient-to-r ${stageColors[item.stage] || "from-accent to-accent/70"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status da Fase 1 */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-accent" />
              </div>
              Status da Fase 1
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Captura na landing page → CRM (lead em “captured_form”).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Checkout Asaas via URL (lead em “checkout_started”).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Pagamento confirmado → “subscribed_active” + boas‑vindas.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <Users className="h-4 w-4 text-accent" />
              </div>
              Leads Recentes
            </h2>
            <a 
              href="/crm" 
              className="text-sm text-accent hover:text-accent/80 transition-colors font-medium flex items-center gap-1"
            >
              Ver todos
              <span className="text-lg">→</span>
            </a>
          </div>
          {recentLeads.length === 0 ? (
            <div className="empty-state m-6">
              <div className="empty-state-icon inline-block">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum lead encontrado</h3>
              <p className="text-muted-foreground text-sm">
                Os leads aparecerão aqui quando forem capturados pelo sistema.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nome</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Captado em</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className="border-b border-border/50 table-row-premium cursor-pointer animate-slide-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="avatar-premium h-9 w-9 text-sm">
                            {lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">{lead.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{lead.email}</td>
                      <td className="py-4 px-6 text-muted-foreground">{lead.whatsapp}</td>
                      <td className="py-4 px-6">
                        <StageBadge stage={lead.stage} />
                      </td>
                      <td className="py-4 px-6 text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(lead.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
