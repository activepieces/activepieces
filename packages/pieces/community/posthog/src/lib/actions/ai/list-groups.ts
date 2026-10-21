import { createAction, OutputSchema, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';

const { recordOf, str, num, arrayOf } = posthogClient;

function cursorOf(next: unknown): string | null {
  const text = str(next);
  if (!text) return null;
  try {
    return new URL(text).searchParams.get('cursor');
  } catch {
    return null;
  }
}

function group(raw: unknown) {
  const g = recordOf(raw);
  return {
    groupKey: str(g['group_key']),
    groupTypeIndex: num(g['group_type_index']),
    properties: recordOf(g['group_properties']),
    createdAt: str(g['created_at']),
  };
}

const groupsSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Groups',
      labelKey: 'groupKey',
      listItems: [
        { key: 'groupKey', label: 'Group Key' },
        { key: 'groupTypeIndex', label: 'Group Type Index', format: 'number' },
        { key: 'properties', label: 'Properties', dynamicKey: true },
        { key: 'createdAt', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'nextCursor', label: 'Next Cursor', description: 'Pass as cursor to get the next page; null when there is none.' },
  ] satisfies OutputSchemaField[],
};

export const listGroups = createAction({
  auth: posthogAuth,
  name: 'list_groups',
  classification: 'SEARCH',
  displayName: 'List Groups',
  description: 'List groups (companies, teams...) of one group type.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists PostHog groups (group analytics entities such as companies) of one group type. groupTypeIndex is 0-4, the index of the group type set up in the project (e.g. 0 = company). Optional search matches group key or name. Returns groupKey, properties and createdAt, plus hasMore/nextCursor; pass nextCursor back as cursor for the next page. Empty when the project has no group analytics. Read-only.',
    idempotent: true,
  },
  outputSchema: groupsSchema,
  props: {
    groupTypeIndex: Property.Number({ displayName: 'Group Type Index', description: '0-4', required: true }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'Use nextCursor from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const groupTypeIndex = posthogClient.parseInteger({ value: propsValue.groupTypeIndex, label: 'Group Type Index', min: 0, max: 4, fallback: -1 });
    if (groupTypeIndex < 0) throw new Error('Group Type Index is required.');
    const body = recordOf(
      await posthogClient.request({
        auth: auth.props,
        method: HttpMethod.GET,
        path: posthogClient.projectPath({ auth: auth.props, segments: ['groups'] }),
        query: { group_type_index: groupTypeIndex, search: posthogClient.optionalText(propsValue.search), cursor: posthogClient.optionalText(propsValue.cursor) },
      }),
    );
    const items = arrayOf(body['results']).map(group);
    const nextCursor = cursorOf(body['next']);
    return { items, count: items.length, hasMore: nextCursor !== null, nextCursor };
  },
});
