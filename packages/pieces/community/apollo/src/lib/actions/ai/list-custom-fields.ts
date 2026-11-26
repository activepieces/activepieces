import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListCustomFieldsAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_custom_fields',
  classification: 'SEARCH',
  displayName: 'List Custom Fields',
  description: 'List the custom fields defined in Apollo.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the custom fields defined in your Apollo workspace (ID, label, record type, field type), optionally for one record type, for the typed_custom_fields input of the create and update tools. Uses no credits.',
    idempotent: true,
  },
  props: {
    modality: aiProps.choice({
      displayName: 'Record Type',
      description: 'Only fields of this record type (default: all).',
      required: false,
      options: [
        { label: 'Contact', value: 'contact' },
        { label: 'Account', value: 'account' },
        { label: 'Deal', value: 'opportunity' },
      ],
    }),
  },
  outputSchema: apolloOutputSchemas.customFields,
  async run({ propsValue, auth }) {
    const modality = apolloInputs.optionalText(propsValue.modality);
    const body = await apolloRequests.listCustomFields({ apiKey: apiKeyOf(auth) });
    return { fields: recordsOf(body['fields']).filter((field) => modality === undefined || field['modality'] === modality).map((field) => apolloMappers.field(field)) };
  },
});
