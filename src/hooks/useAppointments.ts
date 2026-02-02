import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentWithLead, AppointmentStatus } from "@/types/database";
import { toast } from "sonner";

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentWithLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          lead_id,
          status,
          starts_at,
          ends_at,
          google_calendar_event_id,
          notes,
          created_at,
          updated_at
        `)
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

        const { data: leadsData } = await supabase
          .from("leads")
          .select("id, name, email, whatsapp, stage")
          .in("id", leadIds);

        const leadsMap = new Map((leadsData || []).map((l) => [l.id, l]));

        const appointmentsWithLeads: AppointmentWithLead[] = data.map((apt: any) => ({
          ...apt,
          status: apt.status as AppointmentStatus,
          lead: leadsMap.get(apt.lead_id) || null,
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
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Create appointment with event logging
  const createAppointment = async (
    leadId: string,
    startsAt: Date,
    notes?: string,
    source: "ia" | "manual" = "manual"
  ): Promise<boolean> => {
    try {
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); // +1 hour

      const { data: newAppointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          lead_id: leadId,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "requested" as AppointmentStatus,
          notes: notes || null,
        })
        .select()
        .single();

      if (appointmentError) {
        console.error("Error creating appointment:", appointmentError);
        toast.error("Erro ao criar agendamento");
        return false;
      }

      // Log event
      await supabase.from("events").insert({
        lead_id: leadId,
        type: "appointment_requested",
        metadata: { source, appointment_id: newAppointment.id },
      });

      toast.success("Agendamento criado com sucesso");
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Unexpected error creating appointment:", err);
      toast.error("Erro inesperado ao criar agendamento");
      return false;
    }
  };

  // Confirm appointment with event logging
  const confirmAppointment = async (
    appointmentId: string,
    leadId: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "confirmed" as AppointmentStatus })
        .eq("id", appointmentId);

      if (updateError) {
        console.error("Error confirming appointment:", updateError);
        toast.error("Erro ao confirmar agendamento");
        return false;
      }

      // Log event
      await supabase.from("events").insert({
        lead_id: leadId,
        type: "appointment_confirmed",
        metadata: { source: "manual", appointment_id: appointmentId },
      });

      toast.success("Agendamento confirmado");
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Unexpected error confirming appointment:", err);
      toast.error("Erro inesperado ao confirmar");
      return false;
    }
  };

  // Cancel appointment
  const cancelAppointment = async (
    appointmentId: string,
    leadId: string
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "canceled" as AppointmentStatus })
        .eq("id", appointmentId);

      if (updateError) {
        console.error("Error canceling appointment:", updateError);
        toast.error("Erro ao cancelar agendamento");
        return false;
      }

      // Optional: Log cancellation event
      await supabase.from("events").insert({
        lead_id: leadId,
        type: "appointment_canceled" as any, // May not exist in EventType yet
        metadata: { source: "manual", appointment_id: appointmentId },
      });

      toast.success("Agendamento cancelado");
      await fetchAppointments();
      return true;
    } catch (err) {
      console.error("Unexpected error canceling appointment:", err);
      toast.error("Erro inesperado ao cancelar");
      return false;
    }
  };

  // Stats
  const requestedCount = appointments.filter((a) => a.status === "requested").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const canceledCount = appointments.filter((a) => a.status === "canceled").length;

  return {
    appointments,
    loading,
    refetch: fetchAppointments,
    createAppointment,
    confirmAppointment,
    cancelAppointment,
    stats: {
      total: appointments.length,
      requested: requestedCount,
      confirmed: confirmedCount,
      canceled: canceledCount,
    },
  };
}
