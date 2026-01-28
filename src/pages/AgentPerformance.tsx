/**
 * Página de Observabilidade do Agente de IA
 * 
 * Exibe métricas de performance:
 * - Volume de mensagens e respostas
 * - Tempo médio de resposta
 * - Ações de onboarding
 * - Mensagens sem resposta (inbox health)
 * 
 * SOMENTE LEITURA - não altera regras de negócio
 */

import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { useAgentPerformance, PeriodFilter } from '@/hooks/useAgentPerformance';
import { StageBadge } from '@/components/ui/StageBadge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Users, 
  UserCheck,
  RefreshCw,
  Inbox
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function formatSeconds(seconds: number | null): string {
  if (seconds === null) return '—';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${Math.round(seconds / 3600)}h`;
}

function formatSecondsLong(seconds: number): string {
  if (seconds < 60) return `${seconds} segundos`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}min`;
}

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  '24h': 'Últimas 24 horas',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
};

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  group_invite_sent: { label: 'Convite Enviado', icon: <Send className="h-4 w-4" /> },
  group_join_confirmed: { label: 'Entrada Confirmada', icon: <UserCheck className="h-4 w-4" /> },
  welcome_sent: { label: 'Boas-vindas', icon: <CheckCircle2 className="h-4 w-4" /> },
};

export default function AgentPerformance() {
  const {
    kpis,
    inboxHealth,
    recentResponses,
    onboardingActions,
    loading,
    error,
    period,
    setPeriod,
    refetch,
  } = useAgentPerformance();

  const hasData = kpis.messagesReceived > 0 || kpis.aiResponses > 0 || onboardingActions.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Performance do Agente
            </h1>
            <p className="text-muted-foreground mt-1">
              Observabilidade e métricas do agente de IA
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">{PERIOD_LABELS['24h']}</SelectItem>
                <SelectItem value="7d">{PERIOD_LABELS['7d']}</SelectItem>
                <SelectItem value="30d">{PERIOD_LABELS['30d']}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Mensagens Recebidas"
            value={kpis.messagesReceived}
            icon={<MessageSquare className="h-6 w-6" />}
          />
          <MetricCard
            title="Respostas IA"
            value={kpis.aiResponses}
            icon={<Bot className="h-6 w-6" />}
          />
          <MetricCard
            title="Sem Resposta"
            value={`${kpis.percentWithoutResponse}%`}
            icon={<AlertCircle className="h-6 w-6" />}
          />
          <MetricCard
            title="Tempo Médio Resposta"
            value={formatSeconds(kpis.avgResponseTimeSeconds)}
            icon={<Clock className="h-6 w-6" />}
          />
        </div>

        {/* Onboarding Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Convites do Grupo"
            value={kpis.groupInvitesSent}
            icon={<Send className="h-6 w-6" />}
          />
          <MetricCard
            title="Entradas Confirmadas"
            value={kpis.groupJoinsConfirmed}
            icon={<UserCheck className="h-6 w-6" />}
          />
          <MetricCard
            title="Boas-vindas Enviadas"
            value={kpis.welcomesSent}
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        </div>

        {!hasData && !loading ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Sem dados no período
            </h3>
            <p className="text-muted-foreground">
              Nenhuma atividade do agente registrada em {PERIOD_LABELS[period].toLowerCase()}.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="inbox" className="space-y-4">
            <TabsList>
              <TabsTrigger value="inbox" className="gap-2">
                <Inbox className="h-4 w-4" />
                Saúde do Inbox
                {inboxHealth.length > 0 && (
                  <span className="ml-1 text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full">
                    {inboxHealth.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="responses" className="gap-2">
                <Bot className="h-4 w-4" />
                Respostas IA
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="gap-2">
                <Users className="h-4 w-4" />
                Ações Onboarding
              </TabsTrigger>
            </TabsList>

            {/* Inbox Health Table */}
            <TabsContent value="inbox">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Mensagens Sem Resposta
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mensagens inbound que ainda não receberam resposta do agente
                  </p>
                </div>
                {inboxHealth.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    Todas as mensagens foram respondidas! 🎉
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lead</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estágio</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recebida em</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Tempo Esperando</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inboxHealth.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-3 px-4">
                              <div>
                                <span className="font-medium text-foreground">{item.lead.name}</span>
                                <span className="block text-xs text-muted-foreground">{item.lead.whatsapp}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <StageBadge stage={item.lead.stage} />
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {format(parseISO(item.inboundAt), "dd/MM HH:mm", { locale: ptBR })}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-sm font-medium ${
                                item.secondsSinceInbound > 3600 
                                  ? 'text-destructive' 
                                  : item.secondsSinceInbound > 1800 
                                    ? 'text-warning' 
                                    : 'text-muted-foreground'
                              }`}>
                                {formatSecondsLong(item.secondsSinceInbound)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AI Responses Table */}
            <TabsContent value="responses">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    Últimas Respostas do Agente
                  </h2>
                </div>
                {recentResponses.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma resposta do agente no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lead</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estágio</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Resposta (preview)</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentResponses.map((item, idx) => (
                          <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-3 px-4">
                              <span className="font-medium text-foreground">{item.lead.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <StageBadge stage={item.lead.stage} />
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <span className="text-sm text-muted-foreground line-clamp-2">
                                {item.reply || '—'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm whitespace-nowrap">
                              {formatDistanceToNow(parseISO(item.createdAt), {
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
            </TabsContent>

            {/* Onboarding Actions Table */}
            <TabsContent value="onboarding">
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Ações de Onboarding
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Convites enviados e confirmações de entrada no grupo
                  </p>
                </div>
                {onboardingActions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhuma ação de onboarding no período selecionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lead</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ação</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardingActions.map((item, idx) => {
                          const actionConfig = ACTION_TYPE_LABELS[item.actionType] || {
                            label: item.actionType,
                            icon: <CheckCircle2 className="h-4 w-4" />,
                          };
                          return (
                            <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                              <td className="py-3 px-4">
                                <span className="font-medium text-foreground">{item.lead.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-2 text-sm">
                                  {actionConfig.icon}
                                  {actionConfig.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-muted-foreground text-sm">
                                {format(parseISO(item.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
