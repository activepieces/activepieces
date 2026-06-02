import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';
import { weekdoneCommon } from '../common';

type WeekdoneItem = {
  id: number;
  inserted: string;
  description: string;
  likecount: number;
  commentcount: number;
  type_id: number;
  team_id: number;
  user_id: number;
  priority: number;
  from_id: number | null;
  source: number;
  source_id: string | null;
  due_on: string | null;
  private: number;
  nr: number;
};

export const createItemAction = createAction({
  auth: weekdoneAuth,
  name: 'create_item',
  displayName: 'Create New Item',
  description: 'Creates a new report item in Weekdone.',
  props: {
    description: Property.LongText({
      displayName: 'Description',
      description: 'The text content of the report item.',
      required: true,
    }),
    type_id: Property.StaticDropdown({
      displayName: 'Report Category',
      description:
        'The category this item belongs to in your weekly report. Custom category IDs (4 and above) are available via the Custom API Call action.',
      required: true,
      defaultValue: 2,
      options: {
        options: [
          { label: 'Plans', value: 2 },
          { label: 'Progress', value: 1 },
          { label: 'Problems', value: 3 },
          { label: 'Plans on Hold', value: 0 },
        ],
      },
    }),
    period: Property.ShortText({
      displayName: 'Week',
      description:
        'The report week to add this item to, in YYYYWW format (e.g. "202403" for week 3 of 2024). Leave empty to use the current week.',
      required: false,
    }),
    user_id: weekdoneCommon.userDropdown({
      displayName: 'Assign To',
      description: 'The user to assign this item to. Leave empty to assign it to yourself.',
      required: false,
    }),
    team_id: weekdoneCommon.teamDropdown({
      displayName: 'Team',
      description: 'The team to add this item to. Leave empty to use your primary team.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The priority level for this item.',
      required: false,
      defaultValue: 0,
      options: {
        options: [
          { label: 'Not specified', value: 0 },
          { label: 'Green (low)', value: 1 },
          { label: 'Amber (medium)', value: 2 },
          { label: 'Red (high)', value: 3 },
        ],
      },
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description:
        'The due date for this item in YYYY-MM-DD format (e.g. "2024-03-15"). Leave empty for no due date.',
      required: false,
    }),
    is_private: Property.Checkbox({
      displayName: 'Private',
      description:
        'If enabled, only you can see this item. If disabled (default), the item is visible to your team.',
      required: false,
      defaultValue: false,
    }),
    source_id: Property.ShortText({
      displayName: 'External Source ID',
      description:
        'The ID of this item in an external system (e.g. a JIRA ticket number or Asana task ID). Maximum 50 characters.',
      required: false,
    }),
  },
  async run(context) {
    const {
      description,
      type_id,
      period,
      user_id,
      team_id,
      priority,
      due_on,
      is_private,
      source_id,
    } = context.propsValue;

    const token = context.auth.access_token;

    const body: Record<string, unknown> = {
      description,
      type_id,
    };

    if (period) body['period'] = period;
    if (user_id) body['user_id'] = user_id;
    if (team_id !== null && team_id !== undefined) body['team_id'] = team_id;
    if (priority !== null && priority !== undefined) body['priority'] = priority;
    if (due_on) body['due_on'] = due_on;
    if (is_private !== null && is_private !== undefined) body['private'] = is_private ? 1 : 0;
    if (source_id) body['source_id'] = source_id;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.POST,
      url: `https://api.weekdone.com/1/item?token=${token}`,
      body,
    });

    // Weekdone docs don't specify the create response shape; try common keys first.
    const item = (response.body['item'] ?? response.body['data'] ?? response.body) as WeekdoneItem;
    return {
      id: item.id,
      description: item.description,
      type_id: item.type_id,
      inserted: item.inserted,
      due_on: item.due_on ?? null,
      priority: item.priority,
      user_id: item.user_id,
      team_id: item.team_id,
      from_id: item.from_id ?? null,
      source: item.source,
      source_id: item.source_id ?? null,
      is_private: item.private,
      position: item.nr,
      like_count: item.likecount,
      comment_count: item.commentcount,
    };
  },
});
