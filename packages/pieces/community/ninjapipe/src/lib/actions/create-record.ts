import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { RESOURCE_CONFIG, RESOURCE_OPTIONS } from '../common/constants';
import { ninjapipeApiRequest } from '../common/client';
import { buildPairObject, flattenCustomFields } from '../common/helpers';
import {
  getContactProps,
  getCompanyProps,
  getDealProps,
  getTaskProps,
  getProjectProps,
  getProductProps,
  getBudgetProps,
  getPipelineItemProps,
  getInvoiceProps,
  getOrderProps,
  getListProps,
  getPipelineProps,
  getGenericProps,
} from '../common/props-factory';

export const createRecord = createAction({
  auth: ninjapipeAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Create a new record in NinjaPipe',
  props: {
    resource: Property.StaticDropdown({
      displayName: 'Resource',
      required: true,
      options: { options: RESOURCE_OPTIONS },
    }),
    fields: Property.DynamicProperties({
      displayName: 'Fields',
      required: true,
      refreshers: ['resource'],
      props: async ({ auth, resource }) => {
        const typedAuth = auth as { base_url: string; api_key: string };
        if (resource === 'contact') return getContactProps();
        if (resource === 'company') return getCompanyProps();
        if (resource === 'deal') return getDealProps(typedAuth);
        if (resource === 'task') return getTaskProps(typedAuth);
        if (resource === 'project') return getProjectProps();
        if (resource === 'product') return getProductProps();
        if (resource === 'budget') return getBudgetProps();
        if (resource === 'pipelineItem') return getPipelineItemProps(typedAuth);
        if (resource === 'invoice') return getInvoiceProps(typedAuth);
        if (resource === 'order') return getOrderProps();
        if (resource === 'list') return getListProps();
        if (resource === 'pipeline') return getPipelineProps();
        return getGenericProps();
      },
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    additionalFields: Property.Array({
      displayName: 'Additional Fields',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    advancedBodyJson: Property.Json({
      displayName: 'Advanced Body (JSON)',
      description: 'Additional properties to merge into request body',
      required: false,
    }),
    flattenCustomFields: Property.Checkbox({
      displayName: 'Flatten Custom Fields',
      description: 'Flatten custom_fields object to top-level',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const resource = propsValue.resource as string;
    const config = RESOURCE_CONFIG[resource];

    if (!config) {
      throw new Error(`Unknown resource: ${resource}`);
    }

    let body: Record<string, unknown> = {};

    const fields = propsValue.fields as Record<string, unknown> | undefined;
    if (fields) {
      body = { ...fields };
    }

    const customFields = propsValue.customFields as Array<{ field: string; type: string; value: string }> | undefined;
    if (customFields && customFields.length > 0) {
      body.custom_fields = buildPairObject(customFields);
    }

    const additionalFields = propsValue.additionalFields as Array<{ field: string; type: string; value: string }> | undefined;
    if (additionalFields && additionalFields.length > 0) {
      body = { ...body, ...buildPairObject(additionalFields) };
    }

    const advancedBody = propsValue.advancedBodyJson as Record<string, unknown> | undefined;
    if (advancedBody) {
      body = { ...body, ...advancedBody };
    }

    const response = await ninjapipeApiRequest(auth as { base_url: string; api_key: string }, HttpMethod.POST, config.path, body);

    if (propsValue.flattenCustomFields) {
      return flattenCustomFields(response as Record<string, unknown>);
    }

    return response;
  },
});
