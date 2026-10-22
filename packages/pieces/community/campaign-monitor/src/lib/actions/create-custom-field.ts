import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { createCustomFieldOutputSchema } from '../output-schemas';

export const createCustomFieldAction = createAction({
  auth: campaignMonitorAuth,
  name: 'create_custom_field',
  classification: 'WRITE',
  displayName: 'Create Custom Field',
  description: 'Adds a custom field to a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a custom field on a Campaign Monitor list and returns its key (the field name in square brackets) for use when adding or updating subscribers. Data Type is Text, Number, Date, MultiSelectOne, MultiSelectMany, Country or USState; Options are required for the two multi-select types. Not idempotent: a second call with the same name fails because the field already exists.',
    idempotent: false,
  },
  outputSchema: createCustomFieldOutputSchema,
  props: {
    clientId: clientId,
    listId: listId,
    fieldName: Property.ShortText({
      displayName: 'Field Name',
      required: true,
    }),
    dataType: Property.StaticDropdown({
      displayName: 'Data Type',
      required: true,
      defaultValue: 'Text',
      options: {
        options: [
          { label: 'Text', value: 'Text' },
          { label: 'Number', value: 'Number' },
          { label: 'Date', value: 'Date' },
          { label: 'Select one option', value: 'MultiSelectOne' },
          { label: 'Select many options', value: 'MultiSelectMany' },
          { label: 'Country', value: 'Country' },
          { label: 'US State', value: 'USState' },
        ],
      },
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'Choices for the multi-select data types.',
      required: false,
    }),
    visibleInPreferenceCenter: Property.Checkbox({
      displayName: 'Visible in Preference Center',
      description: 'Let subscribers see and edit this field.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ propsValue, auth }) {
    const options = (propsValue.options ?? [])
      .map((option) => String(option).trim())
      .filter((option) => option.length > 0);
    const isOptionType = OPTION_TYPES.includes(propsValue.dataType);
    if (isOptionType && options.length === 0) {
      throw new Error('Options are required for multi-select data types.');
    }
    const response = await makeRequest<string>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.POST,
      path: `/lists/${propsValue.listId}/customfields.json`,
      body: {
        FieldName: propsValue.fieldName.trim(),
        DataType: propsValue.dataType,
        Options: isOptionType ? options : [],
        VisibleInPreferenceCenter: propsValue.visibleInPreferenceCenter ?? true,
      },
    });
    return {
      key: String(response.body),
      fieldName: propsValue.fieldName.trim(),
      dataType: propsValue.dataType,
      listId: propsValue.listId,
    };
  },
});

const OPTION_TYPES = ['MultiSelectOne', 'MultiSelectMany'];
