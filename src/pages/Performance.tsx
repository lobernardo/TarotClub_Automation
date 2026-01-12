import { AppLayout } from '@/components/layout/AppLayout';
import { BarChart3, TrendingUp, MessageSquare, Users, Target, Zap } from 'lucide-react';
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

// Mock performance data
const followUpPerformance = [
  { name: 'D+2', sent: 45, responses: 12, conversions: 3 },
  { name: 'D+4', sent: 38, responses: 8, conversions: 2 },
  { name: 'D+7', sent: 32, responses: 10, conversions: 4 },
  { name: 'D+15', sent: 25, responses: 5, conversions: 1 },
  { name: '+30min', sent: 28, responses: 15, conversions: 8 }
];

const conversionFunnel = [
  { name: 'Captados', value: 100, fill: 'hsl(199, 89%, 48%)' },
  { name: 'Checkout', value: 45, fill: 'hsl(280, 67%, 55%)' },
  { name: 'Pagamento', value: 28, fill: 'hsl(38, 92%, 50%)' },
  { name: 'Ativos', value: 20, fill: 'hsl(142, 71%, 45%)' }
];

export default function Performance() {
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
            title="Taxa de Resposta"
            value="28%"
            change={5}
            changeLabel="vs semana anterior"
            icon={<MessageSquare className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Taxa de Conversão"
            value="20%"
            change={2.5}
            changeLabel="vs semana anterior"
            icon={<Target className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Tempo Médio de Resposta"
            value="4.2h"
            change={-15}
            changeLabel="mais rápido"
            icon={<Zap className="h-6 w-6 text-primary" />}
          />
          <MetricCard
            title="Leads Ativos"
            value="68"
            change={12}
            changeLabel="vs semana anterior"
            icon={<Users className="h-6 w-6 text-primary" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Follow-up Performance */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance por Follow-up
            </h2>
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
                <Bar dataKey="responses" name="Respostas" fill="hsl(43, 74%, 49%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="conversions" name="Conversões" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Funil de Conversão
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionFunnel}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conversionFunnel.map((entry, index) => (
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
          </div>
        </div>

        {/* Detailed Stats Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Detalhamento por Etapa de Follow-up</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Etapa</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Enviados</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Respostas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Taxa Resposta</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Conversões</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Taxa Conversão</th>
                </tr>
              </thead>
              <tbody>
                {followUpPerformance.map((item) => {
                  const responseRate = ((item.responses / item.sent) * 100).toFixed(1);
                  const conversionRate = ((item.conversions / item.sent) * 100).toFixed(1);
                  return (
                    <tr key={item.name} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground">{item.name}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.sent}</td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.responses}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-primary font-medium">{responseRate}%</span>
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">{item.conversions}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-400 font-medium">{conversionRate}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
