import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { MicrosoftPlannerAuth } from '../common/auth';

export const createPlan = createAction({
  auth:MicrosoftPlannerAuth,
  name: 'create_plan',
  displayName: 'Create Planner Plan',
  description: 'Creates a new plan in Microsoft 365 Planner under a specified container (Group or Roster).',

  props: {
    title: Property.ShortText({
      displayName: 'Plan Title',
      description: 'Title of the new plan to create.',
      required: true,
    }),
    containerType: Property.StaticDropdown({
      displayName: 'Container Type',
      description: 'Select the type of container where the plan will be created.',
      required: true,
      options: {
        options: [
          { label: 'Group', value: 'group' },
          { label: 'Roster', value: 'roster' },
        ],
      },
    }),
    containerId: Property.ShortText({
      displayName: 'Container ID',
      description:
        'The unique ID of the container (e.g. the Group ID or Roster ID). The user must be a member of the group if using a group container.',
      required: true,
    }),
  },

  async run(context) {

    const accessToken = (context.auth as { access_token: string }).access_token;

    const { title, containerType, containerId } = context.propsValue;

    const bodyPayload = {
      title,
      container: {
        containerId,
        type: containerType,
      },
    };

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/planner/plans',
      bodyPayload
    );

    return response;
  },
});
