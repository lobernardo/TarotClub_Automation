import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { dashboardMetrics, mockLeads, mockEvents } from '@/data/mockData';
import { STAGE_CONFIG, LeadStage } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Clock,
  Calendar,
  Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StageBadge } from '@/components/ui/StageBadge';

export default function Dashboard() {
  const [totalLeads, setTotalLeads] = useState<number>(0);
  const [activeClients, setActiveClients] = useState<number>(0);

  useEffect(() => {
    async function fetchMetrics() {
      // Total leads
      const { count: totalCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      
      if (totalCount !== null) {
        setTotalLeads(totalCount);
      }

      // Active clients (stage = subscribed_active)
      const { count: activeCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'subscribed_active');
      
      if (activeCount !== null) {
        setActiveClients(activeCount);
      }
    }
    fetchMetrics();
  }, []);

  // Recent leads
  const recentLeads = [...mockLeads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Recent events
  const recentEvents = [...mockEvents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Funnel data
  const funnelStages: LeadStage[] = ['captured_form', 'checkout_started', 'payment_pending', 'subscribed_active'];
  const funnelData = funnelStages.map(stage => ({
    stage,
    count: mockLeads.filter(l => l.stage === stage).length,
    config: STAGE_CONFIG[stage]
  }));

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do Clube do Tarot Veranah Alma
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Leads"
            value={totalLeads}
            change={12}
            changeLabel="vs mês anterior"
            icon={<Users className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Clientes Ativos"
            value={activeClients}
            change={8}
            changeLabel="vs mês anterior"
            icon={<UserCheck className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${dashboardMetrics.conversionRate}%`}
            change={2.5}
            changeLabel="vs mês anterior"
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Follow-ups Pendentes"
            value={dashboardMetrics.pendingFollowUps}
            icon={<Clock className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Funnel Overview */}
          <div className="lg:col-span-2 glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Funil de Conversão
            </h2>
            <div className="space-y-4">
              {funnelData.map((item, index) => {
                const maxCount = Math.max(...funnelData.map(f => f.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                
                return (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                        <StageBadge stage={item.stage} />
                      </div>
                      <span className="font-semibold text-foreground">{item.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden ml-9">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Atividade Recente
            </h2>
            <div className="space-y-4">
              {recentEvents.map((event) => {
                const lead = mockLeads.find(l => l.id === event.lead_id);
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse-glow" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{lead?.name || 'Lead'}</span>
                        {' — '}
                        <span className="text-muted-foreground">
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(event.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Leads Table */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Leads Recentes
            </h2>
            <a
              href="/crm"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estágio</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Captado em</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">{lead.name}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.email}</td>
                    <td className="py-3 px-4 text-muted-foreground">{lead.phone}</td>
                    <td className="py-3 px-4">
                      <StageBadge stage={lead.stage} />
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(lead.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
