import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { listObjectsOutputSchema } from '../output-schemas';

export const listObjects = createAction({
  auth: ApitemplateAuth,
  name: 'listObjects',
  outputSchema: listObjectsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Objects',
  description:
    'Retrieves a list of generated PDFs and images with optional filtering',
  audience: 'both',
  aiMetadata: { description: 'Lists previously generated PDFs and images for the account, optionally narrowed by template ID, transaction reference, date range, or external reference (meta); with no filters it returns the full recent set. Supports limit/offset pagination (max 300 per call). Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'files',
      display: 'builder',
      label: 'File',
      icon: 'tag',
      props: ['templateId', 'transactionRef', 'meta'],
    },
    {
      key: 'dates',
      display: 'builder',
      label: 'Date',
      icon: 'calendar',
      props: ['dateFrom', 'dateTo'],
    },
    {
      key: 'paging',
      display: 'builder',
      label: 'Paging',
      icon: 'sliders',
      props: ['offset'],
    },
    {
      key: 'footer',
      display: 'footer',
      icon: 'sliders',
      props: ['limit'],
    },
  ],
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Only files from this template. The ID is in Manage Templates.',
      icon: 'file',
      placeholder: 'Template ID',
      required: false,
    }),
    transactionRef: Property.ShortText({
      displayName: 'Transaction Reference',
      description: 'Only this file. Create PDF and Create Image steps return it.',
      icon: 'tag',
      placeholder: 'Transaction reference',
      required: false,
    }),
    meta: Property.ShortText({
      displayName: 'Your Reference',
      description: 'Only files tagged with this reference.',
      icon: 'tag',
      placeholder: 'invoice-1042',
      required: false,
    }),
    dateFrom: Property.ShortText({
      displayName: 'From Date',
      description: 'Files created on or after this day (YYYY-MM-DD).',
      icon: 'calendar',
      placeholder: '2026-01-31',
      required: false,
    }),
    dateTo: Property.ShortText({
      displayName: 'To Date',
      description: 'Files created on or before this day (YYYY-MM-DD).',
      icon: 'calendar',
      placeholder: '2026-12-31',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Skip',
      description: 'Number of files to skip, for paging.',
      icon: 'sliders',
      required: false,
      defaultValue: 0,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Up to 300.',
      required: false,
      defaultValue: 300,
      display: 'stepper',
      min: 1,
      max: 300,
      step: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
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
