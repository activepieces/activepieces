import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateAuthConfig, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const listObjects = createAction({
  auth: ApitemplateAuth,
  name: 'listObjects',
  displayName: 'List Objects',
  description:
    'Retrieves a list of generated PDFs and images with optional filtering',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of objects to return (default: 300, max: 300)',
      required: false,
      defaultValue: 300,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of objects to skip for pagination (default: 0)',
      required: false,
      defaultValue: 0,
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Filter objects by template ID (optional)',
      required: false,
    }),
    transactionRef: Property.ShortText({
      displayName: 'Transaction Reference',
      description: 'Filter by specific transaction reference (optional)',
      required: false,
    }),
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'Start date for filtering (YYYY-MM-DD format, optional)',
      required: false,
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'End date for filtering (YYYY-MM-DD format, optional)',
      required: false,
    }),
    meta: Property.ShortText({
      displayName: 'Meta Filter',
      description: 'Filter by external reference ID (meta field)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth as ApitemplateAuthConfig;
    const {
      limit,
      offset,
      templateId,
      transactionRef,
      dateFrom,
      dateTo,
      meta,
    } = propsValue;

    // Build query parameters according to API docs
    const queryParams = new URLSearchParams();

    if (limit !== undefined && limit !== 300) {
      queryParams.append('limit', Math.min(limit, 300).toString());
    }

    if (offset !== undefined && offset !== 0) {
      queryParams.append('offset', offset.toString());
    }

    if (templateId) {
      queryParams.append('template_id', templateId);
    }

    if (transactionRef) {
      queryParams.append('transaction_ref', transactionRef);
    }

    if (dateFrom) {
      queryParams.append('date_from', dateFrom);
    }

    if (dateTo) {
      queryParams.append('date_to', dateTo);
    }

    if (meta) {
      queryParams.append('meta', meta);
    }

    const endpoint = `/list-objects${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        endpoint,
        undefined,
        undefined,
        authConfig.region
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
