import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  MessageSquare,
  FileText,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logoDourado from '@/assets/logo_dourado_transparent.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM Kanban', href: '/crm', icon: Users },
  { name: 'Templates (Venda)', href: '/templates', icon: FileText },
  { name: 'Onboarding', href: '/onboarding', icon: Heart },
  { name: 'Fila de Mensagens', href: '/messages', icon: MessageSquare },
  { name: 'Clientes Ativos', href: '/clients', icon: UserCheck },
  { name: 'Performance', href: '/performance', icon: BarChart3 },
  { name: 'Agenda', href: '/appointments', icon: Calendar },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden">
            <img src={logoDourado} alt="Veranah Alma" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground font-display">
              Veranah Alma
            </h1>
            <p className="text-xs text-muted-foreground">Clube do Tarot</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-veranah-blue-soft text-veranah-blue'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-gold' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3">
          <NavLink
            to="/settings"
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
            Configurações
          </NavLink>
          <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
            <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-destructive" />
            Sair
          </button>
        </div>
      </div>
    </aside>
  );
}
