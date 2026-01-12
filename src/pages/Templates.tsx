import { AppLayout } from '@/components/layout/AppLayout';
import { FileText, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageBadge } from '@/components/ui/StageBadge';
import { LeadStage } from '@/types/database';

// Mock templates data
const mockTemplates = [
  {
    id: '1',
    name: 'Boas-vindas D+2',
    stage: 'captured_form' as LeadStage,
    content: 'Oi {{nome}}! 🌙\n\nVi que você se interessou pelo Clube do Tarot da Veranah Alma...\n\nQuer saber mais sobre como funciona?',
    delay: '2 dias após captação'
  },
  {
    id: '2',
    name: 'Checkout Abandonado 30min',
    stage: 'checkout_started' as LeadStage,
    content: 'Oi {{nome}}! ✨\n\nVi que você começou a se inscrever no Clube do Tarot mas não finalizou...\n\nPosso te ajudar com alguma dúvida?',
    delay: '30 minutos após checkout'
  },
  {
    id: '3',
    name: 'Follow-up D+4',
    stage: 'captured_form' as LeadStage,
    content: 'Oi {{nome}}! 🔮\n\nAinda estou por aqui caso você tenha alguma pergunta sobre o Clube...',
    delay: '4 dias após captação'
  },
  {
    id: '4',
    name: 'Onboarding - Boas-vindas',
    stage: 'subscribed_active' as LeadStage,
    content: 'Bem-vinda ao Clube do Tarot, {{nome}}! 🎉✨\n\nEstou muito feliz em ter você aqui...',
    delay: 'Imediato após ativação'
  },
  {
    id: '5',
    name: 'Onboarding - Convite Grupo',
    stage: 'subscribed_active' as LeadStage,
    content: 'Aqui está seu convite para o grupo VIP do WhatsApp! 💫\n\n[LINK]\n\nLá você receberá todas as novidades...',
    delay: '1 minuto após boas-vindas'
  }
];

export default function Templates() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Templates de Mensagem
            </h1>
            <p className="text-muted-foreground mt-1">
              Modelos de mensagens para follow-ups automáticos
            </p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockTemplates.map((template) => (
            <div
              key={template.id}
              className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{template.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <StageBadge stage={template.stage} />
                    <span className="text-xs text-muted-foreground">
                      {template.delay}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <pre className="text-sm text-foreground/80 whitespace-pre-wrap font-sans">
                  {template.content}
                </pre>
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Variáveis: {'{{nome}}'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
