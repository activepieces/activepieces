import { createAction, Property } from '@activepieces/pieces-framework';
import { isEmpty } from '@activepieces/pieces-framework';

export const defaultValue = createAction({
  audience: 'both',
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
  displayName: 'Use Default Value if Input is Empty',
  description:
    'Checks your input and returns the default value, if the input is an empty text or list',
  aiMetadata: {
    description:
      'Returns the supplied value unless it is empty (empty text, empty list, null or undefined), in which case it returns the fallback default instead. Use it as a coalesce step to guarantee a non-empty value downstream rather than adding a branch. The default value is required while the input value is optional; deterministic and idempotent.',
    idempotent: true,
  },
  props: {
    value: Property.ShortText({
      displayName: 'Enter value',
      description: 'Enter value',
      required: false,
    }),
    defaultString: Property.ShortText({
      displayName: 'Default Value',
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
