import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteOrgPaymentAction = createAction({
  name: 'delete_org_payment',
  displayName: 'Delete Organization Payment Info',
  description: 'Delete payment information for your organization',
  audience: 'both',
  aiMetadata: { description: 'Remove the organization\'s stored payment information. Use to clear the org\'s billing method; destructive and takes no inputs. Not strictly idempotent: a first call deletes the record and a repeat may error if none remains.', idempotent: false },
  auth: zooAuth,
  // category: 'Payments',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: 'https://api.zoo.dev/org/payment',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
