/**
 * Hook for fetching lead-related data (events, messages, subscriptions)
 * Uses existing Supabase tables without creating new ones
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event, Message, Subscription } from '@/types/database';
import { QueuedMessage } from '@/types/messageQueue';

interface UseLeadDataResult {
  events: Event[];
  messages: Message[];
  queueItems: QueuedMessage[];
  subscription: Subscription | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useLeadData(leadId: string | null): UseLeadDataResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [queueItems, setQueueItems] = useState<QueuedMessage[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!leadId) {
      setEvents([]);
      setMessages([]);
      setQueueItems([]);
      setSubscription(null);
      return;
    }

    setLoading(true);
    try {
      // Fetch events - try table, gracefully handle if doesn't exist
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (!eventsError && eventsData) {
        setEvents(eventsData as Event[]);
      } else {
        setEvents([]);
      }

      // Fetch messages - try table, gracefully handle if doesn't exist
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('sent_at', { ascending: false });

      if (!messagesError && messagesData) {
        setMessages(messagesData as Message[]);
      } else {
        setMessages([]);
      }

      // Fetch queue items
      const { data: queueData, error: queueError } = await supabase
        .from('message_queue')
        .select('*')
        .eq('lead_id', leadId)
        .order('scheduled_for', { ascending: true });

      if (!queueError && queueData) {
        setQueueItems(queueData as QueuedMessage[]);
      } else {
        setQueueItems([]);
      }

      // Fetch subscription - try table, gracefully handle if doesn't exist
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('lead_id', leadId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!subscriptionError && subscriptionData) {
        setSubscription(subscriptionData as Subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching lead data:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    messages,
    queueItems,
    subscription,
    loading,
    refetch: fetchData
  };
}
