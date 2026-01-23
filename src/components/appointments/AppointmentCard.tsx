import { Calendar, Clock, User, Phone, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { AppointmentWithLead, AppointmentStatus, STAGE_CONFIG } from "@/types/database";
import { Badge } from "@/components/ui/badge";

interface AppointmentCardProps {
  appointment: AppointmentWithLead;
  onConfirm?: (appointmentId: string, leadId: string) => void;
  onCancel?: (appointmentId: string, leadId: string) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; icon: React.ElementType; className: string }> = {
  requested: {
    label: "Solicitado",
    icon: AlertCircle,
    className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  },
  confirmed: {
    label: "Confirmado",
    icon: CheckCircle,
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  canceled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-red-500/10 text-red-600 border-red-500/20",
  },
};

export function AppointmentCard({ appointment, onConfirm, onCancel }: AppointmentCardProps) {
  const statusInfo = STATUS_CONFIG[appointment.status];
  const StatusIcon = statusInfo.icon;
  const leadStageLabel = appointment.lead?.stage 
    ? STAGE_CONFIG[appointment.lead.stage]?.label 
    : null;

  return (
    <div className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-secondary-foreground" />
          </div>

          {/* Lead info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate">
              {appointment.lead?.name || "Lead não encontrado"}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              {appointment.lead?.email && (
                <p className="text-sm text-muted-foreground truncate">
                  {appointment.lead.email}
                </p>
              )}
              {appointment.lead?.whatsapp && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{appointment.lead.whatsapp}</span>
                </div>
              )}
            </div>

            {leadStageLabel && (
              <Badge variant="outline" className="mt-2 text-xs">
                {leadStageLabel}
              </Badge>
            )}

            {/* Date/time */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>
                  {format(new Date(appointment.starts_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {format(new Date(appointment.starts_at), "HH:mm", { locale: ptBR })}
                  {appointment.ends_at && (
                    <> – {format(new Date(appointment.ends_at), "HH:mm", { locale: ptBR })}</>
                  )}
                </span>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <p className="text-sm text-muted-foreground mt-3 bg-muted/30 rounded px-3 py-2">
                {appointment.notes}
              </p>
            )}
          </div>
        </div>

        {/* Status and actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border ${statusInfo.className}`}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </span>

          {/* Action buttons */}
          {appointment.status === "requested" && (
            <div className="flex gap-2 mt-2">
              {onConfirm && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => onConfirm(appointment.id, appointment.lead_id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmar
                </Button>
              )}
              {onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                  onClick={() => onCancel(appointment.id, appointment.lead_id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {appointment.status === "confirmed" && onCancel && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-500/30 hover:bg-red-500/10 mt-2"
              onClick={() => onCancel(appointment.id, appointment.lead_id)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
