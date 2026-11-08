import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, WORK_ITEM_FIELDS, workItemRow, workItemTypeDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { addWorkItemActionOutputSchema } from '../output-schemas';

function todayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

export const addWorkItemAction = createAction({
  auth: youtrackAuth,
  name: 'add_work_item',
  classification: 'WRITE',
  outputSchema: addWorkItemActionOutputSchema,
  displayName: 'Log Work on Issue',
  description: 'Logs spent time (a work item) on an issue. Time tracking must be enabled in the project.',
  audience: 'both',
  aiMetadata: {
    description:
      'Log spent time on an issue: a duration ("1h 30m", "2d" or a number of minutes), an optional date (YYYY-MM-DD, default today in UTC), an optional note, work type ID (from Get Project) and author login (from Find Users; default the token user). Time tracking must be enabled in the project. Not idempotent: each call logs another work item, so check Find Work Items first.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    duration: Property.ShortText({ displayName: 'Duration', description: 'Time spent, like "1h 30m", "45m", "2d", or a number of minutes like "90".', required: true }),
    date: Property.ShortText({ displayName: 'Date', description: 'Day the work was done, YYYY-MM-DD. Leave empty for today (UTC).', required: false }),
    text: Property.LongText({ displayName: 'Description', description: 'Optional note about the work.', required: false }),
    type: workItemTypeDropdown,
    author: Property.ShortText({ displayName: 'Author Login', description: 'Optional login of the user who did the work. Leave empty for the token user.', required: false }),
  },
  async run(context) {
    const duration = youtrackClient.optionalText(context.propsValue.duration);
    if (duration === undefined) {
      throw new Error('Duration is required, like "1h 30m" or "90".');
    }
    const date = youtrackClient.parseDate({ value: context.propsValue.date, label: 'Date' }) ?? todayUtc();
    const body: Record<string, unknown> = {
      duration: /^\d+$/.test(duration) ? { minutes: Number(duration) } : { presentation: duration },
      date,
    };
    const text = youtrackClient.optionalText(context.propsValue.text);
    if (text !== undefined) body['text'] = text;
    const type = youtrackClient.optionalText(context.propsValue.type);
    if (type !== undefined) body['type'] = { id: type };
    const author = youtrackClient.optionalText(context.propsValue.author);
    if (author !== undefined) body['author'] = { login: author };
    const response = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/issues/${youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' })}/timeTracking/workItems`,
      query: { fields: WORK_ITEM_FIELDS },
      body,
      operation: 'log work on the issue',
    });
    return workItemRow(youtrackClient.recordOf(response));
  },
});
