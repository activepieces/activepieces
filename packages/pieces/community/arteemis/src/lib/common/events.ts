import { isRecord } from './client';

/** What Arteemis posts to a webhook: `{id, type, occurred_at, workspace_id, data}`. */
export type ArteemisEvent = {
  id: string;
  type: string;
  occurred_at: string;
  workspace_id: string;
  data: Record<string, unknown>;
};

export const ARTEEMIS_EVENTS = {
  NEW_REPLY: 'message.received',
  CONTACT_STATUS_CHANGED: 'contact.status_changed',
  LEAD_ENTERED_CAMPAIGN: 'enrollment.started',
  LEAD_LEFT_CAMPAIGN: 'enrollment.ended',
  MESSAGE_SENT: 'message.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
  TASK_CREATED: 'task.created',
  DEAL_STAGE_CHANGED: 'deal.stage_changed',
  JOB_FINISHED: 'job.finished',
} as const;

export type ArteemisEventType = (typeof ARTEEMIS_EVENTS)[keyof typeof ARTEEMIS_EVENTS];

// data.contact and data.campaign are read when the event is sent; the rest are the event's own facts.
const WORKSPACE_ID = 'org_2b7Qk1sLxV9mN3pR';
const CONTACT = {
  id: '5b8f1c7e-2a4d-4e8b-9c3f-1d2e3f4a5b6c',
  full_name: 'Claire Martin',
  first_name: 'Claire',
  last_name: 'Martin',
  email: 'claire.martin@example.com',
  linkedin_url: 'https://www.linkedin.com/in/claire-martin',
  title: 'Head of Sales',
  organization: 'Acme',
  lead_status: 'replied',
  reply_kind: 'interested',
  custom_fields: { industry_segment: 'SaaS' },
};
const IN_CAMPAIGN = { ...CONTACT, lead_status: 'in_campaign', reply_kind: null };
const CAMPAIGN = { id: '0e2b6f4a-8c1d-4f3e-9a7b-5c6d7e8f9a0b', name: 'Q4 Heads of Sales' };
const ENROLLMENT_ID = '7d3c2b1a-0f9e-4d8c-b7a6-958473625140';

function event(id: string, type: ArteemisEventType, occurredAt: string, data: Record<string, unknown>): ArteemisEvent {
  return { id, type, occurred_at: occurredAt, workspace_id: WORKSPACE_ID, data };
}

export const SAMPLE_EVENTS: Record<ArteemisEventType, ArteemisEvent> = {
  'message.received': event('message:1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b', 'message.received', '2026-10-27T09:12:44.000Z', {
    message: { id: '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b', channel: 'email', received_at: '2026-10-27T09:12:40.000Z' },
    contact: CONTACT,
    campaign: CAMPAIGN,
    enrollment_id: ENROLLMENT_ID,
  }),
  'contact.status_changed': event('journal:9f1c4b2a-3d5e-4f60-8a71-b2c3d4e5f607', 'contact.status_changed', '2026-10-27T09:13:02.000Z', {
    status: 'replied',
    reply_kind: 'interested',
    source: 'system',
    enrollment_id: ENROLLMENT_ID,
    contact: CONTACT,
    campaign: CAMPAIGN,
  }),
  'enrollment.started': event('journal:2a3b4c5d-6e7f-4a8b-9c0d-1e2f3a4b5c6d', 'enrollment.started', '2026-10-20T08:00:00.000Z', {
    enrollment_id: ENROLLMENT_ID,
    contact: IN_CAMPAIGN,
    campaign: CAMPAIGN,
  }),
  'enrollment.ended': event('journal:3b4c5d6e-7f8a-4b9c-8d1e-2f3a4b5c6d7e', 'enrollment.ended', '2026-10-27T09:13:02.000Z', {
    reason: 'replied',
    enrollment_id: ENROLLMENT_ID,
    contact: CONTACT,
    campaign: CAMPAIGN,
  }),
  'message.sent': event('send:4c5d6e7f-8a9b-4c0d-9e2f-3a4b5c6d7e8f', 'message.sent', '2026-10-22T10:30:00.000Z', {
    message: {
      id: '4c5d6e7f-8a9b-4c0d-9e2f-3a4b5c6d7e8f',
      channel: 'email',
      kind: 'email',
      step_index: 1,
      subject: 'Your outbound in Q4',
      automated: true,
    },
    enrollment_id: ENROLLMENT_ID,
    contact: IN_CAMPAIGN,
    campaign: CAMPAIGN,
  }),
  'invitation.accepted': event('accepted:7d3c2b1a-0f9e-4d8c-b7a6-958473625140', 'invitation.accepted', '2026-10-21T15:04:00.000Z', {
    linkedin_account_id: '6e7f8a9b-0c1d-4e2f-8a3b-4c5d6e7f8a9b',
    enrollment_id: ENROLLMENT_ID,
    contact: IN_CAMPAIGN,
    campaign: CAMPAIGN,
  }),
  'task.created': event('task:8a9b0c1d-2e3f-4a4b-9c5d-6e7f8a9b0c1d', 'task.created', '2026-10-27T09:12:50.000Z', {
    task: { id: '8a9b0c1d-2e3f-4a4b-9c5d-6e7f8a9b0c1d', kind: 'reply', title: 'Answer Claire Martin', due_at: '2026-10-27T17:00:00.000Z' },
    enrollment_id: ENROLLMENT_ID,
    contact: CONTACT,
    campaign: CAMPAIGN,
  }),
  'deal.stage_changed': event('deal:9b0c1d2e-3f4a-4b5c-8d6e-7f8a9b0c1d2e:1793092380000', 'deal.stage_changed', '2026-10-27T09:13:00.000Z', {
    stage: { id: 'meeting', name: 'Meeting booked' },
    contact: CONTACT,
    campaign: null,
  }),
  'job.finished': event('job:a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'job.finished', '2026-10-27T09:20:00.000Z', {
    job: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      type: 'enrich',
      status: 'succeeded',
      error: null,
      result: {
        total: 120,
        done: 120,
        found: { company: 98, linkedin: 87, email: 64, verifiedEmail: 58, mobile: 12 },
        credits: 420,
        stopped: null,
      },
    },
  }),
};

// The objects an event may carry as null, with their keys, so a flattened event always has the same columns.
const NULLABLE_OBJECTS: Record<string, string[]> = {
  contact: Object.keys(CONTACT).filter((key) => key !== 'custom_fields'),
  campaign: Object.keys(CAMPAIGN),
};

/**
 * Flattens nested objects into `parent_child` keys, so a row maps to columns: `data.contact.email` becomes
 * `contact_email`. Arrays become comma-separated text.
 */
export function flattenObject(value: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const flatKey = prefix ? `${prefix}_${key}` : key;
    if (item === null && !prefix && NULLABLE_OBJECTS[key]) {
      for (const field of NULLABLE_OBJECTS[key]) {
        out[`${flatKey}_${field}`] = null;
      }
    } else if (Array.isArray(item)) {
      out[flatKey] = item.map((entry) => (typeof entry === 'object' ? JSON.stringify(entry) : String(entry))).join(', ');
    } else if (isRecord(item)) {
      Object.assign(out, flattenObject(item, flatKey));
    } else {
      out[flatKey] = item ?? null;
    }
  }
  return out;
}

/** One event as a flow receives it: its envelope, then its data flattened. */
export function flattenEvent(event: ArteemisEvent): Record<string, unknown> {
  return {
    event_id: event.id,
    event_type: event.type,
    occurred_at: event.occurred_at,
    workspace_id: event.workspace_id,
    ...flattenObject(event.data),
  };
}
