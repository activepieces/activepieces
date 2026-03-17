
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createUsageReport = createAction({
  auth: cloudinaryAuth,
  name: 'createUsageReport',
  displayName: 'Create Usage Report',
  description: 'Generate a comprehensive report of account usage and quotas including storage, bandwidth, transformations, requests, and add-on usage.',
  props: {
    date: Property.DateTime({
      displayName: 'Report Date',
      description: 'Date for the usage report. Must be within the last 3 months. Leave empty for current date.',
      required: false,
    }),
    include_breakdown: Property.Checkbox({
      displayName: 'Include Detailed Breakdown',
      description: 'Whether to include detailed breakdown of transformation types and add-on usage in the response.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { date, include_breakdown } = propsValue;

    if (date) {
      const inputDate = new Date(date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      if (inputDate < threeMonthsAgo) {
        throw new Error('Date must be within the last 3 months');
      }
      
      if (inputDate > new Date()) {
        throw new Error('Date cannot be in the future');
      }
    }

    const queryParams: Record<string, string> = {};
    if (date) {
      const inputDate = new Date(date);
      const dateString = inputDate.toISOString().split('T')[0];
      queryParams['date'] = dateString;
    }

    const path = `/usage`;
    const response = await makeRequest(auth, HttpMethod.GET, path, undefined, queryParams);

    if (!include_breakdown && response) {
      const simplified = {
        plan: response.plan,
        last_updated: response.last_updated,
        date_requested: response.date_requested,
        summary: {
          transformations: {
            usage: response.transformations?.usage,
            limit: response.transformations?.limit,
            used_percent: response.transformations?.used_percent,
          },
          bandwidth: {
            usage: response.bandwidth?.usage,
            limit: response.bandwidth?.limit,
            used_percent: response.bandwidth?.used_percent,
            usage_gb: response.bandwidth?.usage ? Math.round(response.bandwidth.usage / (1024 * 1024 * 1024) * 100) / 100 : null,
          },
          storage: {
            usage: response.storage?.usage,
            limit: response.storage?.limit,
            used_percent: response.storage?.used_percent,
            usage_gb: response.storage?.usage ? Math.round(response.storage.usage / (1024 * 1024 * 1024) * 100) / 100 : null,
          },
          requests: response.requests,
          resources: response.resources,
          derived_resources: response.derived_resources,
        },
        media_limits: response.media_limits,
      };
      
      return simplified;
    }

    if (response) {
      if (response.bandwidth?.usage) {
        response.bandwidth.usage_gb = Math.round(response.bandwidth.usage / (1024 * 1024 * 1024) * 100) / 100;
      }
      if (response.storage?.usage) {
        response.storage.usage_gb = Math.round(response.storage.usage / (1024 * 1024 * 1024) * 100) / 100;
      }
    }

    return response;
  },
});
