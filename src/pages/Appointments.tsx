import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  lead_id: string;
  scheduled_at: string;
  confirmed: boolean;
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
      
      // Try to fetch appointments - table may not exist yet
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            lead_id,
            scheduled_at,
            confirmed,
            notes
          `)
          .gte('scheduled_at', new Date().toISOString())
          .order('scheduled_at', { ascending: true });
        
        if (error) {
          console.log('Appointments table may not exist:', error);
          setAppointments([]);
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Fetch leads for appointments
          const leadIds = [...new Set(data.map(a => a.lead_id))];
          const { data: leadsData } = await supabase
            .from('leads')
            .select('id, name, email')
            .in('id', leadIds);
          
          const leadsMap = new Map((leadsData || []).map(l => [l.id, l]));
          
          const appointmentsWithLeads = data.map(apt => ({
            ...apt,
            lead: leadsMap.get(apt.lead_id)
          }));
          
          setAppointments(appointmentsWithLeads);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        console.log('Error fetching appointments:', err);
        setAppointments([]);
      }
      
      setLoading(false);
    }
    
    fetchAppointments();
  }, []);

  const confirmedCount = appointments.filter(a => a.confirmed).length;
  const pendingCount = appointments.filter(a => !a.confirmed).length;

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
              {appointments.length} consulta{appointments.length !== 1 ? 's' : ''} agendada{appointments.length !== 1 ? 's' : ''}
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
              <p className="text-2xl font-semibold text-foreground">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Próximas consultas</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{confirmedCount}</p>
              <p className="text-sm text-muted-foreground">Confirmadas</p>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Aguardando confirmação</p>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Carregando consultas...
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 glass-card rounded-xl">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma consulta agendada
            </h3>
            <p className="text-muted-foreground">
              As próximas consultas aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
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
                        {appointment.lead?.name || 'Lead'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {appointment.lead?.email || ''}
                      </p>
                      
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
        )}
      </div>
    </AppLayout>
  );
}
