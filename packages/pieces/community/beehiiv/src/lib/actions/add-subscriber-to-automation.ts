import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BEEHIIV_API_URL, beehiivAuth, publicationIdProperty } from '../common';

export const addSubscriberToAutomation = createAction({
  name: 'add_subscriber_to_automation',
  displayName: 'Add Subscriber to Automation',
  description: 'Trigger an email sequence or funnel for a subscriber',
  auth: beehiivAuth,
  props: {
    publication_id: publicationIdProperty,
    automation_id: Property.Dropdown({
      displayName: 'Automation',
      description: 'The automation to add the subscriber to',
      required: true,
      refreshers: ['publication_id'],
      options: async ({ auth, publication_id }) => {
        if (!auth || !publication_id) {
          return {
            disabled: true,
            placeholder: 'Please select a publication first',
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest<{
            data: {
              id: string;
              name: string;
              status: string;
              trigger_events: string[];
              description: string;
            }[];
          }>({
            method: HttpMethod.GET,
            url: `${BEEHIIV_API_URL}/publications/${publication_id}/automations`,
            headers: {
              Authorization: `Bearer ${auth}`,
            },
          });

          // Filter automations that have the 'api' trigger event
          const apiAutomations = response.body.data.filter(automation => 
            automation.trigger_events.includes('api')
          );

          return {
            options: apiAutomations.map((automation) => {
              return {
                label: automation.name,
                value: automation.id,
              };
            }),
          };
        } catch (error) {
          console.error('Error fetching automations:', error);
          return {
            disabled: true,
            placeholder: 'Error fetching automations',
            options: [],
          };
        }
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the subscriber',
      required: false,
    }),
    subscription_id: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The ID of the subscription',
      required: false,
    }),
    double_opt_override: Property.StaticDropdown({
      displayName: 'Double Opt Override',
      description: 'Override publication double-opt settings for this subscription',
      required: false,
      options: {
        options: [
          { label: 'Require Double Opt-In', value: 'require' },
          { label: 'Skip Double Opt-In', value: 'skip' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const {
      publication_id,
      automation_id,
      email,
      subscription_id,
      double_opt_override,
    } = propsValue;

    if (!email && !subscription_id) {
      throw new Error('Either email or subscription_id must be provided');
    }

    const payload: Record<string, any> = {};

    if (email) payload.email = email;
    if (subscription_id) payload.subscription_id = subscription_id;
    if (double_opt_override) payload.double_opt_override = double_opt_override;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BEEHIIV_API_URL}/publications/${publication_id}/automations/${automation_id}/journeys`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
