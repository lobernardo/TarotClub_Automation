import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LeadStage } from '@/types/database';

/**
 * Hook to count leads by stage from Supabase
 * Used to show eligible leads count in template cards
 */
export function useLeadCounts() {
  const [counts, setCounts] = useState<Record<LeadStage, number>>({} as Record<LeadStage, number>);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCounts() {
      setLoading(true);
      
      const stages: LeadStage[] = [
        'captured_form',
        'checkout_started', 
        'payment_pending',
        'subscribed_active',
        'subscribed_past_due',
        'subscribed_canceled',
        'lost',
        'blocked',
        'nurture'
      ];

      const countsMap: Record<string, number> = {};
      
      await Promise.all(
        stages.map(async (stage) => {
          const { count } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('stage', stage);
          countsMap[stage] = count || 0;
        })
      );

      setCounts(countsMap as Record<LeadStage, number>);
      setLoading(false);
    }

    fetchCounts();
  }, []);

  const getCountForStage = (stage: LeadStage): number => {
    return counts[stage] || 0;
  };

  return {
    counts,
    getCountForStage,
    loading
  };
}
