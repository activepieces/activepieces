import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { getIssueHistoryActionOutputSchema } from '../output-schemas';

const PAGE_SIZE = 100;
const MAX_ACTIVITIES = 2000;
const ACTIVITY_VALUE_FIELDS = 'id,name,text,login,fullName,presentation,minutes';

const ACTIVITY_FIELDS =
  `activities(id,timestamp,author(name,login),field(name),targetMember,target(id,text),added(${ACTIVITY_VALUE_FIELDS}),removed(${ACTIVITY_VALUE_FIELDS})),afterCursor,hasAfter`;

function toRow(item: Record<string, unknown>): Record<string, unknown> {
  const author = youtrackClient.recordOf(item['author']);
  const target = youtrackClient.recordOf(item['target']);
  const added = valuesOf(item['added']);
  const isComment = (typeof item['$type'] === 'string' && item['$type'].includes('Comment'))
    || youtrackClient.records(item['added']).some((entry) => entry['$type'] === 'IssueComment');
  const comment = youtrackClient.records(item['added']).find((entry) => typeof entry['text'] === 'string');
  return {
    type: item['$type'] ?? null,
    timestamp: item['timestamp'] ?? null,
    author_name: author['name'] ?? null,
    author_login: author['login'] ?? null,
    field_name: youtrackClient.textOrNull(youtrackClient.recordOf(item['field'])['name']) ?? youtrackClient.textOrNull(item['targetMember']),
    target_id: youtrackClient.textOrNull(target['id']),
    added_values: added,
    removed_values: valuesOf(item['removed']),
    comment_text: isComment ? youtrackClient.textOrNull(comment?.['text']) ?? youtrackClient.textOrNull(target['text']) : null,
  };
}

function valuesOf(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const list = Array.isArray(value) ? value : [value];
  if (list.length === 0) return null;
  return list.map(display).join(', ');
}

function display(value: unknown): string {
  if (youtrackClient.isRecord(value)) {
    for (const key of ['name', 'fullName', 'login', 'presentation', 'text']) {
      const candidate = value[key];
      if (typeof candidate === 'string' && candidate !== '') return candidate;
    }
    if (typeof value['minutes'] === 'number') return String(value['minutes']);
    const { $type: _type, ...rest } = value;
    return Object.keys(rest).length === 0 ? String(_type ?? '') : JSON.stringify(rest);
  }
  return String(value);
}

export const getIssueHistoryAction = createAction({
  auth: youtrackAuth,
  name: 'get_issue_history',
  classification: 'READ',
  outputSchema: getIssueHistoryActionOutputSchema,
  displayName: 'Get Issue History',
  description: 'Retrieves the full change history (activity log) for a specific issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve the change history (activity log) of an issue, oldest first, filtered to the selected activity types (custom field changes and/or comments). Each row names the changed field, the added and removed values, the author and, for comments, the comment text. Fails rather than truncating when an issue has more than 2,000 matching activities. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    categories: Property.StaticMultiSelectDropdown({
      displayName: 'Activity Types',
      description: 'Select which types of activities to include.',
      required: true,
      defaultValue: ['CustomFieldCategory', 'CommentsCategory'],
      options: {
        options: [
          { label: 'Custom Field Changes', value: 'CustomFieldCategory' },
          { label: 'Comments', value: 'CommentsCategory' },
        ],
      },
    }),
  },
  async run(context) {
    const issueId = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const categoriesInput: unknown = context.propsValue.categories;
    const categories = (Array.isArray(categoriesInput) ? categoriesInput : [categoriesInput])
      .map((c) => youtrackClient.optionalText(c))
      .filter((c): c is string => c !== undefined);
    if (categories.length === 0) {
      throw new Error('Select at least one Activity Type.');
    }
    const activities: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    for (;;) {
      const page = youtrackClient.recordOf(await youtrackClient.request<unknown>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: `/issues/${issueId}/activitiesPage`,
        query: { categories: categories.join(','), fields: ACTIVITY_FIELDS, $top: PAGE_SIZE, cursor },
        operation: 'read the issue history',
      }));
      const batch = youtrackClient.records(page['activities']);
      activities.push(...batch);
      if (activities.length > MAX_ACTIVITIES) {
        throw new Error(`This issue has more than ${MAX_ACTIVITIES} activities of the selected types. Select fewer Activity Types.`);
      }
      const next = youtrackClient.optionalText(page['afterCursor']);
      if (page['hasAfter'] !== true || next === undefined || batch.length === 0 || next === cursor) break;
      cursor = next;
    }
    return activities.map(toRow);
  },
});
