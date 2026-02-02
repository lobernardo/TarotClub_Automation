import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types/database";
import { cn } from "@/lib/utils";
import { Calendar, Mail, MessageSquare, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ActiveClientStage = "clientes" | "leitura_mensal" | "perguntas_sim_nao";

const STAGES: { key: ActiveClientStage; label: string; accent: string }[] = [
  { key: "clientes", label: "Clientes", accent: "bg-success" },
  { key: "leitura_mensal", label: "Leitura mensal", accent: "bg-warning" },
  { key: "perguntas_sim_nao", label: "Perguntas Sim/Não", accent: "bg-accent" },
];

const STORAGE_KEY = "active-clients-kanban";

type BoardState = Record<string, { stage: ActiveClientStage; notes: string }>;

function loadBoardState(): BoardState {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BoardState) : {};
  } catch {
    return {};
  }
}

function saveBoardState(state: BoardState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function ActiveClientsCRM() {
  const [clients, setClients] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardState, setBoardState] = useState<BoardState>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<ActiveClientStage | null>(null);

  useEffect(() => {
    setBoardState(loadBoardState());
  }, []);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("id, name, email, whatsapp, stage, created_at, updated_at")
        .eq("stage", "subscribed_active")
        .order("created_at", { ascending: false });

      if (!error) {
        setClients((data as Lead[]) || []);
      } else {
        setClients([]);
      }
      setLoading(false);
    }

    fetchClients();
  }, []);

  const clientsByStage = useMemo(() => {
    const grouped: Record<ActiveClientStage, Lead[]> = {
      clientes: [],
      leitura_mensal: [],
      perguntas_sim_nao: [],
    };

    clients.forEach((client) => {
      const state = boardState[client.id];
      const stage = state?.stage ?? "clientes";
      grouped[stage].push(client);
    });

    return grouped;
  }, [clients, boardState]);

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

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-accent" />
              </div>
              <span className="heading-display">CRM Clientes Ativos</span>
            </h1>
            <p className="text-muted-foreground mt-1.5">
              Kanban operacional para entregas dos clientes ativos.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="glass-card p-6 text-muted-foreground">Carregando clientes ativos...</div>
        ) : clients.length === 0 ? (
          <div className="glass-card p-6 text-muted-foreground">Nenhum cliente ativo encontrado.</div>
        ) : (
          <div className="overflow-x-auto pb-4 -mx-2 px-2">
            <div className="flex gap-5 min-w-max">
              {STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className={cn(
                    "kanban-column min-w-[320px] max-w-[360px] transition-all duration-200 relative",
                    dragOverStage === stage.key && "ring-2 ring-accent/40 bg-accent/5",
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverStage(stage.key);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverStage(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const clientId = e.dataTransfer.getData("text/plain");
                    handleDrop(stage.key, clientId || undefined);
                  }}
                >
                  <div className="mb-4 px-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-1 h-5 rounded-full", stage.accent)} />
                      <span className="font-semibold text-foreground text-sm">{stage.label}</span>
                    </div>
                    <span className="count-badge">{clientsByStage[stage.key]?.length ?? 0}</span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto min-h-[200px]">
                    {clientsByStage[stage.key]?.length === 0 ? (
                      <div
                        className={cn(
                          "text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl transition-all duration-200",
                          dragOverStage === stage.key ? "border-accent/50 bg-accent/5" : "border-border",
                        )}
                      >
                        {dragOverStage === stage.key ? (
                          <span className="font-medium text-accent">Soltar aqui</span>
                        ) : (
                          <span>Nenhum cliente</span>
                        )}
                      </div>
                    ) : (
                      clientsByStage[stage.key].map((client) => {
                        const notes = boardState[client.id]?.notes ?? "";
                        return (
                          <div
                            key={client.id}
                            className={cn(
                              "lead-card animate-scale-in cursor-grab active:cursor-grabbing",
                              draggingId === client.id && "opacity-50 scale-95 rotate-1",
                            )}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", client.id);
                              e.dataTransfer.effectAllowed = "move";
                              handleDragStart(client.id);
                            }}
                            onDragEnd={handleDragEnd}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <div className="avatar-premium h-10 w-10 text-sm flex-shrink-0">
                                  {client.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground truncate">{client.name}</h4>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {client.email || "Email não informado"}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>
                                    Assinatura: {format(new Date(client.created_at), "dd MMM yyyy", { locale: ptBR })}
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
                                  <span>{client.email || "Email não informado"}</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Observações</label>
                                <textarea
                                  className="w-full rounded-md border border-border bg-card/60 p-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
                                  rows={2}
                                  value={notes}
                                  onChange={(e) => updateClientNotes(client.id, e.target.value)}
                                  placeholder="Adicionar observações..."
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
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
