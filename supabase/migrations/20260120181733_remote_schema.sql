create extension if not exists "pg_cron" with schema "pg_catalog";

drop extension if exists "pg_net";

create extension if not exists "pg_net" with schema "public";

create type "public"."appointment_status" as enum ('requested', 'confirmed', 'canceled');

create type "public"."event_type" as enum ('form_submitted', 'checkout_started', 'payment_created', 'payment_confirmed', 'payment_overdue', 'subscription_canceled', 'follow_sent', 'message_received', 'silence_applied', 'welcome_sent', 'group_invite_sent', 'appointment_requested', 'appointment_confirmed');

create type "public"."lead_stage" as enum ('captured_form', 'checkout_started', 'payment_pending', 'subscribed_active', 'subscribed_past_due', 'subscribed_canceled', 'nurture', 'lost', 'blocked', 'conectado');

create type "public"."message_direction" as enum ('outbound', 'inbound');

create type "public"."message_status" as enum ('queued', 'sent', 'delivered', 'failed');


  create table "public"."ai_prompts" (
    "key" text not null,
    "content" text not null,
    "version" integer not null default 1,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."appointments" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "status" public.appointment_status not null default 'requested'::public.appointment_status,
    "starts_at" timestamp with time zone not null,
    "ends_at" timestamp with time zone not null,
    "google_calendar_event_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "status" text not null,
    "last_user_message_at" timestamp with time zone,
    "last_agent_message_at" timestamp with time zone,
    "recontact_1_sent" boolean default false,
    "recontact_2_sent" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."events" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "type" public.event_type not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."integrations" (
    "id" uuid not null default gen_random_uuid(),
    "entity_type" text not null,
    "entity_id" uuid not null,
    "provider" text not null,
    "external_id" text not null,
    "status" text not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "email" text not null,
    "whatsapp" text not null,
    "stage" public.lead_stage not null default 'checkout_started'::public.lead_stage,
    "silence_until" timestamp with time zone,
    "silence_reason" text,
    "asaas_customer_id" text,
    "asaas_subscription_id" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "notes" text,
    "whatsapp_norm" text,
    "previous_stage" public.lead_stage
      );



  create table "public"."message_queue" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "template_key" text not null,
    "scheduled_for" timestamp with time zone not null,
    "status" text not null default 'scheduled'::text,
    "reason" text,
    "created_at" timestamp with time zone not null default now(),
    "sent_at" timestamp with time zone
      );



  create table "public"."message_templates" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "content" text not null,
    "stage" public.lead_stage not null,
    "active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "template_key" text not null,
    "delay_seconds" integer not null
      );



  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid not null,
    "template_id" uuid,
    "direction" public.message_direction not null,
    "status" public.message_status not null,
    "content" text not null,
    "external_message_id" text,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."system_settings" (
    "key" text not null,
    "value" jsonb not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


CREATE UNIQUE INDEX ai_prompts_pkey ON public.ai_prompts USING btree (key);

CREATE INDEX appointments_lead_id_idx ON public.appointments USING btree (lead_id);

CREATE UNIQUE INDEX appointments_pkey ON public.appointments USING btree (id);

CREATE INDEX appointments_starts_at_idx ON public.appointments USING btree (starts_at);

CREATE INDEX appointments_status_idx ON public.appointments USING btree (status);

CREATE UNIQUE INDEX conversations_lead_id_key ON public.conversations USING btree (lead_id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE INDEX events_created_at_idx ON public.events USING btree (created_at);

CREATE INDEX events_lead_id_idx ON public.events USING btree (lead_id);

CREATE UNIQUE INDEX events_pkey ON public.events USING btree (id);

CREATE INDEX events_type_idx ON public.events USING btree (type);

CREATE INDEX idx_message_queue_lead ON public.message_queue USING btree (lead_id);

CREATE INDEX idx_message_queue_scheduled ON public.message_queue USING btree (scheduled_for);

CREATE INDEX idx_message_templates_stage_delay ON public.message_templates USING btree (stage, delay_seconds);

CREATE INDEX integrations_entity_idx ON public.integrations USING btree (entity_type, entity_id);

CREATE INDEX integrations_external_id_idx ON public.integrations USING btree (external_id);

CREATE UNIQUE INDEX integrations_pkey ON public.integrations USING btree (id);

CREATE INDEX integrations_provider_idx ON public.integrations USING btree (provider);

CREATE UNIQUE INDEX leads_email_key ON public.leads USING btree (email);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE INDEX leads_stage_idx ON public.leads USING btree (stage);

CREATE UNIQUE INDEX message_queue_pkey ON public.message_queue USING btree (id);

CREATE UNIQUE INDEX message_templates_pkey ON public.message_templates USING btree (id);

CREATE INDEX message_templates_stage_idx ON public.message_templates USING btree (stage);

CREATE INDEX messages_created_at_idx ON public.messages USING btree (created_at);

CREATE INDEX messages_direction_idx ON public.messages USING btree (direction);

CREATE INDEX messages_lead_id_idx ON public.messages USING btree (lead_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX messages_status_idx ON public.messages USING btree (status);

CREATE UNIQUE INDEX system_settings_pkey ON public.system_settings USING btree (key);

CREATE UNIQUE INDEX uniq_leads_whatsapp_norm ON public.leads USING btree (whatsapp_norm) WHERE (whatsapp_norm IS NOT NULL);

CREATE UNIQUE INDEX uniq_message_queue_scheduled ON public.message_queue USING btree (lead_id, template_key, scheduled_for) WHERE (status = 'scheduled'::text);

CREATE UNIQUE INDEX uniq_message_templates_key ON public.message_templates USING btree (template_key);

alter table "public"."ai_prompts" add constraint "ai_prompts_pkey" PRIMARY KEY using index "ai_prompts_pkey";

alter table "public"."appointments" add constraint "appointments_pkey" PRIMARY KEY using index "appointments_pkey";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "public"."integrations" add constraint "integrations_pkey" PRIMARY KEY using index "integrations_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."message_queue" add constraint "message_queue_pkey" PRIMARY KEY using index "message_queue_pkey";

alter table "public"."message_templates" add constraint "message_templates_pkey" PRIMARY KEY using index "message_templates_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."system_settings" add constraint "system_settings_pkey" PRIMARY KEY using index "system_settings_pkey";

alter table "public"."appointments" add constraint "appointments_duration_check" CHECK ((ends_at = (starts_at + '01:00:00'::interval))) not valid;

alter table "public"."appointments" validate constraint "appointments_duration_check";

alter table "public"."appointments" add constraint "appointments_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."appointments" validate constraint "appointments_lead_id_fkey";

alter table "public"."conversations" add constraint "conversations_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_lead_id_fkey";

alter table "public"."conversations" add constraint "conversations_lead_id_key" UNIQUE using index "conversations_lead_id_key";

alter table "public"."conversations" add constraint "conversations_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'waiting_lead'::text, 'inactive_soft'::text, 'inactive_closed'::text]))) not valid;

alter table "public"."conversations" validate constraint "conversations_status_check";

alter table "public"."events" add constraint "events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_lead_id_fkey";

alter table "public"."integrations" add constraint "integrations_entity_type_check" CHECK ((entity_type = ANY (ARRAY['lead'::text, 'appointment'::text]))) not valid;

alter table "public"."integrations" validate constraint "integrations_entity_type_check";

alter table "public"."integrations" add constraint "integrations_provider_check" CHECK ((provider = ANY (ARRAY['asaas'::text, 'zapi'::text, 'google'::text]))) not valid;

alter table "public"."integrations" validate constraint "integrations_provider_check";

alter table "public"."leads" add constraint "leads_email_key" UNIQUE using index "leads_email_key";

alter table "public"."message_queue" add constraint "message_queue_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."message_queue" validate constraint "message_queue_lead_id_fkey";

alter table "public"."message_queue" add constraint "message_queue_status_check" CHECK ((status = ANY (ARRAY['scheduled'::text, 'sent'::text, 'canceled'::text, 'skipped'::text]))) not valid;

alter table "public"."message_queue" validate constraint "message_queue_status_check";

alter table "public"."messages" add constraint "messages_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_lead_id_fkey";

alter table "public"."messages" add constraint "messages_template_id_fkey" FOREIGN KEY (template_id) REFERENCES public.message_templates(id) not valid;

alter table "public"."messages" validate constraint "messages_template_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cancel_pending_messages_on_subscribe()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Executa apenas quando o stage muda para subscribed_active
  IF NEW.stage = 'subscribed_active'
     AND OLD.stage IS DISTINCT FROM NEW.stage THEN

    UPDATE message_queue
       SET status = 'canceled',
           reason = 'converted_to_subscribed',
           updated_at = now()
     WHERE lead_id = NEW.id
       AND status = 'scheduled'
       -- mantém onboarding, cancela todo o resto
       AND template_key NOT LIKE 'subscribed_active%';
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.enqueue_followups_for_lead(p_lead_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_stage lead_stage;
  v_created_at timestamptz;
  v_template record;
  v_scheduled_at timestamptz;
begin
  -- 1️⃣ Buscar estágio atual do lead
  select stage, created_at
  into v_stage, v_created_at
  from leads
  where id = p_lead_id;

  if v_stage is null then
    raise exception 'Lead % não encontrado', p_lead_id;
  end if;

  -- 2️⃣ Percorrer templates ATIVOS do estágio do lead
  for v_template in
    select
      id,
      template_key,
      delay_seconds
    from message_templates
    where stage = v_stage::lead_stage
      and active = true
    order by delay_seconds asc
  loop
    -- 3️⃣ Calcular horário de envio
    v_scheduled_at := v_created_at + make_interval(secs => v_template.delay_seconds);

    -- 4️⃣ Inserir na fila (idempotente)
    insert into message_queue (
      lead_id,
      template_key,
      scheduled_for,
      status
    )
    values (
      p_lead_id,
      v_template.template_key,
      v_scheduled_at,
      'scheduled'
    )
    on conflict do nothing;
  end loop;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.move_leads_to_nurture_after_inactivity()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE leads l
  SET stage = 'nurture',
      updated_at = now()
  WHERE
    l.stage NOT IN ('nurture', 'blocked', 'subscribed_active')
    AND EXISTS (
      SELECT 1
      FROM message_queue mq
      WHERE mq.lead_id = l.id
        AND mq.status = 'sent'
      GROUP BY mq.lead_id
      HAVING max(mq.sent_at) <= now() - interval '15 days'
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_followups()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Só dispara para os estágios válidos
  IF NEW.stage IN ('captured_form', 'checkout_started') THEN
    PERFORM enqueue_followups_for_lead(NEW.id);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_enqueue_followups_on_event()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Só reage a eventos relevantes
  IF NEW.type IN ('form_submitted', 'checkout_started', 'payment_confirmed') THEN
    PERFORM enqueue_followups_for_lead(NEW.lead_id);
  END IF;

  RETURN NEW;
END;
$function$
;

grant delete on table "public"."ai_prompts" to "anon";

grant insert on table "public"."ai_prompts" to "anon";

grant references on table "public"."ai_prompts" to "anon";

grant select on table "public"."ai_prompts" to "anon";

grant trigger on table "public"."ai_prompts" to "anon";

grant truncate on table "public"."ai_prompts" to "anon";

grant update on table "public"."ai_prompts" to "anon";

grant delete on table "public"."ai_prompts" to "authenticated";

grant insert on table "public"."ai_prompts" to "authenticated";

grant references on table "public"."ai_prompts" to "authenticated";

grant select on table "public"."ai_prompts" to "authenticated";

grant trigger on table "public"."ai_prompts" to "authenticated";

grant truncate on table "public"."ai_prompts" to "authenticated";

grant update on table "public"."ai_prompts" to "authenticated";

grant delete on table "public"."ai_prompts" to "service_role";

grant insert on table "public"."ai_prompts" to "service_role";

grant references on table "public"."ai_prompts" to "service_role";

grant select on table "public"."ai_prompts" to "service_role";

grant trigger on table "public"."ai_prompts" to "service_role";

grant truncate on table "public"."ai_prompts" to "service_role";

grant update on table "public"."ai_prompts" to "service_role";

grant delete on table "public"."appointments" to "anon";

grant insert on table "public"."appointments" to "anon";

grant references on table "public"."appointments" to "anon";

grant select on table "public"."appointments" to "anon";

grant trigger on table "public"."appointments" to "anon";

grant truncate on table "public"."appointments" to "anon";

grant update on table "public"."appointments" to "anon";

grant delete on table "public"."appointments" to "authenticated";

grant insert on table "public"."appointments" to "authenticated";

grant references on table "public"."appointments" to "authenticated";

grant select on table "public"."appointments" to "authenticated";

grant trigger on table "public"."appointments" to "authenticated";

grant truncate on table "public"."appointments" to "authenticated";

grant update on table "public"."appointments" to "authenticated";

grant delete on table "public"."appointments" to "service_role";

grant insert on table "public"."appointments" to "service_role";

grant references on table "public"."appointments" to "service_role";

grant select on table "public"."appointments" to "service_role";

grant trigger on table "public"."appointments" to "service_role";

grant truncate on table "public"."appointments" to "service_role";

grant update on table "public"."appointments" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."events" to "anon";

grant insert on table "public"."events" to "anon";

grant references on table "public"."events" to "anon";

grant select on table "public"."events" to "anon";

grant trigger on table "public"."events" to "anon";

grant truncate on table "public"."events" to "anon";

grant update on table "public"."events" to "anon";

grant delete on table "public"."events" to "authenticated";

grant insert on table "public"."events" to "authenticated";

grant references on table "public"."events" to "authenticated";

grant select on table "public"."events" to "authenticated";

grant trigger on table "public"."events" to "authenticated";

grant truncate on table "public"."events" to "authenticated";

grant update on table "public"."events" to "authenticated";

grant delete on table "public"."events" to "service_role";

grant insert on table "public"."events" to "service_role";

grant references on table "public"."events" to "service_role";

grant select on table "public"."events" to "service_role";

grant trigger on table "public"."events" to "service_role";

grant truncate on table "public"."events" to "service_role";

grant update on table "public"."events" to "service_role";

grant delete on table "public"."integrations" to "anon";

grant insert on table "public"."integrations" to "anon";

grant references on table "public"."integrations" to "anon";

grant select on table "public"."integrations" to "anon";

grant trigger on table "public"."integrations" to "anon";

grant truncate on table "public"."integrations" to "anon";

grant update on table "public"."integrations" to "anon";

grant delete on table "public"."integrations" to "authenticated";

grant insert on table "public"."integrations" to "authenticated";

grant references on table "public"."integrations" to "authenticated";

grant select on table "public"."integrations" to "authenticated";

grant trigger on table "public"."integrations" to "authenticated";

grant truncate on table "public"."integrations" to "authenticated";

grant update on table "public"."integrations" to "authenticated";

grant delete on table "public"."integrations" to "service_role";

grant insert on table "public"."integrations" to "service_role";

grant references on table "public"."integrations" to "service_role";

grant select on table "public"."integrations" to "service_role";

grant trigger on table "public"."integrations" to "service_role";

grant truncate on table "public"."integrations" to "service_role";

grant update on table "public"."integrations" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant references on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant trigger on table "public"."leads" to "anon";

grant truncate on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant references on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant trigger on table "public"."leads" to "authenticated";

grant truncate on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant references on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant trigger on table "public"."leads" to "service_role";

grant truncate on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."message_queue" to "anon";

grant insert on table "public"."message_queue" to "anon";

grant references on table "public"."message_queue" to "anon";

grant select on table "public"."message_queue" to "anon";

grant trigger on table "public"."message_queue" to "anon";

grant truncate on table "public"."message_queue" to "anon";

grant update on table "public"."message_queue" to "anon";

grant delete on table "public"."message_queue" to "authenticated";

grant insert on table "public"."message_queue" to "authenticated";

grant references on table "public"."message_queue" to "authenticated";

grant select on table "public"."message_queue" to "authenticated";

grant trigger on table "public"."message_queue" to "authenticated";

grant truncate on table "public"."message_queue" to "authenticated";

grant update on table "public"."message_queue" to "authenticated";

grant delete on table "public"."message_queue" to "service_role";

grant insert on table "public"."message_queue" to "service_role";

grant references on table "public"."message_queue" to "service_role";

grant select on table "public"."message_queue" to "service_role";

grant trigger on table "public"."message_queue" to "service_role";

grant truncate on table "public"."message_queue" to "service_role";

grant update on table "public"."message_queue" to "service_role";

grant delete on table "public"."message_templates" to "anon";

grant insert on table "public"."message_templates" to "anon";

grant references on table "public"."message_templates" to "anon";

grant select on table "public"."message_templates" to "anon";

grant trigger on table "public"."message_templates" to "anon";

grant truncate on table "public"."message_templates" to "anon";

grant update on table "public"."message_templates" to "anon";

grant delete on table "public"."message_templates" to "authenticated";

grant insert on table "public"."message_templates" to "authenticated";

grant references on table "public"."message_templates" to "authenticated";

grant select on table "public"."message_templates" to "authenticated";

grant trigger on table "public"."message_templates" to "authenticated";

grant truncate on table "public"."message_templates" to "authenticated";

grant update on table "public"."message_templates" to "authenticated";

grant delete on table "public"."message_templates" to "service_role";

grant insert on table "public"."message_templates" to "service_role";

grant references on table "public"."message_templates" to "service_role";

grant select on table "public"."message_templates" to "service_role";

grant trigger on table "public"."message_templates" to "service_role";

grant truncate on table "public"."message_templates" to "service_role";

grant update on table "public"."message_templates" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."system_settings" to "anon";

grant insert on table "public"."system_settings" to "anon";

grant references on table "public"."system_settings" to "anon";

grant select on table "public"."system_settings" to "anon";

grant trigger on table "public"."system_settings" to "anon";

grant truncate on table "public"."system_settings" to "anon";

grant update on table "public"."system_settings" to "anon";

grant delete on table "public"."system_settings" to "authenticated";

grant insert on table "public"."system_settings" to "authenticated";

grant references on table "public"."system_settings" to "authenticated";

grant select on table "public"."system_settings" to "authenticated";

grant trigger on table "public"."system_settings" to "authenticated";

grant truncate on table "public"."system_settings" to "authenticated";

grant update on table "public"."system_settings" to "authenticated";

grant delete on table "public"."system_settings" to "service_role";

grant insert on table "public"."system_settings" to "service_role";

grant references on table "public"."system_settings" to "service_role";

grant select on table "public"."system_settings" to "service_role";

grant trigger on table "public"."system_settings" to "service_role";

grant truncate on table "public"."system_settings" to "service_role";

grant update on table "public"."system_settings" to "service_role";

CREATE TRIGGER trg_enqueue_followups_on_event AFTER INSERT ON public.events FOR EACH ROW EXECUTE FUNCTION public.trigger_enqueue_followups_on_event();

CREATE TRIGGER trg_cancel_pending_messages_on_subscribe AFTER UPDATE OF stage ON public.leads FOR EACH ROW EXECUTE FUNCTION public.cancel_pending_messages_on_subscribe();

CREATE TRIGGER trg_enqueue_followups_on_insert AFTER INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.trigger_enqueue_followups();


