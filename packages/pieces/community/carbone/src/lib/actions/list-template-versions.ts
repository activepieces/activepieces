import { carboneAuth } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  CarboneListResponse,
  CarboneTemplate,
  carboneClient,
  carboneOutputFields,
} from '../common/client';
import { carboneProps } from '../common/props';

export const listTemplateVersionsAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_template_versions',
  classification: 'SEARCH',
  displayName: 'List Template Versions',
  description: 'List every version of one Carbone template.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists all versions of one Carbone template (each with its version ID, deployedAt and createdAt) for a template ID (a version ID or legacy template ID returns just that version), with cursor pagination via nextCursor/hasMore. Use to pick a specific version ID to render, update or delete. An unknown template ID returns an empty list. Idempotent: read-only lookup.',
    idempotent: true,
  },
  outputSchema: {
    fields: [
      { key: 'versions', label: 'Versions', labelKey: 'versionId', listItems: carboneOutputFields.template },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextCursor', label: 'Next Cursor' },
    ],
  },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID',
      description: 'Select a template, or map a template ID.',
    }),
    limit: Property.Number({
      displayName: 'Limit (optional)',
      required: false,
      description: 'Maximum number of versions per page, 1 to 100. Default is 100.',
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor (optional)',
      required: false,
      description: 'The Next Cursor from a previous call, to fetch the next page.',
    }),
  },
  async run(context) {
    const { limit, cursor } = context.propsValue;
    const templateId = carboneClient.readId({ value: context.propsValue.templateId, label: 'Template ID' });
    const queryParams: Record<string, string> = /^\d+$/.test(templateId)
      ? { id: templateId, includeVersions: 'true' }
      : { versionId: templateId };
    if (limit !== undefined && limit !== null) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error('Limit must be a whole number from 1 to 100.');
      }
      queryParams['limit'] = String(limit);
    }
    if (cursor && cursor.trim().length > 0) queryParams['cursor'] = cursor.trim();
    const response = await carboneClient.request<CarboneListResponse<CarboneTemplate>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates',
      operation: 'list template versions',
      queryParams,
    });
    const versions = response.body.data ?? [];
    return {
      versions,
      count: versions.length,
      hasMore: response.body.hasMore === true,
      nextCursor: response.body.nextCursor ?? null,
    };
  },
});
