import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, CheckCircle, XCircle, Plus, Video, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ───────────── TYPES ───────────── */

interface Lead {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
}

type LeadRel = Lead | Lead[] | null;

interface AppointmentRow {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "requested" | "confirmed" | "canceled";
  notes: string | null;
  meet_link: string | null;
  lead: LeadRel;
}

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "requested" | "confirmed" | "canceled";
  notes: string | null;
  meet_link: string | null;
  lead: Lead | null;
}

/* ───────────── HELPERS ───────────── */

function normalizeLead(rel: LeadRel): Lead | null {
  if (!rel) return null;
  if (Array.isArray(rel)) return rel[0] ?? null;
  return rel;
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="glass-card p-4 rounded-xl">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  if (status === "confirmed") {
    return <Badge text="Confirmado" icon={<CheckCircle className="h-4 w-4" />} color="emerald" />;
  }
  if (status === "canceled") {
    return <Badge text="Cancelado" icon={<XCircle className="h-4 w-4" />} color="red" />;
  }
  return <Badge text="Solicitado" icon={<Clock className="h-4 w-4" />} color="amber" />;
}

function Badge({ text, icon, color }: { text: string; icon: React.ReactNode; color: "emerald" | "red" | "amber" }) {
  const cls = color === "emerald" ? "text-emerald-500" : color === "red" ? "text-red-500" : "text-amber-500";

  return (
    <span className={`flex items-center gap-2 ${cls}`}>
      {icon}
      {text}
    </span>
  );
}

/* ───────────── MODAL ───────────── */

function AppointmentModal({ appointment, onClose }: { appointment?: Appointment; onClose: () => void }) {
  const [notes, setNotes] = useState(appointment?.notes ?? "");

  async function save() {
    if (!appointment) return;
    await supabase.from("appointments").update({ notes }).eq("id", appointment.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Editar Agendamento</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <textarea
          className="w-full border rounded p-2"
          placeholder="Anotações"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button className="w-full" onClick={save}>
          Salvar
        </Button>
      </div>
    </div>
  );
}

/* ───────────── PAGE ───────────── */

export default function Appointments() {
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Appointment | null>(null);

  async function fetchAppointments() {
    setLoading(true);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        starts_at,
        ends_at,
        status,
        notes,
        meet_link,
        lead:lead_id (
          id,
          name,
          email,
          whatsapp
        )
      `,
      )
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("fetchAppointments error:", error);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data ?? []) as AppointmentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const appointments: Appointment[] = useMemo(() => {
    return rows.map((r) => ({
      id: r.id,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      status: r.status,
      notes: r.notes,
      meet_link: r.meet_link,
      lead: normalizeLead(r.lead),
    }));
  }, [rows]);

  const requested = appointments.filter((a) => a.status === "requested").length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const canceled = appointments.filter((a) => a.status === "canceled").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Agenda
          </h1>

          {/* BOTÃO CORRIGIDO */}
          <Button onClick={() => console.warn("Novo Agendamento ainda não integrado.")}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat title="Solicitados" value={requested} />
          <Stat title="Confirmados" value={confirmed} />
          <Stat title="Cancelados" value={canceled} />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center py-10">Carregando…</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-10">Nenhum agendamento</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((ap) => (
              <div key={ap.id} className="glass-card p-5 rounded-xl">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg">{ap.lead?.name ?? "Lead não vinculado"}</h3>

                      <p className="text-sm text-muted-foreground">
                        {ap.lead?.email ?? ""}
                        {ap.lead?.whatsapp ? ` · ${ap.lead.whatsapp}` : ""}
                      </p>

                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(ap.starts_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(ap.starts_at), "HH:mm")} – {format(new Date(ap.ends_at), "HH:mm")}
                        </span>
                      </div>

                      {ap.notes && <div className="mt-2 text-sm bg-muted/30 rounded px-3 py-2">{ap.notes}</div>}

                      {ap.meet_link && (
                        <a
                          href={ap.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-sm text-blue-600 underline"
                        >
                          <Video className="h-4 w-4" />
                          Entrar no Google Meet
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={ap.status} />

                    <Button size="icon" variant="ghost" onClick={() => setEditing(ap)}>
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        await supabase.from("appointments").update({ status: "canceled" }).eq("id", ap.id);
                        fetchAppointments();
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing && (
          <AppointmentModal
            appointment={editing}
            onClose={() => {
              setEditing(null);
              fetchAppointments();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
