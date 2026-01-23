import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, CheckCircle, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ───────────────── TYPES ───────────────── */

interface Appointment {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "requested" | "confirmed" | "canceled";
  notes: string | null;
  meet_link: string | null;
  lead?: {
    name: string;
    email: string;
    whatsapp?: string | null;
  }[]; // ⚠️ vem como ARRAY do Supabase
}

/* ───────────────── PAGE ───────────────── */

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

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
          name,
          email,
          whatsapp
        )
      `,
      )
      .order("starts_at", { ascending: true });

    if (!error) {
      setAppointments((data ?? []) as Appointment[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const requestedCount = appointments.filter((a) => a.status === "requested").length;
  const canceledCount = appointments.filter((a) => a.status === "canceled").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Agenda
          </h1>

          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Stat title="Solicitados" value={requestedCount} />
          <Stat title="Confirmados" value={confirmedCount} />
          <Stat title="Cancelados" value={canceledCount} />
        </div>

        {/* LIST */}
        {loading ? (
          <div className="text-center py-12">Carregando…</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">Nenhum compromisso encontrado</div>
        ) : (
          <div className="space-y-4">
            {appointments.map((ap) => {
              const lead = ap.lead?.[0];

              return (
                <div key={ap.id} className="glass-card rounded-xl p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg">{lead?.name ?? "Lead"}</h3>

                        <p className="text-sm text-muted-foreground">{lead?.email ?? ""}</p>

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
                            className="inline-block mt-2 text-blue-600 underline text-sm"
                          >
                            Entrar no Google Meet
                          </a>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={ap.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreate && (
          <CreateAppointmentModal
            onClose={() => {
              setShowCreate(false);
              fetchAppointments();
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

/* ───────────────── COMPONENTS ───────────────── */

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
    return <Badge text="Confirmado" icon={<CheckCircle />} color="emerald" />;
  }

  if (status === "canceled") {
    return <Badge text="Cancelado" icon={<XCircle />} color="red" />;
  }

  return <Badge text="Solicitado" icon={<Clock />} color="amber" />;
}

function Badge({ text, icon, color }: any) {
  return (
    <span className={`flex items-center gap-2 text-${color}-500`}>
      {icon}
      {text}
    </span>
  );
}

/* ───────────────── MODAL ───────────────── */

function CreateAppointmentModal({ onClose }: { onClose: () => void }) {
  const [leadId, setLeadId] = useState("");
  const [date, setDate] = useState("");
  const [hour, setHour] = useState("");
  const [notes, setNotes] = useState("");

  async function create() {
    if (!leadId) {
      alert("Selecione um lead");
      return;
    }

    const startsAt = `${date}T${hour}:00-03:00`;
    const endsAt = `${date}T${String(Number(hour.split(":")[0]) + 1).padStart(2, "0")}:00-03:00`;

    const { data } = await supabase
      .from("appointments")
      .insert({
        lead_id: leadId,
        starts_at: startsAt,
        ends_at: endsAt,
        status: "confirmed",
        notes,
      })
      .select("id")
      .single();

    await fetch("/functions/v1/sync_google_calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "push",
        appointment_id: data.id,
      }),
    });

    onClose();
  }

  return (
    <div className="modal">
      <input placeholder="Lead ID" onChange={(e) => setLeadId(e.target.value)} />
      <input type="date" onChange={(e) => setDate(e.target.value)} />
      <input type="time" onChange={(e) => setHour(e.target.value)} />
      <textarea placeholder="Anotações" onChange={(e) => setNotes(e.target.value)} />
      <button onClick={create}>Criar</button>
    </div>
  );
}
