import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { cloudinaryGetUsageOutputSchema } from '../../output-schemas';

export const cloudinaryGetUsage = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_usage',
  outputSchema: cloudinaryGetUsageOutputSchema,
  displayName: 'Get Usage',
  description: 'Gets account usage and plan limits: storage, bandwidth, transformations, requests and credits.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the plan name and usage against limits for storage, bandwidth, transformations, objects, requests and credits, for today or a given date within the last 3 months. Use to check remaining quota before heavy uploads or transformations.',
    idempotent: true,
  },
  props: {
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Day to report, as YYYY-MM-DD, within the last 3 months. Leave empty for the latest figures.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.GET, '/usage', undefined, { date: propsValue.date?.trim() });
  },
});
