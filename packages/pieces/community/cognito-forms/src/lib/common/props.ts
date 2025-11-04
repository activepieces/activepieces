import {
  Property,
  DropdownOption,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import { makeRequest } from './index';
import { HttpMethod } from '@activepieces/pieces-common';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Form',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your Cognito Forms account',
        options: [],
      };
    }

    const apiKey = auth as string;
    const forms = await makeRequest(apiKey, HttpMethod.GET, '/forms');

    const options: DropdownOption<string>[] = forms.map((form: any) => ({
      label: form.Name,
      value: form.Id,
    }));

    return {
      disabled: false,
      options,
    };
  },
});

export const formFields = Property.DynamicProperties({
  displayName: 'Fields',
  refreshers: ['formId'],
  required: true,
  props: async ({ auth, formId }) => {
    if (!auth || !formId) return {};

    const apiKey = auth as unknown as string;
    const response = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/forms/${formId}/schema`
    );

    const fields = response as FormSchemaResponse;

    const props: DynamicPropsValue = {};

    for (const [key, value] of Object.entries(fields.properties)) {
      const fieldType = value.type;
      const fieldName = key;
      const fieldDes = value.description;
      const isReadOnly = value.readOnly;

      if (isReadOnly) continue;

      switch (fieldType) {
        case 'string':
          props[fieldName] = Property.ShortText({
            displayName: fieldName,
            description: fieldDes ?? '',
            required: false,
          });
          break;
        case 'boolean':
          props[fieldName] = Property.Checkbox({
            displayName: fieldName,
            description: fieldDes ?? '',

            required: false,
          });
          break;
        case 'number':
          props[fieldName] = Property.Number({
            displayName: fieldName,
            description: fieldDes ?? '',

            required: false,
          });
          break;
        default:
          break;
      }
    }
    return props;
  },
});

type FormSchemaResponse = {
  type: string;
  properties: {
    [x: string]: {
      type: string;
      readOnly: boolean;
      description: string;
    };
  };
};
