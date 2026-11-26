import { createAction, Property } from '@activepieces/pieces-framework';
import { isEmpty } from '@activepieces/pieces-framework';

export const defaultValue = createAction({
  audience: 'both',
  name: 'defaultValue',
  classification: 'READ',
  displayName: 'Use Default Value if Input is Empty',
  description:
    'Return a fallback when the input is empty text, list or object.',
  aiMetadata: {
    description:
      'Returns the supplied value unless it is empty (empty text, empty list, null or undefined), in which case it returns the fallback default instead. Use it as a coalesce step to guarantee a non-empty value downstream rather than adding a branch. The default value is required while the input value is optional; deterministic and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'values',
      display: 'section',
      label: 'Values',
      icon: 'type',
      props: ['value', 'defaultString'],
    },
  ],
  props: {
    value: Property.ShortText({
      displayName: 'Value',
      description: 'Returned as is when it is not empty.',
      required: false,
      width: 'half',
    }),
    defaultString: Property.ShortText({
      displayName: 'Default Value',
      description: 'Returned when Value is empty.',
      required: true,
      width: 'half',
    }),
  },
  async run(context) {
    const { value, defaultString } = context.propsValue;
    if (isEmpty(value)) {
      return defaultString;
    }
    return value;
  },
});
