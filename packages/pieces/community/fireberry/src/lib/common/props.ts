import { Property } from '@activepieces/pieces-framework';
import { FireberryClient } from './client';

export const objectTypeDropdown = Property.Dropdown({
  displayName: 'Object Type',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Fireberry account',
      };
    }
    const client = new FireberryClient(auth as string);
    const metadata = await client.getObjectsMetadata();
    const options = metadata.objects.map(obj => ({
      label: obj.label,
      value: obj.name,
    }));
    return {
      disabled: false,
      options,
    };
  },
});

export const objectFields = Property.DynamicProperties({
  displayName: 'Fields',
  refreshers: ['objectType'],
  required: true,
  props: async ({ auth, objectType }) => {
    if (!auth || !objectType) return {};
    const client = new FireberryClient(auth as string);
    const metadata = await client.getObjectFieldsMetadata(objectType);
    const props: Record<string, any> = {};
    for (const field of metadata.fields) {
      switch (field.type) {
        case 'string':
        case 'text':
        case 'email':
        case 'url':
          props[field.name] = Property.ShortText({
            displayName: field.label,
            required: field.required,
          });
          break;
        case 'number':
          props[field.name] = Property.Number({
            displayName: field.label,
            required: field.required,
          });
          break;
        case 'boolean':
          props[field.name] = Property.Checkbox({
            displayName: field.label,
            required: field.required,
          });
          break;
        case 'date':
        case 'datetime':
          props[field.name] = Property.DateTime({
            displayName: field.label,
            required: field.required,
          });
          break;
        default:
          props[field.name] = Property.ShortText({
            displayName: field.label,
            required: field.required,
          });
      }
    }
    return props;
  },
}); 