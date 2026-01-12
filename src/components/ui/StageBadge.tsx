import { LeadStage, STAGE_CONFIG } from '@/types/database';
import { STAGE_LABELS, AllowedFollowUpStage } from '@/constants/followUpRules';
import { cn } from '@/lib/utils';

interface StageBadgeProps {
  stage: LeadStage | AllowedFollowUpStage;
  className?: string;
  useTemplateLabels?: boolean;
}

export function StageBadge({ stage, className, useTemplateLabels = false }: StageBadgeProps) {
  const config = STAGE_CONFIG[stage as LeadStage];
  
  // Use template labels if requested and stage is a follow-up stage
  const label = useTemplateLabels && (stage in STAGE_LABELS) 
    ? STAGE_LABELS[stage as AllowedFollowUpStage]
    : config?.label || stage;
  
  return (
    <span className={cn('stage-badge', config?.color || 'stage-captured', className)}>
      {label}
    </span>
  );
}
