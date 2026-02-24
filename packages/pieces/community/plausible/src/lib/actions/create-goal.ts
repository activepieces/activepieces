import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { plausibleAuth } from '../..';
import { plausibleApiCall, siteIdDropdown } from '../common';

export const createGoal = createAction({
  auth: plausibleAuth,
  name: 'create_goal',
  displayName: 'Create Goal',
  description: 'Find or create a goal for a site',
  props: {
    site_id: siteIdDropdown,
    goal_type: Property.StaticDropdown({
      displayName: 'Goal Type',
      description: 'Type of goal to create',
      required: true,
      options: {
        options: [
          { label: 'Event', value: 'event' },
          { label: 'Page', value: 'page' },
        ],
      },
    }),
    event_name: Property.ShortText({
      displayName: 'Event Name',
      description: 'Name of the event (required if goal type is Event)',
      required: false,
    }),
    page_path: Property.ShortText({
      displayName: 'Page Path',
      description: 'Page path to track (required if goal type is Page). Supports wildcards.',
      required: false,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'Custom display name for the goal in the dashboard',
      required: false,
    }),
  },
  async run(context) {
    const goal_type = context.propsValue['goal_type'];
    const event_name = context.propsValue['event_name'];
    const page_path = context.propsValue['page_path'];
    const display_name = context.propsValue['display_name'];

    const body: Record<string, unknown> = {
      site_id: context.propsValue['site_id'],
      goal_type,
    };

    if (goal_type === 'event' && event_name) {
      body['event_name'] = event_name;
    }

    if (goal_type === 'page' && page_path) {
      body['page_path'] = page_path;
    }

    if (display_name) {
      body['display_name'] = display_name;
    }

    const response = await plausibleApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      endpoint: '/sites/goals',
      body,
    });
    return response;
  },
});
