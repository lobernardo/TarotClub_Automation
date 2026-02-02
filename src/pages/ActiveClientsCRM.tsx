import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/database";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Mail,
  MessageSquare,
  ClipboardList,
  ArrowDownUp,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ================================
   Tipos e constantes
================================ */

type ActiveClientStage =
  | "clientes"
  | "leitura_personalizada"
  | "perguntas_sim_nao";

const STAGES: { key: ActiveClientStage; label: string; accent: string }[] = [
  { key: "clientes", label: "Clientes", accent: "bg-success" },
  {
    key: "leitura_personalizada",
    label: "Leitura personalizada",
    accent: "bg-warning",
  },
  {
    key: "perguntas_sim_nao",
    label: "Perguntas Sim/Não",
    accent: "bg-accent",
  },
];

type BoardState = Record<string, { stage: ActiveClientStage; notes: string }>;
type BoardMeta = { lastResetMonth: string };

const STORAGE_KEY = "active-clients-kanban";
const STORAGE_META_KEY = "active-clients-kanban-meta";

/* ================================
   LocalStorage helpers
================================ */

function loadBoardState(): BoardState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BoardState) : {};
  } catch {
    return {};
  }
}

function saveBoardState(state: BoardState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadBoardMeta(): BoardMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_META_KEY);
    return raw ? (JSON.parse(raw) as BoardMeta) : null;
  } catch {
    return null;
  }
}

function saveBoardMeta(meta: BoardMeta) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
}

function getCurrentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Reset mensal:
 * Todo início de mês, todos os clientes voltam para "Clientes"
 * Mantém observações.
 */
function applyMonthlyReset(state: BoardState): BoardState {
  const currentMonth = getCurrentMonthKey();
  const meta = loadBoardMeta();

  if (meta?.lastResetMonth === currentMonth) {
    return state;
  }

  const resetState: BoardState = Object.fromEntries(
    Object.entries(state).map(([clientId, data]) => [
      clientId,
      {
        stage: "clientes",
        notes: data.notes ?? "",
      },
    ])
  );

  saveBoardMeta({ lastResetMonth: currentMonth });
  return resetState;
}

/**
 * Data canônica de ordenação:
 * 1) asaas_paid_at (se existir)
 * 2) created_at
 */
function getPaidAt(client: Lead): Date {
  const paidAt = (client as Lead & { asaas_paid_at?: string | null })
    .asaas_paid_at;
  return new Date(paidAt || client.created_at);
}

/* ================================
   Componente principal
================================ */

export default function ActiveClientsCRM() {
  const [clients, setClients] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardState, setBoardState] = useState<BoardState>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] =
    useState<ActiveClientStage | null>(null);

  /* Init local state + reset mensal */
  useEffect(() => {
    const initial = applyMonthlyReset(loadBoardState());
    setBoardState(initial);
    saveBoardState(initial);
  }, []);

  /* Fetch clientes ativos */
  useEffect(() => {
    async function fetchClients() {
      setLoading(true);

      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, name, email, whatsapp, stage, created_at, updated_at, asaas_paid_at"
        )
        .in("stage", ["subscribed_active", "subscribed_past_due", "subscribed_canceled"]);

      if (!error) {
        setClients((data as Lead[]) || []);
      } else {
        setClients([]);
      }

      setLoading(false);
    }

    fetchClients();
  }, []);

  /* Agrupamento + ordenação FIFO */
  const clientsByStage = useMemo(() => {
    const grouped: Record<ActiveClientStage, Lead[]> = {
      clientes: [],
      leitura_personalizada: [],
      perguntas_sim_nao: [],
    };

    clients.forEach((client) => {
      const state = boardState[client.id];
      const stage = state?.stage ?? "clientes";
      grouped[stage].push(client);
    });

    Object.values(grouped).forEach((list) => {
      list.sort(
        (a, b) => getPaidAt(a).getTime() - getPaidAt(b).getTime()
      );
    });

    return grouped;
  }, [clients, boardState]);

  /* Mutations locais */
  const updateClientStage = (clientId: string, stage: ActiveClientStage) => {
    setBoardState((prev) => {
      const next = {
        ...prev,
        [clientId]: {
          stage,
          notes: prev[clientId]?.notes ?? "",
        },
      };
      saveBoardState(next);
      return next;
    });
  };

  const updateClientNotes = (clientId: string, notes: string) => {
    setBoardState((prev) => {
      const next = {
        ...prev,
        [clientId]: {
          stage: prev[clientId]?.stage ?? "clientes",
          notes,
        },
      };
      saveBoardState(next);
      return next;
    });
  };

  /* Drag handlers */
  const handleDragStart = (clientId: string) => {
    setDraggingId(clientId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStage(null);
  };

  const handleDrop = (stage: ActiveClientStage, clientId?: string) => {
    if (clientId) updateClientStage(clientId, stage);
    setDragOverStage(null);
  };

  /* ================================
     Render
  ================================ */

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-accent" />
              </div>
              <span className="heading-display">
                CRM Clientes Ativos
              </span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Kanban operacional para organização das entregas.
            </p>
          </div>
        </div>

        <div className="glass-card px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowDownUp className="h-4 w-4 text-accent" />
          <span>
            Ordem automática por data de pagamento (mais antigos
            primeiro).
          </span>
        </div>

        {loading ? (
          <div className="glass-card p-6 text-muted-foreground">
            Carregando clientes ativos…
          </div>
        ) : clients.length === 0 ? (
          <div className="glass-card p-6 text-muted-foreground">
            Nenhum cliente ativo encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-5 min-w-max">
              {STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className={cn(
                    "kanban-column min-w-[320px] max-w-[360px] transition-all duration-200",
                    dragOverStage === stage.key &&
                      "ring-2 ring-accent/40 bg-accent/5"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverStage(stage.key);
                  }}
                  onDragLeave={(e) => {
                    if (
                      !e.currentTarget.contains(
                        e.relatedTarget as Node
                      )
                    ) {
                      setDragOverStage(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const clientId =
                      e.dataTransfer.getData("text/plain");
                    handleDrop(stage.key, clientId || undefined);
                  }}
                >
                  <div className="mb-4 px-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-1 h-5 rounded-full",
                          stage.accent
                        )}
                      />
                      <span className="font-semibold text-sm">
                        {stage.label}
                      </span>
                    </div>
                    <span className="count-badge">
                      {clientsByStage[stage.key]?.length ?? 0}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[200px]">
                    {clientsByStage[stage.key].map((client) => {
                      const notes =
                        boardState[client.id]?.notes ?? "";
                      return (
                        <div
                          key={client.id}
                          className={cn(
                            "lead-card cursor-grab",
                            draggingId === client.id &&
                              "opacity-50 scale-95"
                          )}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData(
                              "text/plain",
                              client.id
                            );
                            handleDragStart(client.id);
                          }}
                          onDragEnd={handleDragEnd}
                        >
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold">
                                {client.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {client.email}
                              </p>
                            </div>

                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  Assinatura:{" "}
                                  {format(
                                    getPaidAt(client),
                                    "dd MMM yyyy",
                                    { locale: ptBR }
                                  )}
                                </span>
                              </div>

                              {client.whatsapp && (
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>{client.whatsapp}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{client.email}</span>
                              </div>
                            </div>

                            <textarea
                              className="w-full rounded-md border border-border p-2 text-xs"
                              rows={2}
                              placeholder="Observações…"
                              value={notes}
                              onChange={(e) =>
                                updateClientNotes(
                                  client.id,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
