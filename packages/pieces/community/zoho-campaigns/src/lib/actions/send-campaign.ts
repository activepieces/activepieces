import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import { zohoCampaignsProps } from '../common/props';
import { zohoCampaignsSendCampaignOutputSchema } from '../output-schemas';

export const sendCampaignAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'sendCampaign',
  outputSchema: zohoCampaignsSendCampaignOutputSchema,
  classification: 'WRITE',
  displayName: 'Send Campaign',
  description: 'Send a campaign that has been created or cloned.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sends an existing draft campaign (identified by its campaign key) to its configured mailing list recipients. Use after a campaign has been created or cloned and is ready to go out. Not idempotent and has an irreversible side effect: it dispatches email to subscribers.',
    idempotent: false,
  },
  props: {
    campaignkey: zohoCampaignsProps.campaignKey({ required: true }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    return await zohoCampaignsApi.sendCampaign({
      auth,
      campaignkey: propsValue.campaignkey,
    });
  },
});

const schema = {
  campaignkey: z.string(),
};
