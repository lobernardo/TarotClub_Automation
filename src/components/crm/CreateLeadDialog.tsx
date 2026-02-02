/**
 * Create Lead Dialog
 * Allows manual lead creation with:
 * - Name, email, whatsapp (required: name + at least one contact)
 * - Initial stage selection
 * - Duplicate check before creation
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LeadStage, STAGE_CONFIG, CORE_STAGES } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, AlertTriangle, UserPlus } from "lucide-react";
import { cn, normalizeWhatsapp } from "@/lib/utils";

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateLeadDialog({ open, onOpenChange, onSuccess }: CreateLeadDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [stage, setStage] = useState<LeadStage>("captured_form");
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setEmail("");
    setWhatsapp("");
    setStage("captured_form");
    setDuplicateWarning(null);
  };

  const checkDuplicate = async (): Promise<boolean> => {
    setDuplicateWarning(null);

    // Build OR conditions for duplicate check
    const conditions = [];
    if (email.trim()) {
      conditions.push({ email: email.trim().toLowerCase() });
    }
    if (whatsapp.trim()) {
      conditions.push({ whatsapp: whatsapp.trim() });
    }

    if (conditions.length === 0) return false;

    try {
      // Check email
      if (email.trim()) {
        const { data: emailMatch } = await supabase
          .from("leads")
          .select("id, name")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();

        if (emailMatch) {
          setDuplicateWarning(`Já existe um lead com este email: ${emailMatch.name}`);
          return true;
        }
      }

      // Check whatsapp
      const normalizedWa = normalizeWhatsapp(whatsapp);
      if (normalizedWa) {
        const { data: whatsappMatch } = await supabase
          .from("leads")
          .select("id, name")
          .eq("whatsapp", normalizedWa)
          .maybeSingle();

        if (whatsappMatch) {
          setDuplicateWarning(`Já existe um lead com este WhatsApp: ${whatsappMatch.name}`);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error("Error checking duplicate:", err);
      return false;
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!email.trim() && !whatsapp.trim()) {
      toast.error("Informe pelo menos um contato (email ou WhatsApp)");
      return;
    }

    // Email validation
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);

    try {
      // Check for duplicates
      const isDuplicate = await checkDuplicate();
      if (isDuplicate) {
        setLoading(false);
        return;
      }

      // Create lead (normalize whatsapp before insert)
      const { data, error } = await supabase
        .from("leads")
        .insert({
          name: name.trim(),
          email: email.trim().toLowerCase() || null,
          whatsapp: normalizeWhatsapp(whatsapp),
          stage,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating lead:", error);
        toast.error(`Erro ao criar lead: ${error.message}`);
        return;
      }

      toast.success("Lead criado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast.error("Erro ao criar lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novo Lead
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {duplicateWarning && (
            <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{duplicateWarning}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="11999999999"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stage">Estágio Inicial</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as LeadStage)} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar estágio" />
              </SelectTrigger>
              <SelectContent>
                {CORE_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          `bg-[hsl(var(--stage-${s.replace("_", "-").replace("subscribed_", "")}))]`,
                        )}
                      ></span>
                      {STAGE_CONFIG[s].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
