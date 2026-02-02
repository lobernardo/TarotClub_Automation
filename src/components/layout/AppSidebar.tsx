import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logoDourado from "@/assets/logo_dourado_transparent.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "CRM Kanban", href: "/crm", icon: Users },
  { name: "Clientes Ativos", href: "/clients", icon: UserCheck },
  { name: "CRM Clientes Ativos", href: "/active-clients-crm", icon: ClipboardList },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border/60">
      <div className="flex h-full flex-col">
        {/* Logo - Premium header */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-border/60">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden bg-transparent">
            <img 
              src={logoDourado} 
              alt="Veranah Alma" 
              className="h-11 w-11 object-contain" 
              style={{ background: 'transparent' }}
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Veranah Alma
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-accent" />
              Clube do Tarot
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Menu
          </p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "sidebar-item group",
                  isActive
                    ? "sidebar-item--active"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "sidebar-icon h-5 w-5 transition-colors duration-200",
                    isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border/60 p-3 space-y-1">
          <NavLink
            to="/settings"
            className={cn(
              "sidebar-item group text-muted-foreground hover:text-foreground",
              location.pathname === "/settings" && "sidebar-item--active"
            )}
          >
            <Settings className={cn(
              "h-5 w-5 transition-colors duration-200",
              location.pathname === "/settings" ? "text-accent" : "text-muted-foreground group-hover:text-foreground"
            )} />
            <span className="font-medium">Configurações</span>
          </NavLink>
          <button className="sidebar-item group w-full text-muted-foreground hover:text-destructive hover:bg-destructive/5">
            <LogOut className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors duration-200" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
