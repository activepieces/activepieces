import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient } from '../common';

export const getCampaigns = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_campaigns',
  displayName: 'Find Campaign',
  description: 'Finds a campaign by name, status or tags.',
  props: {
    name: Property.ShortText({
      displayName: 'Campaign name',
      description: 'Find a campaign by searching using its name.',
      required: false,
      defaultValue: '',

    }),
    tags: Property.LongText({
      displayName: 'Campaign tags',
      description: 'Find a campaign by searching using its tags. To search using multiple tags, separate the tags with a comma.',
      required: false,
      defaultValue: '',
    }),
    status: Property.StaticDropdown({
      displayName: 'Campaign status',
      description: '',
      required: false,
      options: {
        options: [
          {
            label: 'Sent',
            value: 'COMPLETED'
          },
          {
            label: 'Ready to send',
            value: 'READY_TO_SEND'
          },
          {
            label: 'Draft',
            value: 'NOT_SCHEDULED'
          },
          {
            label: 'Scheduled',
            value: 'PENDING'
          },
          {
            label: 'Paused',
            value: 'Paused'
          },
          {
            label: 'Stopped',
            value: 'STOPPED'
          },
          {
            label: 'Pending multivariate winner',
            value: 'SENDING_PENDING_AB_WINNER'
          },
        ],
      },
    }),
  },
  async run(context) {
    const { name, tags, status } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listCampaignsAdv(name, tags, status);
  },
});
