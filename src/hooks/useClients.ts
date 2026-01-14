/**
 * Hook for fetching subscription clients (subscribers)
 * Uses real data from Supabase
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStage } from '@/types/database';

// Subscription-related stages
const SUBSCRIPTION_STAGES: LeadStage[] = [
  'subscribed_active',
  'subscribed_past_due',
  'subscribed_canceled',
];

export function useClients() {
  const [clients, setClients] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .in('stage', SUBSCRIPTION_STAGES)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching clients:', error);
        setClients([]);
      } else {
        setClients((data as Lead[]) || []);
      }
    } catch (err) {
      console.error('Error in fetchClients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Group clients by status
  const clientsByStatus = {
    active: clients.filter((c) => c.stage === 'subscribed_active'),
    past_due: clients.filter((c) => c.stage === 'subscribed_past_due'),
    canceled: clients.filter((c) => c.stage === 'subscribed_canceled'),
  };

  return {
    clients,
    clientsByStatus,
    loading,
    refetch: fetchClients,
  };
}
