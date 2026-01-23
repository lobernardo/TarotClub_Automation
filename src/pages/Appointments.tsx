import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, User, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: string;
  lead_id: string;
  starts_at: string;
  ends_at: string | null;
  status: "scheduled" | "canceled" | "completed";
  notes: string | null;
  lead?: {
    name: string;
    email: string;
  };
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            lead_id,
            starts_at,
            ends_at,
            status,
            notes
          `,
          )
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true });

        if (error) {
          console.error("Error fetching appointments:", error);
          setAppointments([]);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          const leadIds = [...new Set(data.map((a) => a.lead_id))];

          const { data: leadsData } = await supabase.from("leads").select("id, name, email").in("id", leadIds);

          const leadsMap = new Map((leadsData || []).map((l) => [l.id, l]));

          const appointmentsWithLeads = data.map((apt) => ({
            ...apt,
            lead: leadsMap.get(apt.lead_id),
          }));

          setAppointments(appointmentsWithLeads);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.error("Unexpected error fetching appointments:", err);
        setAppointments([]);
      }

      setLoading(false);
    }

    fetchAppointments();
  }, []);

  const scheduledCount = appointments.filter((a) => a.status === "scheduled").length;
  const otherCount = appointments.length - scheduledCount;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Agenda
            </h1>
            <p className="text-muted-foreground mt-1">
              {appointments.length} compromisso{appointments.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Apenas visual por enquanto */}
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Próximos compromissos</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{scheduledCount}</p>
              <p className="text-sm text-muted-foreground">Agendados</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{otherCount}</p>
              <p className="text-sm text-muted-foreground">Encerrados / cancelados</p>
            </div>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando agenda...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum compromisso encontrado</h3>
            <p className="text-muted-foreground">A agenda refletirá os horários ocupados</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{appointment.lead?.name || "Lead"}</h3>

                      <p className="text-sm text-muted-foreground">{appointment.lead?.email || ""}</p>

                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{format(new Date(appointment.starts_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{format(new Date(appointment.starts_at), "HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>

                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 bg-muted/30 rounded px-3 py-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {appointment.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
