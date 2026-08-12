import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { subtractionActionOutputSchema } from '../output-schemas';

export const subtraction = createAction({
  audience: 'both',
  name: 'subtraction_math',
  outputSchema: subtractionActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Subtraction',
  description: 'Subtract the first number from the second number',
  aiMetadata: { description: 'Compute the difference of two numbers. Critical: the operand order is the reverse of what the prop names suggest, because it returns second_number - first_number; put the amount being subtracted in first_number and the value it is subtracted from in second_number. Pick this for a two-operand subtraction only, using the sibling Addition, Multiplication, Division, or Modulo actions for other operations and the Code piece for multi-term formulas; read-only and idempotent.', idempotent: true },
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
    return (
      context.propsValue['second_number'] - context.propsValue['first_number']
    );
  },
});
