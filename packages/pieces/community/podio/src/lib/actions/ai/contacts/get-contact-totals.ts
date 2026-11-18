import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetContactTotalsOutputSchema } from '../../../output-schemas';

export const getContactTotalsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_contact_totals',
  outputSchema: podioGetContactTotalsOutputSchema,
  displayName: 'Get Contact Totals',
  description: 'Counts the contacts of the current user, per organization and workspace.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Counts the Podio contacts of the connected user: the total of user contacts and the count per organization and per workspace.',
    idempotent: true,
  },
  props: {
    excludeSelf: podioAiProps.bool({ required: false, displayName: 'Exclude Self', description: '"true" leaves the connected user out of the counts. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: '/contact/totals/',
      query: podioUtils.query({ values: { exclude_self: podioUtils.toBool({ value: propsValue.excludeSelf }) } }),
    });
  },
});
