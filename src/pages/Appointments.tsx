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
    return <Badge text="Confirmado" color="emerald" />;
  }
  if (status === "canceled") {
    return <Badge text="Cancelado" color="red" />;
  }
  return <Badge text="Solicitado" color="amber" />;
}

function Badge({ text, color }: { text: string; color: "emerald" | "red" | "amber" }) {
  const cls = color === "emerald" ? "text-emerald-500" : color === "red" ? "text-red-500" : "text-amber-500";

  return <span className={`font-medium ${cls}`}>{text}</span>;
}

/* ───────────── MODALS ───────────── */

function CreateAppointmentModal({ onClose }: { onClose: () => void }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    supabase
      .from("leads")
      .select("id, name, email")
      .order("name")
      .then(({ data }) => setLeads(data ?? []));
  }, []);

  async function create() {
    if (!leadId || !date || !hour) {
      alert("Preencha todos os campos");
      return;
    }

    const starts_at = `${date}T${hour}:00-03:00`;
    const ends_at = `${date}T${String(Number(hour.split(":")[0]) + 1).padStart(2, "0")}:00-03:00`;

    await supabase.from("appointments").insert({
      lead_id: leadId,
      starts_at,
      ends_at,
      status: "confirmed",
      notes,
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-xl p-6 w-full max-w-md space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Novo Agendamento</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <select className="w-full border rounded p-2" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
          <option value="">Selecione o lead</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} — {l.email}
            </option>
          ))}
        </select>

        <input type="date" className="w-full border rounded p-2" onChange={(e) => setDate(e.target.value)} />
        <input type="time" className="w-full border rounded p-2" onChange={(e) => setHour(e.target.value)} />
        <textarea
          placeholder="Anotações"
          className="w-full border rounded p-2"
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button className="w-full" onClick={create}>
          Criar agendamento
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
  const [creating, setCreating] = useState(false);

  async function fetchAppointments() {
    setLoading(true);

    const { data } = await supabase
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

    setRows((data ?? []) as AppointmentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const appointments: Appointment[] = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        lead: normalizeLead(r.lead),
      })),
    [rows],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Agenda
          </h1>

          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {appointments.map((ap) => (
          <div key={ap.id} className="glass-card p-5 rounded-xl">
            <h3 className="font-semibold">{ap.lead?.name ?? "Lead não vinculado"}</h3>
          </div>
        ))}

        {creating && (
          <CreateAppointmentModal
            onClose={() => {
              setCreating(false);
              fetchAppointments();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
