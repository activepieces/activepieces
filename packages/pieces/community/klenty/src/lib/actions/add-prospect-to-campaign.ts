import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { klentyAuth } from '../auth';
import { klentyRequest } from '../common/client';
import { cadenceNameProp } from '../common/props';

export const addProspectToCampaignAction = createAction({
  name: 'add_prospect_to_campaign',
  displayName: 'Add Prospect to Campaign',
  description:
    'Add a prospect to a Klenty campaign/cadence using the startcadence endpoint.',
  audience: 'both',
  aiMetadata: {
    description:
      'Enrolls a prospect (by email) into a named Klenty cadence/campaign, starting the outreach sequence for them. Use to kick off automated emails to an existing prospect; the prospect should already exist in Klenty and the cadence name must match one configured in the account. Not idempotent: it triggers cadence enrollment as an outbound side effect on each call.',
    idempotent: false,
  },
  auth: klentyAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Prospect Email',
      required: true,
    }),
    cadenceName: cadenceNameProp,
  },
  async run({ auth, propsValue }) {
    const response = await klentyRequest({
      auth,
      method: HttpMethod.POST,
      path: '/startcadence',
      body: {
        Email: propsValue.email,
        cadenceName: propsValue.cadenceName,
      },
    });

    return response;
  },
});
