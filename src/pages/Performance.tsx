import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, MessageSquare, Users, Target, Zap, AlertCircle } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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

      // Fetch leads count by stage
      const stages = [
        { stage: 'captured_form', name: 'Captados', fill: 'hsl(199, 89%, 48%)' },
        { stage: 'checkout_started', name: 'Checkout', fill: 'hsl(280, 67%, 55%)' },
        { stage: 'payment_pending', name: 'Pagamento', fill: 'hsl(38, 92%, 50%)' },
        { stage: 'subscribed_active', name: 'Ativos', fill: 'hsl(142, 71%, 45%)' }
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
          // Group by template_key to get performance
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Performance
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de conversão e efetividade dos follow-ups
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Leads"
            value={totalLeads}
            icon={<Users className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${conversionRate}%`}
            icon={<Target className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Clientes Ativos"
            value={activeLeads}
            icon={<TrendingUp className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Follow-ups Enviados"
            value={followUpPerformance.reduce((sum, f) => sum + f.sent, 0)}
            icon={<MessageSquare className="h-6 w-6 text-primary" />}
          />
        </div>

        {!hasData && !loading ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sem dados suficientes
            </h3>
            <p className="text-muted-foreground">
              Os gráficos de performance serão exibidos quando houver dados de leads e follow-ups no sistema.
            </p>
          </div>
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Follow-up Performance */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance por Follow-up
                </h2>
                {followUpPerformance.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum follow-up enviado ainda
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={followUpPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 25%, 18%)" />
                      <XAxis 
                        dataKey="name" 
                        stroke="hsl(220, 15%, 55%)"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(220, 15%, 55%)"
                        fontSize={12}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(222, 40%, 10%)',
                          border: '1px solid hsl(222, 25%, 18%)',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="sent" name="Enviados" fill="hsl(222, 30%, 40%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Conversion Funnel */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Funil de Conversão
                </h2>
                {conversionFunnel.every(f => f.value === 0) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum lead no funil
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={conversionFunnel.filter(f => f.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {conversionFunnel.filter(f => f.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(222, 40%, 10%)',
                            border: '1px solid hsl(222, 25%, 18%)',
                            borderRadius: '8px'
                          }}
                        />
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
                            {item.name}: {item.value}
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
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground">Detalhamento por Template de Follow-up</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Template</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Enviados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followUpPerformance.map((item) => (
                        <tr key={item.name} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="py-3 px-4 font-medium text-foreground">{item.name}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{item.sent}</td>
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
