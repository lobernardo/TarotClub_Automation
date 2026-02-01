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
  Inbox,
  Sparkles
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

const ACTION_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  group_invite_sent: { label: 'Convite Enviado', icon: <Send className="h-4 w-4" />, color: 'text-info' },
  group_join_confirmed: { label: 'Entrada Confirmada', icon: <UserCheck className="h-4 w-4" />, color: 'text-success' },
  welcome_sent: { label: 'Boas-vindas', icon: <CheckCircle2 className="h-4 w-4" />, color: 'text-accent' },
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
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <Bot className="h-5 w-5 text-accent" />
              </div>
              <span className="heading-display">Performance do Agente</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Observabilidade e métricas do agente de IA
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
              <SelectTrigger className="w-[180px] bg-card border-border">
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
              className="bg-card border-border hover:bg-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-xl flex items-center gap-3 border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Mensagens Recebidas"
            value={kpis.messagesReceived}
            icon={<MessageSquare className="h-6 w-6" />}
            variant="info"
          />
          <MetricCard
            title="Respostas IA"
            value={kpis.aiResponses}
            icon={<Bot className="h-6 w-6" />}
            variant="purple"
          />
          <MetricCard
            title="Sem Resposta"
            value={`${kpis.percentWithoutResponse}%`}
            icon={<AlertCircle className="h-6 w-6" />}
            variant={kpis.percentWithoutResponse > 20 ? "danger" : "default"}
          />
          <MetricCard
            title="Tempo Médio Resposta"
            value={formatSeconds(kpis.avgResponseTimeSeconds)}
            icon={<Clock className="h-6 w-6" />}
            variant="success"
          />
        </div>

        {/* Onboarding Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            title="Convites do Grupo"
            value={kpis.groupInvitesSent}
            icon={<Send className="h-6 w-6" />}
            variant="info"
          />
          <MetricCard
            title="Entradas Confirmadas"
            value={kpis.groupJoinsConfirmed}
            icon={<UserCheck className="h-6 w-6" />}
            variant="success"
          />
          <MetricCard
            title="Boas-vindas Enviadas"
            value={kpis.welcomesSent}
            icon={<CheckCircle2 className="h-6 w-6" />}
          />
        </div>

        {!hasData && !loading ? (
          <div className="empty-state">
            <div className="empty-state-icon inline-block">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Sistema pronto
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nenhuma atividade do agente registrada em {PERIOD_LABELS[period].toLowerCase()}. 
              As métricas serão exibidas quando houver interações.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="inbox" className="space-y-5">
            <TabsList className="bg-secondary/50 p-1">
              <TabsTrigger value="inbox" className="gap-2 data-[state=active]:bg-card">
                <Inbox className="h-4 w-4" />
                Saúde do Inbox
                {inboxHealth.length > 0 && (
                  <span className="ml-1 text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-semibold">
                    {inboxHealth.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="responses" className="gap-2 data-[state=active]:bg-card">
                <Bot className="h-4 w-4" />
                Respostas IA
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="gap-2 data-[state=active]:bg-card">
                <Users className="h-4 w-4" />
                Ações Onboarding
              </TabsTrigger>
            </TabsList>

            {/* Inbox Health Table */}
            <TabsContent value="inbox">
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                    Mensagens Sem Resposta
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mensagens inbound que ainda não receberam resposta do agente
                  </p>
                </div>
                {inboxHealth.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-success/10 mb-4">
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    </div>
                    <p className="text-lg font-medium text-foreground">Tudo respondido!</p>
                    <p className="text-sm text-muted-foreground mt-1">Todas as mensagens foram respondidas 🎉</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recebida em</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tempo Esperando</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inboxHealth.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className="border-b border-border/50 table-row-premium animate-slide-up"
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="avatar-premium h-9 w-9 text-sm">
                                  {item.lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground block">{item.lead.name}</span>
                                  <span className="text-xs text-muted-foreground">{item.lead.whatsapp}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <StageBadge stage={item.lead.stage} />
                            </td>
                            <td className="py-4 px-6 text-muted-foreground text-sm">
                              {format(parseISO(item.inboundAt), "dd/MM HH:mm", { locale: ptBR })}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${
                                item.secondsSinceInbound > 3600 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : item.secondsSinceInbound > 1800 
                                    ? 'bg-warning/10 text-warning' 
                                    : 'bg-muted text-muted-foreground'
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
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-accent" />
                    </div>
                    Últimas Respostas do Agente
                  </h2>
                </div>
                {recentResponses.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="empty-state-icon inline-block mb-4">
                      <Bot className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Nenhuma resposta do agente no período selecionado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estágio</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resposta (preview)</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentResponses.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className="border-b border-border/50 table-row-premium animate-slide-up"
                            style={{ animationDelay: `${idx * 30}ms` }}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="avatar-premium h-9 w-9 text-sm">
                                  {item.lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <span className="font-medium text-foreground">{item.lead.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <StageBadge stage={item.lead.stage} />
                            </td>
                            <td className="py-4 px-6 max-w-xs">
                              <span className="text-sm text-muted-foreground line-clamp-2">
                                {item.reply || '—'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-muted-foreground text-sm whitespace-nowrap">
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
              <div className="glass-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                      <Users className="h-4 w-4 text-accent" />
                    </div>
                    Ações de Onboarding
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Convites enviados e confirmações de entrada no grupo
                  </p>
                </div>
                {onboardingActions.length === 0 ? (
                  <div className="p-10 text-center">
                    <div className="empty-state-icon inline-block mb-4">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Nenhuma ação de onboarding no período selecionado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-secondary/30">
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lead</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ação</th>
                          <th className="text-left py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardingActions.map((item, idx) => {
                          const actionConfig = ACTION_TYPE_LABELS[item.actionType] || {
                            label: item.actionType,
                            icon: <CheckCircle2 className="h-4 w-4" />,
                            color: 'text-accent',
                          };
                          return (
                            <tr 
                              key={idx} 
                              className="border-b border-border/50 table-row-premium animate-slide-up"
                              style={{ animationDelay: `${idx * 30}ms` }}
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="avatar-premium h-9 w-9 text-sm">
                                    {item.lead.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-foreground">{item.lead.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`inline-flex items-center gap-2 text-sm font-medium ${actionConfig.color}`}>
                                  {actionConfig.icon}
                                  {actionConfig.label}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-muted-foreground text-sm">
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