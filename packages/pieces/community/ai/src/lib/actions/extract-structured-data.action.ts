import { createAction, Property } from '@activepieces/pieces-framework';

export const extractStructuredDataAction = createAction({
  name: 'extract-structured-data',
  displayName: 'Extract Structured Data',
  description: 'Extract Structured Data',
  props: {
    text: Property.LongText({
      displayName: 'Unstructured Text',
      required: true,
    }),
    params: Property.Array({
      displayName: 'Data Definition',
      required: true,
      properties: {
        propName: Property.ShortText({
          displayName: 'Name',
          description:
            'Provide the name of the value you want to extract from the unstructured text. The name should be unique and short. ',
          required: true,
        }),
        propDescription: Property.LongText({
          displayName: 'Description',
          description:
            'Brief description of the data, this hints for the AI on what to look for',
          required: false,
        }),
        propDataType: Property.StaticDropdown({
          displayName: 'Data Type',
          description: 'Type of parameter.',
          required: true,
          defaultValue: 'string',
          options: {
            disabled: false,
            options: [
              { label: 'Text', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
            ],
          },
        }),
        propIsRequired: Property.Checkbox({
          displayName: 'Fail if Not present?',
          required: true,
          defaultValue: false,
        }),
      },
    }),
  },
  async run(context) {},
});
