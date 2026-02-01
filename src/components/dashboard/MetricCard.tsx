import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type CardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default: '',
  success: 'metric-card--success',
  warning: 'metric-card--warning',
  danger: 'metric-card--danger',
  info: 'metric-card--info',
  purple: 'metric-card--purple',
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
  variant = 'default'
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change === 0) return <Minus className="h-3.5 w-3.5" />;
    return change > 0 ? (
      <TrendingUp className="h-3.5 w-3.5" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === null || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-success' : 'text-destructive';
  };

  return (
    <div className={cn('metric-card animate-fade-in', variantClasses[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1.5 text-sm font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}%
                {changeLabel && <span className="text-muted-foreground font-normal ml-1">{changeLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-soft to-purple-soft/50">
            <div className="text-accent">{icon}</div>
          </div>
        )}
      </div>
    </div>
  );
}