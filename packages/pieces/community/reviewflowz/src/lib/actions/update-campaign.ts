import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzCampaigns } from '../common/campaigns';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';
import { ReviewflowzCampaign } from '../common/types';

export const updateCampaignAction = createAction({
  auth: reviewflowzAuth,
  name: 'update_campaign',
  classification: 'WRITE',
  displayName: 'Update Campaign',
  description: "Changes a campaign's name, message, timing or where it sends reviewers.",
  audience: 'both',
  aiMetadata: {
    description:
      'Change an existing Reviewflowz campaign: its name, message, send delay or review destinations. A campaign that is on keeps sending while it changes (unless told to stop instead). Setting the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    campaign: reviewflowzProps.campaign(),
    name: Property.ShortText({ displayName: 'New name', required: false }),
    send_delay_hours: Property.Number({ displayName: 'Wait before sending (hours)', required: false }),
    ...reviewflowzCampaigns.messageProps(),
    destinations: reviewflowzCampaigns.destinationsProp(),
    when_on: Property.StaticDropdown({
      displayName: 'If the campaign is on',
      description: 'A campaign that is on keeps sending while it changes: no one waiting for a request loses their place.',
      required: false,
      defaultValue: 'pause_and_resume',
      options: {
        options: [
          { label: 'Change it while it stays on', value: 'pause_and_resume' },
          { label: 'Stop the flow with an error', value: 'error' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const message = reviewflowzCampaigns.messageFrom(input);
    const destinations = reviewflowzCampaigns.destinationsFrom(input.destinations);
    const delay = reviewflowzCampaigns.delayMinutes(input.send_delay_hours);
    const body = {
      ...(input.name ? { name: input.name } : {}),
      ...(delay === undefined ? {} : { send_delay_minutes: delay }),
      ...(message ? { message } : {}),
      ...(destinations ? { destinations } : {}),
    };

    const updated = await reviewflowzApi.call<ReviewflowzCampaign>({
      auth,
      method: HttpMethod.PATCH,
      path: `/campaigns/${encodeURIComponent(String(input.campaign))}`,
      body: input.when_on === 'error' ? body : { ...body, while_on: 'pause_and_resume' },
    });
    return reviewflowzCampaigns.campaignOutput(updated);
  },
});
