import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const createdDashboardOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Dashboard ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'pinned', label: 'Pinned', format: 'boolean' },
    { key: 'tags', label: 'Tags' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const createDashboard = createAction({
  auth: posthogAuth,
  name: 'create_dashboard',
  classification: 'WRITE',
  displayName: 'Create Dashboard',
  description: 'Create an empty dashboard.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an empty PostHog dashboard with a name, optional description and pinned flag (pinned shows it in the sidebar, default false). Add charts to it with Create Trends Insight and the returned dashboard id. Each call creates another dashboard, even with the same name. Returns the dashboard id and a link.',
    idempotent: false,
  },
  outputSchema: createdDashboardOutputSchema,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    pinned: Property.Checkbox({ displayName: 'Pinned', required: false, defaultValue: false }),
  },
  async run({ auth, propsValue }) {
    const name = posthogClient.requiredText({ value: propsValue.name, label: 'Name' });
    const pinned = posthogClient.parseBoolean({ value: propsValue.pinned, label: 'Pinned' }) ?? false;
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['dashboards'] }),
      body: { name, description: posthogClient.optionalText(propsValue.description) ?? '', pinned },
    });
    const r = posthogClient.recordOf(body);
    const id = posthogClient.num(r['id']);
    return {
      id,
      name: posthogClient.str(r['name']),
      description: posthogClient.str(r['description']),
      pinned: r['pinned'] === true,
      tags: posthogClient.arrayOf(r['tags']).filter((t): t is string => typeof t === 'string'),
      createdAt: posthogClient.str(r['created_at']),
      url: id === null ? null : posthogMappers.webUrl({ auth: auth.props, path: ['dashboard', id] }),
    };
  },
});
