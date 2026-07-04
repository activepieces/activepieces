import { createAction } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { transactionRefDropdown } from '../common/props';

export const deleteObject = createAction({
  auth: ApitemplateAuth,
  name: 'deleteObject',
  displayName: 'Delete Object',
  description: 'Deletes a generated PDF or image by its transaction reference or object ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a previously generated PDF or image, identified by its transaction reference (pick from the dropdown of recent objects). Use to clean up stored output. Idempotent in effect: once the object is gone, repeating the call leaves the same deleted state.', idempotent: true },
  props: {
    transactionRef: transactionRefDropdown,
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { transactionRef } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();
    queryParams.append('transaction_ref', transactionRef);

    const endpoint = `/delete-object?${queryParams.toString()}`;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        endpoint,
        undefined,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      return response;
    } catch (error: any) {
      
      if (error.message.includes('502') && authConfig.region !== 'default') {
        throw new Error(
          `${error.message}\n\nThe ${authConfig.region} region appears to be experiencing issues. ` +
          `Consider switching to the 'default' region in your authentication settings or try again later.`
        );
      }
      throw error;
    }
  },
});