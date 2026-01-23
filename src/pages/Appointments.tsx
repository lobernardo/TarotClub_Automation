import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar, Clock, CheckCircle, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentCard } from "@/components/appointments/AppointmentCard";

export default function Appointments() {
  const { 
    appointments, 
    loading, 
    stats, 
    confirmAppointment, 
    cancelAppointment 
  } = useAppointments();

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
              {stats.total} compromisso{stats.total !== 1 ? "s" : ""} próximos
            </p>
          </div>

          {/* Placeholder - futuro botão de novo agendamento */}
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.requested}</p>
              <p className="text-sm text-muted-foreground">Solicitados</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.confirmed}</p>
              <p className="text-sm text-muted-foreground">Confirmados</p>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{stats.canceled}</p>
              <p className="text-sm text-muted-foreground">Cancelados</p>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando agenda...
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum compromisso encontrado
            </h3>
            <p className="text-muted-foreground">
              A agenda refletirá os horários ocupados
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onConfirm={confirmAppointment}
                onCancel={cancelAppointment}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
