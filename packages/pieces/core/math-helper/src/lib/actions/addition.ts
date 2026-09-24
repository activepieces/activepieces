import {
  createAction,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { additionActionOutputSchema } from '../output-schemas';

export const addition = createAction({
  audience: 'both',
  name: 'addition_math',
  classification: 'READ',
  outputSchema: additionActionOutputSchema,
  auth: PieceAuth.None(),
  displayName: 'Addition',
  description: 'Add two numbers together.',
  aiMetadata: { description: 'Compute the sum of exactly two numbers, returning first_number + second_number. Pick this only for a two-operand addition; use the sibling Subtraction, Multiplication, Division, or Modulo actions for other operations, and the Code piece for summing a list or evaluating any multi-term formula. Both operands are required and must be numeric; read-only and idempotent, with no external side effects.', idempotent: true },
  props: {
    first_number: Property.Number({
      displayName: 'First Number',
      required: true,
    }),
    second_number: Property.Number({
      displayName: 'Second Number',
      required: true,
    }),
  },
  async run(context) {
    return (
      context.propsValue['first_number'] + context.propsValue['second_number']
    );
  },
});
