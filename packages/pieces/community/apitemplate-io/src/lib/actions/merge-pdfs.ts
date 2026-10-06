import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { apitemplateIoMergePdfsOutputSchema } from '../output-schemas';

export const mergePdfs = createAction({
  auth: ApitemplateAuth,
  name: 'apitemplate_io_merge_pdfs',
  outputSchema: apitemplateIoMergePdfsOutputSchema,
  classification: 'WRITE',
  displayName: 'Merge PDFs',
  description: 'Merges multiple PDFs into a single PDF file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Joins an ordered list of PDF URLs (normal http/https URLs or base64 data: URIs) into a single PDF, in the order given. Use after generating individual PDFs to combine them into one document. Requires at least one URL. Not idempotent: each call generates and stores a new merged PDF.',
    idempotent: false,
  },
  props: {
    urls: Property.Array({
      displayName: 'PDF URLs',
      description: 'URLs of the PDFs to merge, in order. Supports http/https URLs and data: URIs.',
      required: true,
    }),
    expiration: Property.Number({
      displayName: 'Expiration (minutes)',
      description:
        'Expiration of the generated PDF in minutes. Use 0 to store permanently, or 1-43200 minutes (30 days) to specify expiration.',
      required: false,
      defaultValue: 0,
    }),
    meta: Property.ShortText({
      displayName: 'External Reference ID',
      description: 'Specify an external reference ID for your own reference. It appears in the list-objects response.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { urls, expiration, meta } = propsValue;

    const queryParams = new URLSearchParams();

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/merge-pdfs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const requestBody: Record<string, unknown> = {
      urls: urls as string[],
    };

    if (expiration !== undefined && expiration !== 0) {
      requestBody['expiration'] = expiration;
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.POST,
        endpoint,
        requestBody,
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
