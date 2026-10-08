import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

export const removeFromCampaignAction = createAction({
  auth: dripAuth,
  name: 'remove_from_campaign',
  displayName: 'Remove Subscriber From Email Series',
  description: 'Removes a subscriber from one Email Series Campaign, or from all of them when no campaign ID is given.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a subscriber (by email or ID) from one Drip Email Series Campaign, or from every email series when Campaign ID is empty, so they stop receiving those sequences; they stay subscribed to other mailings. Returns the subscriber. Repeating it changes nothing more, so it is idempotent.',
    idempotent: true,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
    campaignId: Property.ShortText({
      displayName: 'Campaign ID',
      description: 'Email Series Campaign ID (from List Email Series). Leave empty to remove the subscriber from all email series.',
      required: false,
    }),
  },
  outputSchema: dripOutputSchemas.subscriber,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const segment = dripApi.seg({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const campaignText = dripApi.optionalText(propsValue.campaignId);
    const campaignId = campaignText === undefined ? undefined : dripApi.parseNumericId({ value: campaignText, label: 'Campaign ID' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    const body = await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/subscribers/${segment}/remove`,
      operation: 'remove subscriber from email series',
      query: { campaign_id: campaignId },
    });
    return dripApi.firstRecord({ body, key: 'subscribers', operation: 'remove subscriber from email series' });
  },
});
