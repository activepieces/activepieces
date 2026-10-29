import { createHmac, timingSafeEqual } from "node:crypto";
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import fields from "../generated/fields.json";
import { syconAuth } from "./auth";
import { api, isMissing } from "./client";

/**
 * Instant triggers. A flow that is switched on subscribes its webhook address to Syncon One's
 * webhooks, and switching it off removes the subscription. A delivery carries only ids, so the
 * trigger reads the record with the flow's own key: a record that key cannot see produces nothing.
 * When the platform hands over the raw body, a delivery whose signature does not verify is dropped.
 */

type Meta = { label: string; path: string };
const meta = fields as unknown as Record<string, Meta>;
const KEYS = ["person", "company", "lead", "opportunity"] as const;
const SIGNATURE_HEADER = "x-syncon-signature";
const TOLERANCE_SECONDS = 300;
const STORE_KEY = "syncon_webhook";

type Envelope = {
  id: string;
  type: string;
  createdAt?: string;
  data?: { objectType?: string; publicId?: string; [key: string]: unknown };
};
type Stored = { id: string; secret: string };

/** `t=<unix>,v1=<hex>` over `<t>.<body>`, the same check the webhook docs give receivers. */
export function signatureOk(secret: string, rawBody: string, header: string | undefined): boolean {
  if (!secret || !header) return false;
  const parts: Record<string, string> = {};
  for (const part of header.split(",")) {
    const index = part.indexOf("=");
    if (index > 0) parts[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }
  const at = Number(parts.t);
  if (!Number.isFinite(at) || Math.abs(Date.now() / 1000 - at) > TOLERANCE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const given = Buffer.from(parts.v1 ?? "", "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

function rawText(rawBody: unknown): string | null {
  if (typeof rawBody === "string") return rawBody;
  if (Buffer.isBuffer(rawBody)) return rawBody.toString("utf8");
  return null;
}

function trigger(spec: {
  name: string;
  displayName: string;
  description: string;
  events: string[];
  /** For record events: the kind of record, by its `objectType`. */
  objectType?: string;
  record?: string;
  composite?: boolean;
  /** For conversation, booking, task and note events: where it is read, and under which key of the event's data its public id is. */
  path?: string;
  idKey?: string;
  /** A deleted record cannot be read back, so the run is built from the event alone. */
  fromEvent?: (envelope: Envelope) => Record<string, unknown>;
  sample?: Record<string, unknown>;
  /** The API has no list to take samples from. */
  noList?: boolean;
}) {
  const path = spec.path ?? meta[spec.record!]!.path;
  return createTrigger({
    auth: syconAuth,
    name: spec.name,
    displayName: spec.displayName,
    description: spec.description,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: spec.sample ?? {
      id: `${spec.record!.slice(0, 3)}_sample0001`,
      object: spec.record,
      event_id: "evt_sample0001",
    },
    async onEnable(context) {
      const created = await api<{ data: Stored }>(context.auth, {
        method: HttpMethod.POST,
        path: "/webhooks",
        body: { url: context.webhookUrl, events: spec.events, description: "Activepieces" },
      });
      await context.store.put<Stored>(STORE_KEY, {
        id: created.data.id,
        secret: created.data.secret,
      });
    },
    async onDisable(context) {
      const stored = await context.store.get<Stored>(STORE_KEY);
      if (!stored?.id) return;
      try {
        await api(context.auth, {
          method: HttpMethod.DELETE,
          path: `/webhooks/${encodeURIComponent(stored.id)}`,
        });
      } catch (error) {
        if (!isMissing(error)) throw error;
      }
      await context.store.delete(STORE_KEY);
    },
    async run(context) {
      const stored = await context.store.get<Stored>(STORE_KEY);
      const text = rawText(context.payload.rawBody);
      /* With the raw body and the secret in hand, a delivery must prove it is Syncon One's. */
      if (stored?.secret && text !== null) {
        const header = context.payload.headers?.[SIGNATURE_HEADER];
        if (!signatureOk(stored.secret, text, header)) return [];
      }
      const body = context.payload.body as Envelope | Envelope[];
      const out: unknown[] = [];
      for (const envelope of Array.isArray(body) ? body : [body]) {
        if (!envelope || !spec.events.includes(envelope.type)) continue;
        if (spec.fromEvent) {
          out.push(spec.fromEvent(envelope));
          continue;
        }
        const target = spec.idKey ? envelope.data?.[spec.idKey] : envelope.data?.publicId;
        if (typeof target !== "string" || !target) continue;
        if (!spec.idKey && envelope.data?.objectType !== spec.objectType) continue;
        try {
          const record = (
            await api<{ data: Record<string, unknown> }>(context.auth, {
              path: `${path}/${encodeURIComponent(target)}`,
            })
          ).data;
          out.push(
            spec.composite
              ? {
                  ...record,
                  id: `${record.id}-${envelope.id}`,
                  record_id: record.id,
                  event_id: envelope.id,
                }
              : { ...record, event_id: envelope.id },
          );
        } catch (error) {
          if (!isMissing(error)) throw error;
        }
      }
      return out;
    },
    async test(context) {
      if (spec.noList) return [spec.sample ?? {}];
      const result = await api<{ data: unknown[] }>(context.auth, {
        path,
        query: spec.idKey ? { limit: 3 } : { sort: "-created_at", limit: 3 },
      });
      return result.data;
    },
  });
}

const created = KEYS.map((key) =>
  trigger({
    name: `new_${key}`,
    displayName: `New ${meta[key]!.label}`,
    description: `Triggers when a ${meta[key]!.label.toLowerCase()} is added in Syncon One, within seconds.`,
    events: ["record.created"],
    objectType: key,
    record: key,
  }),
);

const updated = KEYS.map((key) =>
  trigger({
    name: `updated_${key}`,
    displayName: `${meta[key]!.label} Updated`,
    description: `Triggers when a field on a ${meta[key]!.label.toLowerCase()} changes in Syncon One, within seconds.`,
    events: ["record.updated"],
    objectType: key,
    record: key,
    composite: true,
  }),
);

const deals = (
  [
    ["won", "Deal Won", "opportunity.won", "moves to a won stage"],
    ["lost", "Deal Lost", "opportunity.lost", "moves to a lost stage"],
    [
      "stage_changed",
      "Deal Stage Changed",
      "opportunity.stage_changed",
      "moves to another open stage",
    ],
  ] as const
).map(([suffix, displayName, event, phrase]) =>
  trigger({
    name: `deal_${suffix}`,
    displayName,
    description: `Triggers when a deal ${phrase}, within seconds.`,
    events: [event],
    objectType: "opportunity",
    record: "opportunity",
    composite: true,
  }),
);

/*
 * Conversations, requests for a person, bookings, tasks, notes and deleted records. Each event
 * names what it is about by public id; the trigger reads it with the flow's own key. A conversation
 * has many messages and a person can ask for a human more than once, so those are composite.
 */
const conversationSample = {
  id: "conv_sample0001",
  object: "conversation",
  visitor_name: "Alex Morgan",
  channel: "web chat",
  status: "open",
  responder: "ai",
  last_message: "Can I book a demo for next week?",
  updated_at: "2026-10-29T08:00:00.000Z",
  event_id: "evt_sample0001",
};

const conversations = (
  [
    [
      "new_conversation",
      "New Conversation",
      "conversation.created",
      "starts a conversation",
      false,
    ],
    [
      "conversation_message",
      "Visitor Message Received",
      "conversation.message_received",
      "sends a message",
      true,
    ],
    [
      "human_requested",
      "Human Requested",
      "conversation.handoff_requested",
      "asks for a person, or leaves a follow-up for one",
      true,
    ],
  ] as const
).map(([name, displayName, event, phrase, composite]) =>
  trigger({
    name,
    displayName,
    description: `Triggers when a visitor or customer ${phrase}, within seconds. The conversation comes with its latest message.`,
    events: [event],
    path: "/conversations",
    idKey: "conversationId",
    composite,
    sample: conversationSample,
  }),
);

const others = [
  trigger({
    name: "meeting_booked",
    displayName: "Meeting Booked",
    description: "Triggers when a visitor books a meeting in a conversation, within seconds.",
    events: ["meeting.booked"],
    path: "/meetings",
    idKey: "meetingId",
    sample: { id: "mtg_sample0001", object: "meeting", event_id: "evt_sample0001" },
  }),
  trigger({
    name: "new_task",
    displayName: "New Task",
    description: "Triggers when a task is added in Syncon One, within seconds.",
    events: ["task.created"],
    path: "/tasks",
    idKey: "taskId",
    sample: { id: "tsk_sample0001", object: "task", event_id: "evt_sample0001" },
  }),
  trigger({
    name: "task_completed",
    displayName: "Task Completed",
    description: "Triggers when a task is marked done in Syncon One, within seconds.",
    events: ["task.completed"],
    path: "/tasks",
    idKey: "taskId",
    composite: true,
    sample: { id: "tsk_sample0001", object: "task", status: "done", event_id: "evt_sample0001" },
  }),
  trigger({
    name: "new_note",
    displayName: "New Note",
    description:
      "Triggers when a note is written on a customer, company, lead or deal, within seconds.",
    events: ["note.created"],
    path: "/notes",
    idKey: "noteId",
    noList: true,
    sample: {
      id: "note_sample0001",
      object: "note",
      body: "Wants pricing options before Friday.",
      event_id: "evt_sample0001",
    },
  }),
  trigger({
    name: "record_deleted",
    displayName: "Record Deleted",
    description:
      "Triggers when a customer, company, lead, deal or custom record is permanently deleted, within seconds.",
    events: ["record.deleted"],
    path: "/people",
    fromEvent: (envelope) => {
      const recordId = envelope.data?.publicId ?? envelope.data?.recordId;
      return {
        id: `${recordId ?? "record"}-${envelope.id}`,
        record_id: recordId ?? null,
        object_type: envelope.data?.objectType ?? null,
        deleted: true,
        deleted_at: envelope.createdAt ?? null,
        event_id: envelope.id,
      };
    },
    noList: true,
    sample: {
      id: "pr_sample0001-evt_sample0001",
      record_id: "pr_sample0001",
      object_type: "person",
      deleted: true,
      event_id: "evt_sample0001",
    },
  }),
];

export const triggers = [...created, ...updated, ...deals, ...conversations, ...others];
