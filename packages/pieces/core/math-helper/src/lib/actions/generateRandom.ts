import {
  PieceAuth,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { generateRandomActionOutputSchema } from '../output-schemas';

export const generateRandom = createAction({
  audience: 'both',
  name: 'generateRandom_math',
  classification: 'READ',
  outputSchema: generateRandomActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Random Number',
  description: 'Pick a random whole number from a range, ends included.',
  aiMetadata: { description: 'Draw a pseudo-random integer uniformly from the inclusive range between first_number (the minimum) and second_number (the maximum). Pick this for sampling, jitter, or picking an arbitrary index; it is not cryptographically secure, so use the Crypto piece for tokens, secrets, or IDs, and the arithmetic siblings for deterministic math. It returns whole numbers only; decimal bounds are rounded inward and reversed bounds are swapped, so the result always lies inside the range, and the step fails when the range holds no whole number at all (1.2 to 1.8); not idempotent, since each call returns a different value for identical inputs.', idempotent: false },
  props: {
    first_number: Property.Number({
      displayName: 'Minimum',
      description: 'Lowest whole number that can be returned.',
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Maximum',
      description: 'Highest whole number that can be returned.',
      required: true,
    }),
  },
  async run(context) {
    const first = context.propsValue['first_number'];
    const second = context.propsValue['second_number'];
    const low = Math.ceil(Math.min(first, second));
    const high = Math.floor(Math.max(first, second));
    if (high < low) {
      throw new Error(
        'There is no whole number between the minimum and the maximum.',
      );
    }
    return Math.floor(Math.random() * (high - low + 1) + low);
  },
});
