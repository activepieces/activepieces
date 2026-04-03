import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { opplifyClient } from './client';

const BASE_URL = process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001';

/**
 * Build client context from PropertyContext (dropdown options function).
 */
async function ctxFromProperty(context: { project: { id: string; externalId: () => Promise<string | undefined> } }) {
  const externalId = await context.project.externalId() || '';
  return { projectId: context.project.id, externalId, baseUrl: BASE_URL };
}

// ============================================================================
// STATIC DROPDOWNS (fixed options from our schema)
// ============================================================================

export const statusDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Status',
  description: 'Lead status',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('statuses') as { statuses: Array<{ label: string; value: string }> };
      return {
        disabled: false,
        options: result.statuses || [],
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load statuses' };
    }
  },
});

export const lifecycleDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Lifecycle Stage',
  description: 'Lead lifecycle stage',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('lifecycle-stages') as { stages: Array<{ label: string; value: string }> };
      return {
        disabled: false,
        options: result.stages || [],
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load lifecycle stages' };
    }
  },
});

export const dealStageDropdown = Property.StaticDropdown({
  displayName: 'Deal Stage',
  description: 'Deal pipeline stage',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Discovery', value: 'discovery' },
      { label: 'Proposal', value: 'proposal' },
      { label: 'Negotiation', value: 'negotiation' },
      { label: 'Closed Won', value: 'closed_won' },
      { label: 'Closed Lost', value: 'closed_lost' },
    ],
  },
});

export const taskPriorityDropdown = Property.StaticDropdown({
  displayName: 'Priority',
  description: 'Task priority',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
      { label: 'Urgent', value: 'urgent' },
    ],
  },
});

export const orderStatusDropdown = Property.StaticDropdown({
  displayName: 'Order Status',
  description: 'Order status',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Pending', value: 'pending' },
      { label: 'Processing', value: 'processing' },
      { label: 'Paid', value: 'paid' },
      { label: 'Fulfilled', value: 'fulfilled' },
      { label: 'Cancelled', value: 'cancelled' },
      { label: 'Refunded', value: 'refunded' },
    ],
  },
});

export const leadSourceDropdown = Property.StaticDropdown({
  displayName: 'Filter by Source',
  description: 'Only trigger for leads from this source (optional)',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Form Submission', value: 'form_submission' },
      { label: 'Manual', value: 'manual' },
      { label: 'Import', value: 'import' },
      { label: 'Workflow', value: 'workflow' },
    ],
  },
});

// ============================================================================
// DYNAMIC DROPDOWNS
// Uses PieceAuth.None() + PropertyContext to load data from our API.
// The context.project.externalId() resolves to the Supabase user ID,
// which our API uses to determine the company.
// ============================================================================

export const formIdDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Form',
  description: 'Filter by form (optional)',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('forms') as { forms: Array<{ id: string; name: string }> };
      return {
        disabled: false,
        options: (result.forms || []).map((f) => ({ label: f.name, value: f.id })),
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { disabled: true, options: [], placeholder: 'Error: ' + msg.substring(0, 100) };
    }
  },
});

export const funnelIdDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Funnel',
  description: 'Filter by funnel (optional)',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('funnels') as { funnels: Array<{ id: string; name: string }> };
      return {
        disabled: false,
        options: (result.funnels || []).map((f) => ({ label: f.name, value: f.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load funnels' };
    }
  },
});

export const funnelActionDropdown = Property.StaticDropdown({
  displayName: 'Action',
  description: 'Filter by specific funnel action (optional)',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Published', value: 'published' },
      { label: 'Unpublished', value: 'unpublished' },
      { label: 'Archived', value: 'archived' },
      { label: 'Page Updated', value: 'page_updated' },
      { label: 'Version Restored', value: 'version_restored' },
    ],
  },
});

export const tagDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Tag',
  description: 'Select a tag',
  required: true,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('tags') as { tags: string[] };
      return {
        disabled: false,
        options: (result.tags || []).map((t) => ({ label: t, value: t })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load tags' };
    }
  },
});

export const tagFilterDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Filter by Tag',
  description: 'Only trigger for this specific tag (optional)',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('tags') as { tags: string[] };
      return {
        disabled: false,
        options: (result.tags || []).map((t) => ({ label: t, value: t })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load tags' };
    }
  },
});

export const customFieldDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Filter by Custom Field',
  description: 'Only trigger when this specific custom field changes (optional)',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('custom-fields') as { customFields: Array<{ label: string; value: string }> };
      return {
        disabled: false,
        options: result.customFields || [],
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load custom fields' };
    }
  },
});

export const userDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Assign To',
  description: 'Select a team member',
  required: false,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('users') as { users: Array<{ id: string; fullName: string; email: string }> };
      return {
        disabled: false,
        options: (result.users || []).map((u) => ({
          label: u.fullName || u.email,
          value: u.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load team members' };
    }
  },
});

export const eventTypeDropdown = Property.Dropdown({
  auth: PieceAuth.None(),
  displayName: 'Event Type',
  description: 'Select an event type for scheduling',
  required: true,
  refreshers: [],
  options: async (_propsValue, context) => {
    try {
      const ctx = await ctxFromProperty(context);
      const client = opplifyClient(ctx);
      const result = await client.getMeta('event-types') as { eventTypes: Array<{ id: string; title: string }> };
      return {
        disabled: false,
        options: (result.eventTypes || []).map((e) => ({ label: e.title, value: e.id })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load event types' };
    }
  },
});
