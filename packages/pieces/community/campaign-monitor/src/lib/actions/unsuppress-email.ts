import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { getApiErrorCode, makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { unsuppressEmailOutputSchema } from '../output-schemas';

export const unsuppressEmailAction = createAction({
  auth: campaignMonitorAuth,
  name: 'unsuppress_email',
  classification: 'WRITE',
  displayName: 'Remove Email from Suppression List',
  description: 'Lets a client send to a suppressed email address again.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes an email address from a Campaign Monitor client suppression list so campaigns from that client can reach it again. It does not resubscribe the contact to any list. Idempotent: removing an address that is not suppressed succeeds with no change and wasSuppressed false.',
    idempotent: true,
  },
  outputSchema: unsuppressEmailOutputSchema,
  props: {
    clientId: clientId,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Address to remove from the suppression list.',
      required: true,
    }),
  },
  async run({ propsValue, auth }) {
    const email = propsValue.email.trim();
    try {
      await makeRequest({
        auth: { apiKey: auth.secret_text },
        method: HttpMethod.PUT,
        path: `/clients/${
          propsValue.clientId
        }/unsuppress.json?email=${encodeURIComponent(email)}`,
      });
    } catch (error) {
      if (getApiErrorCode(error) !== NOT_SUPPRESSED_CODE) {
        throw error;
      }
      return {
        success: true,
        emailAddress: email,
        wasSuppressed: false,
      };
    }
    return {
      success: true,
      emailAddress: email,
      wasSuppressed: true,
    };
  },
});

const NOT_SUPPRESSED_CODE = 176;
