import { LeadStage, STAGE_CONFIG } from '@/types/database';
import { cn } from '@/lib/utils';

interface StageBadgeProps {
  stage: LeadStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage];
  
  return (
    <span className={cn('stage-badge', config.color, className)}>
      {config.label}
    </span>
  );
}
