import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { flattenSubmission, JsonObject, kleapRequest, resolveAppId } from '../common/client';
import { appDropdown, tableDropdown } from '../common/props';
import { columnDropdown } from '../common/db-props';

type KleapAuthConnection = AppConnectionValueForAuthProperty<typeof kleapAuth>;

/* ------------------------------------------------------------------ */
/* New Form Submission — LAST_ITEM on the submission id               */
/* ------------------------------------------------------------------ */

type FormProps = { app_id: string | undefined; flatten?: boolean | undefined };

export const formSubmissionPolling: Polling<KleapAuthConnection, FormProps> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const appId = await resolveAppId(auth, propsValue.app_id);
    // The API returns submissions newest first, which is the order LAST_ITEM expects.
    const response = await kleapRequest<{ submissions?: JsonObject[] }>(auth, HttpMethod.GET, `/apps/${appId}/forms`, {
      query: { limit: 100 },
    });
    return (response.submissions ?? []).map((s) => ({
      id: s['id'],
      data: propsValue.flatten === false ? { ...s, app_id: Number(appId) } : flattenSubmission(s, appId),
    }));
  },
};

export const newFormSubmission = createTrigger({
  auth: kleapAuth,
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Triggers when a visitor submits a form (contact, booking, signup…) on a Kleap site.',
  type: TriggerStrategy.POLLING,
  props: {
    app_id: appDropdown(),
    flatten: Property.Checkbox({
      displayName: 'Flatten Fields',
      description: 'Put the form fields at the top level (plus submission_id, submitted_at, app_id) instead of under "data".',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Hello, I would like a quote.',
    submission_id: 1234,
    submitted_at: '2026-09-25T08:00:00.000Z',
    app_id: 105000,
  },
  async test(context) {
    return pollingHelper.test(formSubmissionPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(formSubmissionPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(formSubmissionPolling, context);
  },
  async run(context) {
    return pollingHelper.poll(formSubmissionPolling, context);
  },
});

/* ------------------------------------------------------------------ */
/* New App — TIMEBASED on created_at                                  */
/* ------------------------------------------------------------------ */

export const newAppPolling: Polling<KleapAuthConnection, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth }) => {
    const response = await kleapRequest<{ apps?: JsonObject[] }>(auth, HttpMethod.GET, '/apps', {
      query: { limit: 100 },
    });
    return (response.apps ?? [])
      .filter((app) => typeof app['created_at'] === 'string')
      .map((app) => ({ epochMilliSeconds: Date.parse(app['created_at'] as string), data: app }));
  },
};

export const newApp = createTrigger({
  auth: kleapAuth,
  name: 'new_app',
  displayName: 'New App',
  description: 'Triggers when a new app (site) is created in your Kleap account.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 105000,
    name: 'Café Lumière',
    slug: 'cafe-lumiere',
    preview_url: 'https://kleap.co/app/105000',
    production_url: null,
    custom_domains: [],
    custom_domain: null,
    visibility: 'personal',
    created_at: '2026-09-25T08:00:00.000000+00:00',
  },
  async test(context) {
    return pollingHelper.test(newAppPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(newAppPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(newAppPolling, context);
  },
  async run(context) {
    return pollingHelper.poll(newAppPolling, context);
  },
});

/* ------------------------------------------------------------------ */
/* New Database Row — LAST_ITEM on the id column                      */
/* ------------------------------------------------------------------ */

type RowProps = {
  app_id: string | undefined;
  table: string | undefined;
  order_by?: string | undefined;
  id_column?: string | undefined;
};

export const databaseRowPolling: Polling<KleapAuthConnection, RowProps> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const appId = await resolveAppId(auth, propsValue.app_id);
    const table = String(propsValue.table ?? '').trim();
    if (!table) throw new Error('Select a table.');
    const orderBy = propsValue.order_by?.trim() || 'created_at';
    const idColumn = propsValue.id_column?.trim() || 'id';
    const response = await kleapRequest<{ rows?: JsonObject[] }>(
      auth,
      HttpMethod.GET,
      `/apps/${appId}/database/tables/${encodeURIComponent(table)}/rows`,
      { query: { order_by: orderBy, order: 'desc', limit: 100 } },
    );
    const rows = response.rows ?? [];
    if (rows.length && rows[0][idColumn] === undefined) {
      throw new Error(`Table "${table}" has no "${idColumn}" column. Set "ID Column" to its primary key.`);
    }
    return rows.map((row) => ({ id: row[idColumn], data: row }));
  },
};

export const newDatabaseRow = createTrigger({
  auth: kleapAuth,
  name: 'new_database_row',
  displayName: 'New Database Row',
  description: 'Triggers when a row is added to a table of the app\'s Kleap Database.',
  type: TriggerStrategy.POLLING,
  props: {
    app_id: appDropdown(),
    table: tableDropdown(),
    order_by: columnDropdown({
      displayName: 'Sort Column (Optional)',
      description: 'Column that grows with new rows. Leave empty for created_at (pick id if the table has no created_at).',
    }),
    id_column: columnDropdown({
      displayName: 'ID Column (Optional)',
      description: 'Unique column used to spot new rows. Leave empty for id.',
    }),
  },
  sampleData: {
    id: 42,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    status: 'new',
    created_at: '2026-09-25T08:00:00.000Z',
  },
  async test(context) {
    return pollingHelper.test(databaseRowPolling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(databaseRowPolling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(databaseRowPolling, context);
  },
  async run(context) {
    return pollingHelper.poll(databaseRowPolling, context);
  },
});
