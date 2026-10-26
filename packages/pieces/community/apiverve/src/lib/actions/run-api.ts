import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { apiverveAuth } from '../auth';
import { ApiverveCatalogParam, apiverveCommon } from '../common';

function exampleText(example: unknown): string {
  if (example === undefined || example === null || example === '') {
    return '';
  }
  return ` Example: ${typeof example === 'string' ? example : JSON.stringify(example)}`;
}

function inputFor(param: ApiverveCatalogParam) {
  const displayName = apiverveCommon.labelFor(param.name);
  const description = `${param.description}${exampleText(param.example)}`;
  switch (param.type) {
    case 'boolean':
      return Property.StaticDropdown({
        displayName,
        description: param.description,
        required: param.required,
        options: {
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
          ],
        },
      });
    case 'array':
      return Property.Array({
        displayName,
        description,
        required: param.required,
      });
    case 'object':
      return Property.Json({
        displayName,
        description,
        required: param.required,
      });
    default:
      return Property.ShortText({
        displayName,
        description,
        required: param.required,
      });
  }
}

export const runApiAction = createAction({
  auth: apiverveAuth,
  name: 'run_api',
  classification: 'READ',
  displayName: 'Run an API',
  description:
    'Call any APIVerve API by picking it from the list. Its inputs appear once you choose it.',
  audience: 'both',
  aiMetadata: {
    description:
      "Call any one of the APIVerve APIs (lookups, validators, converters and generators) chosen by its id, with that API's own inputs. Prefer the dedicated actions for email, phone, IP, DNS, SSL and exchange-rate lookups. Calls are read-only and safe to retry, but each call uses account credits.",
    idempotent: true,
  },
  props: {
    api: Property.Dropdown({
      auth: apiverveAuth,
      displayName: 'API',
      description: 'The APIVerve API to call.',
      required: true,
      refreshers: [],
      options: async () => {
        const catalog = await apiverveCommon.getCatalog();
        const options = Object.entries(catalog.apis)
          .map(([id, api]) => ({ label: `${api.title} (${api.category})`, value: id }))
          .sort((a, b) => a.label.localeCompare(b.label));
        return { disabled: false, options };
      },
    }),
    inputs: Property.DynamicProperties({
      auth: apiverveAuth,
      displayName: 'Inputs',
      required: true,
      refreshers: ['api'],
      props: async ({ api }): Promise<DynamicPropsValue> => {
        if (typeof api !== 'string' || api.length === 0) {
          return {};
        }
        const selected = await apiverveCommon.getApi(api);
        return Object.fromEntries(
          selected.params.map((param) => [param.name, inputFor(param)])
        );
      },
    }),
  },
  async run(context) {
    return apiverveCommon.runCatalogApi({
      apiKey: context.auth.secret_text,
      apiId: context.propsValue.api,
      values: context.propsValue.inputs ?? {},
    });
  },
});
