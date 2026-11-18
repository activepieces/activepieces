import { createAction, Property } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from '../common/auth';
import { ApitemplateRegion, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { apitemplateIoListTemplatesOutputSchema } from '../output-schemas';

export const listTemplates = createAction({
  auth: ApitemplateAuth,
  name: 'apitemplate_io_list_templates',
  outputSchema: apitemplateIoListTemplatesOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Templates',
  description: 'Retrieves a list of the account templates and their information.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the PDF and image templates saved in the account, optionally narrowed by format, template ID, or group name. Use to discover a template ID before calling create-pdf/create-image, get-template, or update-template. Supports limit/offset pagination (default 300 per call). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of templates to return (default: 300).',
      required: false,
      defaultValue: 300,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of templates to skip for pagination (default: 0).',
      required: false,
      defaultValue: 0,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Filter templates by format.',
      required: false,
      options: {
        options: [
          { label: 'PDF', value: 'PDF' },
          { label: 'JPEG', value: 'JPEG' },
        ],
      },
    }),
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'Filter templates by template ID.',
      required: false,
    }),
    groupName: Property.ShortText({
      displayName: 'Group Name',
      description: 'Filter templates by group name.',
      required: false,
    }),
    withLayerInfo: Property.Checkbox({
      displayName: 'With Layer Info',
      description: 'Return layer information for image templates.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authConfig = auth.props;
    const { limit, offset, format, templateId, groupName, withLayerInfo } = propsValue;

    const queryParams = new URLSearchParams();

    if (limit !== undefined && limit !== 300) {
      queryParams.append('limit', limit.toString());
    }

    if (offset !== undefined && offset !== 0) {
      queryParams.append('offset', offset.toString());
    }

    if (format) {
      queryParams.append('format', format);
    }

    if (templateId) {
      queryParams.append('template_id', templateId);
    }

    if (groupName) {
      queryParams.append('group_name', groupName);
    }

    if (withLayerInfo) {
      queryParams.append('with_layer_info', '1');
    }

    const endpoint = `/list-templates${
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
