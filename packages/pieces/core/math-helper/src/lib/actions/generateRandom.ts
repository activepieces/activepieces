import {
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { generateRandomActionOutputSchema } from '../output-schemas';

export const generateRandom = createAction({
  audience: 'both',
  name: 'generateRandom_math',
  outputSchema: generateRandomActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Generate Random Number',
  description: 'Generate random number between two numbers (inclusive)',
  aiMetadata: { description: 'Draw a pseudo-random integer uniformly from the inclusive range between first_number (the minimum) and second_number (the maximum). Pick this for sampling, jitter, or picking an arbitrary index; it is not cryptographically secure, so use the Crypto piece for tokens, secrets, or IDs, and the arithmetic siblings for deterministic math. It returns whole numbers only, and the range is honoured only when second_number is at least first_number; not idempotent, since each call returns a different value for identical inputs.', idempotent: false },
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      description: undefined,
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      description: undefined,
      required: true,
    }),
  },
  async run(context) {
    const min = context.propsValue['first_number'];
    const max = context.propsValue['second_number'];
    return Math.floor(Math.random() * (max - min + 1) + min);
  },
});
