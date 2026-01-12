import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="h-4 w-4" />;
    return change > 0 ? (
      <TrendingUp className="h-4 w-4" />
    ) : (
      <TrendingDown className="h-4 w-4" />
    );
  };

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-emerald-400' : 'text-rose-400';
  };

  return (
    <div className={cn('metric-card animate-fade-in', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground font-serif">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1.5 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}%
                {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
