import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { odooAuth } from '../../index';
import Odoo from '../../commom/index';

export const customOdooApiCall = createAction({
  name: 'custom_odoo_api_call',
  displayName: 'Custom API Call',
  description: 'Make a custom XML-RPC API call to Odoo',
  auth: odooAuth,
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description:
        'The Odoo model to interact with (e.g., res.partner, product.product)',
      required: true,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      description:
        'The method to call on the model (e.g., search_read, create, write)',
      options: {
        options: [
          { value: 'read', label: 'Read' },
          { value: 'search_read', label: 'Search read' },
          { value: 'search_count', label: 'Search count' },
          { value: 'search', label: 'Search' },
          { value: 'create', label: 'Create' },
          { value: 'write', label: 'Write' },
          { value: 'unlink', label: 'Unlink' },
          { value: 'fields_get', label: 'Fields get' },
        ],
      },
      required: true,
    }),
    method_params: Property.DynamicProperties({
      displayName: '',
      required: true,
      refreshers: ['method'],
      props: async ({ method }) => {
        if (!method) return {};

        type propsKey =
          | 'search'  
          | 'search_count'
          | 'search_read'
          | 'read'
          | 'create'
          | 'write'
          | 'unlink'
          | 'fields_get';

        const propsMap = {
          read: {
            record_ids: Property.Array({
              displayName: 'Record IDs',
              description: 'IDs of the record to read',
              required: true,
            }),
            fields: Property.Array({
              displayName: 'Fields',
              description:
                'Returns the requested fields of the records. When undefined, returns all fields.',
              required: false,
            }),
          },
          search: {
            domain: Property.Json({
              displayName: 'Domain',
              description:
                'A domain is a list of criteria, each criterion being a triple of (field_name, operator, value). See https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html#reference-orm-domains for details.',
              defaultValue: [['is_company', '=', true]],
              required: false,
            }),
            limit: Property.Number({
              displayName: 'Limit',
              description:
                'Maximum number of records to return',
              required: false,
            }),
            offset: Property.Number({
              displayName: 'Offset',
              description:
                'Number of records to skip',
              required: false,
            }),
          },
          search_read: {
            domain: Property.Json({
              displayName: 'Domain',
              description:
                'A domain is a list of criteria, each criterion being a triple of (field_name, operator, value). See https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html#reference-orm-domains for details.',
              defaultValue: [['is_company', '=', true]],
              required: false,
            }),
            fields: Property.Array({
              displayName: 'Fields',
              description:
                'Returns the requested fields of the records. When undefined, returns all fields.',
              required: false,
            }),
            limit: Property.Number({
              displayName: 'Limit',
              description:
                'Maximum number of records to return',
              required: false,
            }),
            offset: Property.Number({
              displayName: 'Offset',
              description:
                'Number of records to skip',
              required: false,
            }),
          },
          search_count: {
            domain: Property.Json({
              displayName: 'Domain',
              description:
                'A domain is a list of criteria, each criterion being a triple of (field_name, operator, value). See https://www.odoo.com/documentation/17.0/developer/reference/backend/orm.html#reference-orm-domains for details.',
              defaultValue: [['is_company', '=', true]],
              required: false,
            }),
          },
          create: {
            values: Property.Object({
              displayName: 'Values',
              description: 'Values to create',
              required: true,
            }),
          },
          write: {
            record_id: Property.Number({
              displayName: 'Record ID',
              description: 'ID of the record to update',
              required: true,
            }),
            values: Property.Object({
              displayName: 'Values',
              description: 'Values to update',
              required: true,
            }),
          },
          unlink: {
            record_id: Property.Number({
              displayName: 'Record ID',
              description: 'ID of the record to delete',
              required: true,
            }),
          },
          fields_get: {
            attributes: Property.Array({
              displayName: 'Attributes',
              description:
                'Can be used to inspect a model’s fields and check which ones seem to be of interest.',
              required: false,
              defaultValue: ['string', 'help', 'type'],
            }),
          },
        };

        const key = method as unknown as string;
        if (key in propsMap) {
          return propsMap[key as propsKey];
        }

        return {};
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { base_url, database, username, api_key } = auth;
    const { model, method, method_params } = propsValue;

    const odoo = new Odoo({
      url: base_url,
      port: 443,
      db: database,
      username: username,
      password: api_key,
    });

    try {
      // Connect to Odoo
      await odoo.connect();

      // Prepare parameters based on the method
      let params: any[] = [];

      // Otherwise, build params based on the method
      let tempParams: any[] = [];
      const tempKwParams: any = {};

      switch (method) {
        case 'search_read': {
          const { domain, fields, limit, offset } = method_params;

          tempParams = [domain || []];
          
          if (fields && fields.length > 0) tempKwParams.fields = fields;
          if (offset !== undefined) tempKwParams.offset = offset;
          if (limit !== undefined) tempKwParams.limit = limit;
          
          params = [tempParams, tempKwParams];
          break;
        }
        case 'read': {
          // For read, the structure is [[ids], fields]
          const { record_ids, fields } = method_params;

          const parsedIds = Array.isArray(record_ids)
            ? record_ids.map(id => parseInt(id, 10))
            : [];

          params = [parsedIds.length > 0 ? [parsedIds] : [], fields ? { fields } : {}];
          break;
        }
        case 'search': {
          // For search, the structure is [[domain], offset, limit]
          const { domain, limit, offset } = method_params;
          tempParams = [domain || []];

          if (offset !== undefined) tempKwParams.offset = offset;
          if (limit !== undefined) tempKwParams.limit = limit;

          params = [tempParams, tempKwParams];
          break;
        }
        case 'search_count': {
          const { domain } = method_params;
          tempParams = [domain || []];
          params = [tempParams];
          break;
        }
        case 'create': {
          // For create, the structure is [values]
          const { values } = method_params;

          tempParams = [values || {}];
          params = [tempParams];
          break;
        }
        case 'write': {
          // For write, the structure is [[ids], values]
          const { record_id, values } = method_params;

          params = [record_id !== undefined ? [[parseInt(record_id, 10)]] : [], values ? { values } : {}];
          break;
        }
        case 'unlink': {
          const { record_id } = method_params;
          
          params = [record_id !== undefined ? [[parseInt(record_id, 10)]] : []];
          break;
        }
      }

      const result = await odoo.execute_kw({
        model,
        method,
        params,
      });

      return result;
    } catch (error) {
      throw new Error(`Odoo API call failed: ${error}`);
    }
  },
});

export default customOdooApiCall;
