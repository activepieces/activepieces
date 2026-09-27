import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, kleapRequest, KleapApiError, resolveAppId } from './client';

/** App picker. The value is the numeric app id; a mapped URL, domain or slug is resolved at run time. */
export const appDropdown = (options: { required?: boolean; description?: string } = {}) =>
  Property.Dropdown({
    auth: kleapAuth,
    displayName: 'App',
    description:
      options.description ??
      'The Kleap app (site). You can also map an app id, a site URL, a domain or a slug from a previous step.',
    required: options.required ?? true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, ctx) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Kleap account first' };
      }
      try {
        const response = await kleapRequest<{ apps?: JsonObject[] }>(auth, HttpMethod.GET, '/apps', {
          query: { limit: 100, q: ctx?.searchValue || undefined },
        });
        const apps = response.apps ?? [];
        return {
          disabled: false,
          placeholder: apps.length ? 'Select an app' : 'No app found',
          options: apps.map((app) => ({
            label: `${(app['name'] as string) || (app['slug'] as string) || 'Untitled'} (#${app['id']})`,
            value: String(app['id']),
          })),
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: (error as Error).message };
      }
    },
  });

/** Table picker for the app's Kleap Database. Refreshes when the app changes. */
export const tableDropdown = () =>
  Property.Dropdown({
    auth: kleapAuth,
    displayName: 'Table',
    description: 'A table of the app\'s Kleap Database. You can also map a table name.',
    required: true,
    refreshers: ['app_id'],
    options: async ({ auth, app_id }) => {
      if (!auth) return { disabled: true, options: [], placeholder: 'Connect your Kleap account first' };
      if (!app_id) return { disabled: true, options: [], placeholder: 'Select an app first' };
      try {
        const appId = await resolveAppId(auth, app_id);
        const schema = await kleapRequest<{ tables?: JsonObject[] }>(auth, HttpMethod.GET, `/apps/${appId}/database`);
        const tables = schema.tables ?? [];
        return {
          disabled: false,
          placeholder: tables.length ? 'Select a table' : 'This database has no table yet',
          options: tables.map((t) => ({
            // row_count is a Postgres planner estimate, null for a table never analysed.
            label: `${t['name']}${t['row_count'] != null ? ` (~${t['row_count']} rows)` : ''}`,
            value: String(t['name']),
          })),
        };
      } catch (error) {
        const message =
          error instanceof KleapApiError && error.code === 'DATABASE_NOT_PROVISIONED'
            ? 'No database yet: ask the AI to "add a database" with Edit App With AI'
            : (error as Error).message;
        return { disabled: true, options: [], placeholder: message };
      }
    },
  });

export const waitProps = (defaultMinutes = 9, defaultWait = true) => ({
  wait_for_completion: Property.Checkbox({
    displayName: 'Wait for Completion',
    description:
      'Wait until the AI has finished (1 to 5 minutes, usually). If off, the step returns the task_id immediately; use "Get Task" later.',
    required: false,
    defaultValue: defaultWait,
  }),
  timeout_minutes: Property.Number({
    displayName: 'Timeout (Minutes)',
    description:
      'How long to wait at most (max 20). Keep it under your Activepieces flow timeout (AP_FLOW_TIMEOUT_SECONDS, 600 s by default). On timeout the step returns the task with wait_timed_out: true.',
    required: false,
    defaultValue: defaultMinutes,
  }),
});

export const publishWhenDoneProp = () =>
  Property.Checkbox({
    displayName: 'Publish When Done',
    description: 'Publish the site to its public URL once the AI has finished (requires "Wait for Completion").',
    required: false,
    defaultValue: false,
  });

export const taskOptionProps = () => ({
  idempotency_key: Property.ShortText({
    displayName: 'Idempotency Key',
    description: 'Sending the same key twice returns the first task instead of starting a second one.',
    required: false,
  }),
  webhook_url: Property.ShortText({
    displayName: 'Webhook URL',
    description: 'Kleap POSTs the task result to this URL when it finishes (e.g. a Catch Webhook flow).',
    required: false,
  }),
  webhook_secret: Property.ShortText({
    displayName: 'Webhook Secret',
    description: 'Used to sign the webhook payload.',
    required: false,
  }),
});
