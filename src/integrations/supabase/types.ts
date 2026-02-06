export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          ends_at: string | null
          google_calendar_event_id: string | null
          id: string
          lead_id: string
          notes: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          google_calendar_event_id?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          google_calendar_event_id?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          created_at: string
          entity_type: string
          external_id: string
          id: string
          lead_id: string
          metadata: Json | null
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          external_id: string
          id?: string
          lead_id: string
          metadata?: Json | null
          provider: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          external_id?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          provider?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_link: string | null
          asaas_subscription_id: string | null
          created_at: string
          email: string
          id: string
          last_interaction_at: string | null
          name: string
          notes: string | null
          onboarding_sent_at: string | null
          previous_stage: string | null
          silenced_until: string | null
          source: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          whatsapp: string
          whatsapp_norm: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          email: string
          id?: string
          last_interaction_at?: string | null
          name: string
          notes?: string | null
          onboarding_sent_at?: string | null
          previous_stage?: string | null
          silenced_until?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          whatsapp: string
          whatsapp_norm?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_link?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_interaction_at?: string | null
          name?: string
          notes?: string | null
          onboarding_sent_at?: string | null
          previous_stage?: string | null
          silenced_until?: string | null
          source?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          whatsapp?: string
          whatsapp_norm?: string | null
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          cancel_reason: string | null
          canceled_at: string | null
          created_at: string
          delay_seconds: number | null
          id: string
          lead_id: string
          scheduled_for: string
          sent_at: string | null
          stage: string | null
          status: string
          template_key: string
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          canceled_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          id?: string
          lead_id: string
          scheduled_for: string
          sent_at?: string | null
          stage?: string | null
          status?: string
          template_key: string
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          canceled_at?: string | null
          created_at?: string
          delay_seconds?: number | null
          id?: string
          lead_id?: string
          scheduled_for?: string
          sent_at?: string | null
          stage?: string | null
          status?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean
          content: string
          created_at: string
          delay_seconds: number
          id: string
          name: string
          stage: string | null
          template_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          content: string
          created_at?: string
          delay_seconds?: number
          id?: string
          name: string
          stage?: string | null
          template_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          content?: string
          created_at?: string
          delay_seconds?: number
          id?: string
          name?: string
          stage?: string | null
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          delivered_at: string | null
          direction: string
          external_id: string | null
          id: string
          is_ai_generated: boolean
          lead_id: string
          metadata: Json | null
          read_at: string | null
          sent_at: string
          template_id: string | null
        }
        Insert: {
          content: string
          delivered_at?: string | null
          direction: string
          external_id?: string | null
          id?: string
          is_ai_generated?: boolean
          lead_id: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string
          template_id?: string | null
        }
        Update: {
          content?: string
          delivered_at?: string | null
          direction?: string
          external_id?: string | null
          id?: string
          is_ai_generated?: boolean
          lead_id?: string
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          asaas_subscription_id: string | null
          canceled_at: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          asaas_subscription_id?: string | null
          canceled_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          asaas_subscription_id?: string | null
          canceled_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_messages_outside_stage: {
        Args: {
          p_lead_id: string
          p_new_stage: Database["public"]["Enums"]["lead_stage"]
        }
        Returns: undefined
      }
      confirm_group_join: {
        Args: { p_lead_id: string; p_message_text: string }
        Returns: undefined
      }
      enqueue_followups_for_lead: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      find_or_create_lead: {
        Args: {
          p_email: string
          p_name: string
          p_source?: string
          p_stage?: string
          p_whatsapp: string
        }
        Returns: string
      }
      log_event: {
        Args: { p_lead_id: string; p_metadata?: Json; p_type: string }
        Returns: string
      }
      mark_group_invite_sent: {
        Args: { p_lead_id: string; p_message_text: string }
        Returns: undefined
      }
      move_leads_to_nurture_after_inactivity: {
        Args: never
        Returns: undefined
      }
      normalize_br_phone: { Args: { raw: string }; Returns: string }
      update_lead_stage: {
        Args: { p_lead_id: string; p_new_stage: string; p_reason?: string }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status: "requested" | "confirmed" | "canceled"
      event_type:
        | "form_submitted"
        | "checkout_started"
        | "payment_created"
        | "payment_confirmed"
        | "payment_overdue"
        | "subscription_canceled"
        | "follow_sent"
        | "message_received"
        | "ai_response"
        | "silence_applied"
        | "welcome_sent"
        | "group_invite_sent"
        | "appointment_requested"
        | "appointment_confirmed"
        | "opt_out_requested"
        | "group_join_confirmed"
      lead_stage:
        | "captured_form"
        | "checkout_started"
        | "payment_pending"
        | "subscribed_active"
        | "subscribed_past_due"
        | "subscribed_canceled"
        | "nurture"
        | "lost"
        | "blocked"
        | "conectado"
        | "subscribed_onboarding"
        | "lead_captured"
      message_direction: "outbound" | "inbound"
      message_status: "queued" | "sent" | "delivered" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: ["requested", "confirmed", "canceled"],
      event_type: [
        "form_submitted",
        "checkout_started",
        "payment_created",
        "payment_confirmed",
        "payment_overdue",
        "subscription_canceled",
        "follow_sent",
        "message_received",
        "ai_response",
        "silence_applied",
        "welcome_sent",
        "group_invite_sent",
        "appointment_requested",
        "appointment_confirmed",
        "opt_out_requested",
        "group_join_confirmed",
      ],
      lead_stage: [
        "captured_form",
        "checkout_started",
        "payment_pending",
        "subscribed_active",
        "subscribed_past_due",
        "subscribed_canceled",
        "nurture",
        "lost",
        "blocked",
        "conectado",
        "subscribed_onboarding",
        "lead_captured",
      ],
      message_direction: ["outbound", "inbound"],
      message_status: ["queued", "sent", "delivered", "failed"],
    },
  },
} as const
