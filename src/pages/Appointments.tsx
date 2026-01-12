import { AppLayout } from '@/components/layout/AppLayout';
import { Calendar, Clock, User, CheckCircle, XCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock appointments
const mockAppointments = [
  {
    id: '1',
    leadName: 'Maria Silva',
    leadEmail: 'maria@email.com',
    scheduled_at: addDays(new Date(), 1).toISOString(),
    confirmed: true,
    notes: 'Primeira consulta - tirar dúvidas sobre o clube'
  },
  {
    id: '2',
    leadName: 'Ana Santos',
    leadEmail: 'ana@email.com',
    scheduled_at: addDays(new Date(), 2).toISOString(),
    confirmed: false,
    notes: 'Interessada em plano anual'
  },
  {
    id: '3',
    leadName: 'Carla Oliveira',
    leadEmail: 'carla@email.com',
    scheduled_at: addDays(new Date(), 3).toISOString(),
    confirmed: true,
    notes: null
  }
];

export default function Appointments() {
  const upcomingAppointments = mockAppointments.filter(
    apt => new Date(apt.scheduled_at) > new Date()
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Agenda de Consultas
            </h1>
            <p className="text-muted-foreground mt-1">
              {upcomingAppointments.length} consultas agendadas
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
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
              <p className="text-2xl font-semibold text-foreground">{upcomingAppointments.length}</p>
              <p className="text-sm text-muted-foreground">Próximas consultas</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {upcomingAppointments.filter(a => a.confirmed).length}
              </p>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">
                {upcomingAppointments.filter(a => !a.confirmed).length}
              </p>
              <p className="text-sm text-muted-foreground">Aguardando confirmação</p>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {upcomingAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {appointment.leadName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{appointment.leadEmail}</p>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-foreground">
                          {format(new Date(appointment.scheduled_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-foreground">
                          {format(new Date(appointment.scheduled_at), "HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted/30 rounded px-3 py-2">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {appointment.confirmed ? (
                    <span className="flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      Confirmado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-sm text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      Aguardando
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {upcomingAppointments.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma consulta agendada
            </h3>
            <p className="text-muted-foreground">
              As próximas consultas aparecerão aqui
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
