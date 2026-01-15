/**
 * Delete Lead Confirmation Dialog
 * 
 * Confirms lead deletion with clear warning.
 * Deletion cancels queue items but does NOT trigger automations.
 */

import { useState } from 'react';
import { Lead } from '@/types/database';
import { useLeadActions } from '@/hooks/useLeadActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Trash2 } from 'lucide-react';

interface DeleteLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteLeadDialog({
  lead,
  open,
  onOpenChange,
  onSuccess
}: DeleteLeadDialogProps) {
  const [loading, setLoading] = useState(false);
  const { deleteLead } = useLeadActions(onSuccess);

  const handleDelete = async () => {
    if (!lead) return;

    setLoading(true);
    const success = await deleteLead(lead.id);
    setLoading(false);

    if (success) {
      onOpenChange(false);
    }
  };

  if (!lead) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Excluir Lead
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir <strong>{lead.name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              Esta ação é irreversível. Todas as mensagens agendadas serão canceladas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
