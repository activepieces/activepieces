import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import * as z from 'zod/mini';
import { moduloActionOutputSchema } from '../output-schemas';

export const modulo = createAction({
  audience: 'both',
  name: 'modulo_math',
  classification: 'READ',
  outputSchema: moduloActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Modulo',
  description: 'Get the remainder after dividing the first number by the second.',
  aiMetadata: { description: 'Compute the remainder of first_number divided by second_number using JavaScript % semantics, so the sign of the result follows the dividend (-7 with divisor 3 yields -1, not 2). Pick this for divisibility or every-Nth checks and for cycling an index over a fixed range; use the sibling Division action when you want the quotient instead. Like Division, second_number is validated and must not be zero, or the step fails before computing; read-only and idempotent.', idempotent: true },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      description: 'The number to divide.',
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      description: 'The number to divide by. Cannot be zero.',
      required: true,
    }),
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      second_number: z.number().check(
        z.refine((val) => val !== 0, 'Second number cannot be zero'),
      ),
    });
    return (
      context.propsValue['first_number'] % context.propsValue['second_number']
    );
  },
});
