import { createAction, Property } from '@activepieces/pieces-framework';
import { isEmpty } from '@activepieces/shared';

export const defaultValue = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'defaultValue',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  displayName: 'Default Value',
  description:
    'Returns the input string or a default string if the input is null.',
  props: {
    value: Property.ShortText({
      displayName: 'Enter value',
      description: 'Enter value',
      required: false,
    }),
    defaultString: Property.ShortText({
      displayName: 'Enter default value',
      description: 'Enter default value',
      required: true,
    }),
  },
  async run(context) {
    // Action logic here
    const { value, defaultString } = context.propsValue;
    if (isEmpty(value)) {
      return defaultString;
    }
    return value;
  },
});
