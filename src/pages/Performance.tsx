import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, MessageSquare, Users, Target, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface FunnelItem {
  name: string;
  value: number;
  fill: string;
}

interface FollowUpItem {
  name: string;
  sent: number;
  responses: number;
  conversions: number;
}

export default function Performance() {
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [activeLeads, setActiveLeads] = useState(0);
  const [conversionFunnel, setConversionFunnel] = useState<FunnelItem[]>([]);
  const [followUpPerformance, setFollowUpPerformance] = useState<FollowUpItem[]>([]);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    async function fetchPerformanceData() {
      setLoading(true);

      // Fetch leads count by stage with refined colors
      const stages = [
        { stage: 'captured_form', name: 'Captados', fill: 'hsl(210, 75%, 55%)' },
        { stage: 'checkout_started', name: 'Checkout', fill: 'hsl(262, 45%, 55%)' },
        { stage: 'payment_pending', name: 'Pagamento', fill: 'hsl(38, 90%, 55%)' },
        { stage: 'subscribed_active', name: 'Ativos', fill: 'hsl(152, 55%, 45%)' }
      ];

      const funnelResults = await Promise.all(
        stages.map(async ({ stage, name, fill }) => {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('stage', stage);
          return { name, value: count || 0, fill };
        })
      );

      setConversionFunnel(funnelResults);
      
      const total = funnelResults.reduce((sum, item) => sum + item.value, 0);
      setTotalLeads(total);
      setActiveLeads(funnelResults.find(f => f.name === 'Ativos')?.value || 0);
      setHasData(total > 0);

      // Try to fetch message_queue performance data
      try {
        const { data: queueData } = await supabase
          .from('message_queue')
          .select('template_key, status')
          .in('status', ['sent', 'scheduled', 'canceled']);

        if (queueData && queueData.length > 0) {
          const performanceMap = new Map<string, { sent: number; responses: number; conversions: number }>();
          
          queueData.forEach(item => {
            const key = item.template_key || 'unknown';
            if (!performanceMap.has(key)) {
              performanceMap.set(key, { sent: 0, responses: 0, conversions: 0 });
            }
            if (item.status === 'sent') {
              performanceMap.get(key)!.sent++;
            }
          });

          const performanceData: FollowUpItem[] = Array.from(performanceMap.entries())
            .slice(0, 5)
            .map(([name, data]) => ({
              name: name.replace(/_/g, ' ').substring(0, 10),
              ...data
            }));

          setFollowUpPerformance(performanceData);
        }
      } catch (err) {
        console.log('Could not fetch message_queue performance:', err);
      }

      setLoading(false);
    }

    fetchPerformanceData();
  }, []);

  const conversionRate = totalLeads > 0 ? Math.round((activeLeads / totalLeads) * 100) : 0;

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {entry.name}: <span className="font-semibold text-foreground">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-accent" />
            </div>
            <span className="heading-display">Performance</span>
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Análise de conversão e efetividade dos follow-ups
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Total de Leads"
            value={totalLeads}
            icon={<Users className="h-6 w-6" />}
            variant="info"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon={<Target className="h-6 w-6" />}
            variant="purple"
          />
          <MetricCard
            title="Clientes Ativos"
            value={activeLeads}
            icon={<TrendingUp className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Follow-ups Enviados"
            value={followUpPerformance.reduce((sum, f) => sum + f.sent, 0)}
            icon={<MessageSquare className="h-6 w-6" />}
            variant="warning"
          />
        </div>

        {!hasData && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon inline-block">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sem dados suficientes
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Os gráficos de performance serão exibidos quando houver dados de leads e follow-ups no sistema.
            </p>
          </div>
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Follow-up Performance */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  Performance por Follow-up
                </h2>
                {followUpPerformance.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="empty-state-icon inline-block mb-4">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum follow-up enviado ainda
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={followUpPerformance}>
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(220, 10%, 45%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(220, 10%, 45%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="sent" 
                        name="Enviados" 
                        fill="hsl(42, 65%, 58%)" 
                        radius={[6, 6, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Conversion Funnel */}
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                    <Target className="h-4 w-4 text-accent" />
                  </div>
                  Funil de Conversão
                </h2>
                {conversionFunnel.every(f => f.value === 0) ? (
                  <div className="py-12 text-center">
                    <div className="empty-state-icon inline-block mb-4">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum lead no funil
                    </p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={conversionFunnel.filter(f => f.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {conversionFunnel.filter(f => f.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {conversionFunnel.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-sm text-muted-foreground">
                            {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Detailed Stats Table */}
            {followUpPerformance.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-accent" />
                    </div>
                    Detalhamento por Template de Follow-up
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Template</th>
                        <th className="text-center py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enviados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followUpPerformance.map((item, index) => (
                        <tr 
                          key={item.name} 
                          className="border-b border-border/50 table-row-premium animate-slide-up"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="py-4 px-6 font-medium text-foreground">{item.name}</td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold text-sm">
                              {item.sent}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}