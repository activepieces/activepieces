import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { weekdoneAuth } from '../auth';

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

export const updateItemAction = createAction({
  auth: weekdoneAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Updates an existing report item in Weekdone.',
  props: {
    search_period: Property.ShortText({
      displayName: 'Search Week',
      description:
        'Filter the item list by week in YYYYWW format (e.g. "202403" for week 3 of 2024). Leave empty to search the current week.',
      required: false,
    }),
    item_id: Property.Dropdown({
      displayName: 'Item',
      description: 'The report item to update. Change "Search Week" above to find items from other weeks.',
      required: true,
      refreshers: ['search_period'],
      auth: weekdoneAuth,
      options: async ({ auth, search_period }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Please connect your account first.' };
        }
        const token = (auth as { access_token: string }).access_token;
        const queryParams: Record<string, string> = { user_id: 'me' };
        if (search_period) queryParams['period'] = search_period as string;

        try {
          const response = await httpClient.sendRequest<{
            status: string;
            items: WeekdoneItem[];
          }>({
            method: HttpMethod.GET,
            url: `https://api.weekdone.com/1/items?token=${token}`,
            queryParams,
          });
          const items = response.body.items ?? [];
          if (items.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No items found for this week. Try a different Search Week.',
            };
          }
          return {
            disabled: false,
            options: items.map((item) => ({
              label: item.description,
              value: item.id,
            })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load items. Check your connection.',
          };
        }
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new text content for the item. Leave empty to keep the current value.',
      required: false,
    }),
    type_id: Property.StaticDropdown({
      displayName: 'Report Category',
      description:
        'Move this item to a different report category. If you change this, you must also fill in "Target Week" below.',
      required: false,
      options: {
        options: [
          { label: 'Plans', value: 2 },
          { label: 'Progress', value: 1 },
          { label: 'Problems', value: 3 },
          { label: 'Plans on Hold', value: 0 },
        ],
      },
    }),
    move_to_period: Property.ShortText({
      displayName: 'Target Week',
      description:
        'Required when changing the Report Category. The week to move the item into, in YYYYWW format (e.g. "202403").',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'The new priority level for this item. Leave empty to keep the current value.',
      required: false,
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
        'The new due date in YYYY-MM-DD format (e.g. "2024-03-15"). Leave empty to keep the current value.',
      required: false,
    }),
  },
  async run(context) {
    const { item_id, description, type_id, move_to_period, priority, due_on } =
      context.propsValue;

    const token = context.auth.access_token;

    const body: Record<string, unknown> = {};

    if (description) body['description'] = description;
    if (type_id !== null && type_id !== undefined) {
      body['type_id'] = type_id;
      if (move_to_period) body['period'] = move_to_period;
    }
    if (priority !== null && priority !== undefined) body['priority'] = priority;
    if (due_on) body['due_on'] = due_on;

    const response = await httpClient.sendRequest<Record<string, unknown>>({
      method: HttpMethod.PATCH,
      url: `https://api.weekdone.com/1/item/${item_id}?token=${token}`,
      body,
    });

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
