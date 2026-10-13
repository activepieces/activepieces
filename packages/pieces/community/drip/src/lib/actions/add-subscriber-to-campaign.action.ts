import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { dripCommon } from '../common';
import { dripApi } from '../common/client';
import { dripAuth } from '../auth';
import { dripOutputSchemas } from '../output-schemas';

export const dripAddSubscriberToCampaign = createAction({
  auth: dripAuth,
  name: 'add_subscriber_to_campaign',
  classification: 'WRITE',
  description: 'Add a subscriber to a campaign (Email series)',
  audience: 'human',
  aiMetadata: {
    description:
      "Subscribes a contact (by email) to a Drip Email Series Campaign picked from the account, optionally attaching tags and custom fields; this starts the sequence, and if the series has double opt-in on, Drip first emails a confirmation. Not idempotent: each call re-subscribes and can restart the series.",
    idempotent: false,
  },
  displayName: 'Add a subscriber to a campaign',
  props: {
    account_id: dripCommon.account_id,
    campaign_id: dripCommon.campaign_id({ required: true }),
    subscriber: dripCommon.subscriber,
    tags: dripCommon.tags,
    custom_fields: dripCommon.custom_fields,
  },
  outputSchema: dripOutputSchemas.legacySubscribersResponse,
  async run({ auth, propsValue }) {
    const campaignId = dripApi.seg({ value: propsValue.campaign_id, label: 'Email Series Campaign' });
    return await dripApi.send<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(propsValue.account_id)}/campaigns/${campaignId}/subscribers`,
      operation: 'add subscriber to email series',
      body: {
        subscribers: [
          {
            email: propsValue.subscriber,
            tags: propsValue.tags,
            custom_fields: propsValue.custom_fields,
          },
        ],
      },
    });
  },
});
