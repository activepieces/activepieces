import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { pushoverApiCall } from '../common';
import { cancelEmergencyRetriesByTagOutputSchema } from '../output-schemas';

export const cancelEmergencyRetriesByTag = createAction({
  auth: pushoverAuth,
  name: 'cancel_emergency_retries_by_tag',
  classification: 'WRITE',
  displayName: 'Cancel Emergency Retries by Tag',
  description: 'Stop the retry loops of every emergency notification carrying a tag',
  audience: 'ai',
  aiMetadata: {
    description:
      'Stop the retries of every still-active emergency (priority 2) notification sent with this tag. The tag must have been supplied in the Tags parameter of Send Push Message at send time; tags cannot be attached afterwards. Use Cancel Emergency Retries when you hold a single receipt instead. Safe to retry: it is a no-op once nothing with the tag is retrying.',
    idempotent: true,
  },
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description:
        'A single tag that was supplied in the Tags parameter at send time, for example deploy.',
      required: true,
    }),
  },
  outputSchema: cancelEmergencyRetriesByTagOutputSchema,
  async run({ auth, propsValue }) {
    return await pushoverApiCall({
      method: HttpMethod.POST,
      resourceUri: `/receipts/cancel_by_tag/${propsValue.tag}.json`,
      body: { token: auth.props.api_token },
    });
  },
});
