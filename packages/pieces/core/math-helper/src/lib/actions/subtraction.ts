import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { subtractionActionOutputSchema } from '../output-schemas';

export const subtraction = createAction({
  audience: 'both',
  name: 'subtraction_math',
  classification: 'READ',
  outputSchema: subtractionActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Subtraction',
  description: 'Subtract one number from another.',
  aiMetadata: { description: 'Compute the difference of two numbers. It returns second_number - first_number: first_number is the amount being subtracted (labelled "Number to Subtract") and second_number is the value it is subtracted from (labelled "Starting Number"). Pick this for a two-operand subtraction only, using the sibling Addition, Multiplication, Division, or Modulo actions for other operations and the Code piece for multi-term formulas; read-only and idempotent.', idempotent: true },
  props: {
    first_number: Property.Number({
      displayName: 'Number to Subtract',
      description: 'This amount is taken away from the starting number.',
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Starting Number',
      description: 'The result is this number minus the number above.',
      required: true,
    }),
  },
  async run(context) {
    return (
      context.propsValue['second_number'] - context.propsValue['first_number']
    );
  },
});
