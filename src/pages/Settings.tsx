import { AppLayout } from "@/components/layout/AppLayout";
import { Settings as SettingsIcon, Bell, Shield, Database, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">Configurações do sistema e integrações</p>
        </div>

        {/* Notifications */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notificações</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Novos leads</Label>
                <p className="text-sm text-muted-foreground">Receber notificação quando um novo lead for captado</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Mensagens recebidas</Label>
                <p className="text-sm text-muted-foreground">Notificar quando leads responderem</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">Novos pagamentos</Label>
                <p className="text-sm text-muted-foreground">Alertar sobre novas assinaturas e pagamentos</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Webhook className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Integrações</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-emerald-500 font-semibold text-sm">WA</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">WhatsApp (Evolution API)</p>
                  <p className="text-sm text-emerald-400">Conectado</p>
                </div>
              </div>
              {/* <Button variant="outline" size="sm">Configurar</Button> */}
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-500 font-semibold text-sm">AS</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Asaas (Pagamentos)</p>
                  <p className="text-sm text-emerald-400">Conectado</p>
                </div>
              </div>
              {/* <Button variant="outline" size="sm">Configurar</Button> */}
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <span className="text-red-500 font-semibold text-sm">GC</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Google Calendar</p>
                  <p className="text-sm text-emerald-400">Conectado</p>
                </div>
              </div>
              {/* <Button variant="outline" size="sm">Configurar</Button> */}
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Dados</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Supabase</p>
                <p className="text-sm text-muted-foreground">Banco de dados conectado</p>
              </div>
              <span className="text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full">Ativo</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
          </div>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Alterar senha
            </Button>
            <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
              Sair de todas as sessões
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
