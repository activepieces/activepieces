import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzApi } from '../common/client';
import { ReviewflowzCampaign } from '../common/types';

export const createCampaignAction = createAction({
  auth: reviewflowzAuth,
  name: 'create_campaign',
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description: 'Creates a review-request campaign, ready to go: its message, timing and where it sends reviewers.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new Reviewflowz review-request campaign (email, text or WhatsApp) with its message, delay and review destinations, optionally turning it on. Use Update Campaign to change an existing one. Each call creates a new campaign, so retries duplicate.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name it after what puts customers in it, like "Jobs completed in ServiceTitan".',
      required: true,
    }),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      required: true,
      defaultValue: 'email',
      options: { options: reviewflowzCampaigns.CHANNEL_OPTIONS },
    }),
    send_delay_hours: Property.Number({
      displayName: 'Wait before sending (hours)',
      description: 'From the moment a customer is added. 0 sends right away.',
      required: false,
      defaultValue: 0,
    }),
    ...reviewflowzCampaigns.messageProps(),
    destinations: reviewflowzCampaigns.destinationsProp(),
    turn_on: Property.Checkbox({
      displayName: 'Turn it on',
      description: 'On to start sending now. Requests use credits.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const message = reviewflowzCampaigns.messageFrom(input);
    const destinations = reviewflowzCampaigns.destinationsFrom(input.destinations);
    const delay = reviewflowzCampaigns.delayMinutes(input.send_delay_hours);
    const created = await reviewflowzApi.call<ReviewflowzCampaign>({
      auth,
      method: HttpMethod.POST,
      path: '/campaigns',
      body: {
        name: input.name,
        channel: input.channel || 'email',
        ...(delay === undefined ? {} : { send_delay_minutes: delay }),
        ...(message ? { message } : {}),
        ...(destinations ? { destinations } : {}),
      },
    });
    const campaign = input.turn_on ? await reviewflowzCampaigns.activate({ auth, id: created.id }) : created;
    return reviewflowzCampaigns.campaignOutput(campaign);
  },
});
