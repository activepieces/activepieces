import { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Every Math Helper action returns a bare number rather than an object, so each
 * schema is a single whole-output field: `value: ''` resolves to the entire
 * step output and contributes no path segment.
 *
 * This shape is what `describeWholeOutputSchema` (server MCP utils) recognises —
 * exactly one field, `value: ''`, no `children`/`listItems` — so agents get a
 * one-line description of the result instead of a bogus `result` path.
 */
const wholeNumberOutput = (
  key: string,
  label: string,
  description: string,
): OutputSchema => ({
  fields: [{ key, label, value: '', format: 'number', description }],
});

export const additionActionOutputSchema = wholeNumberOutput(
  'sum',
  'Sum',
  'The first number plus the second number.',
);

export const subtractionActionOutputSchema = wholeNumberOutput(
  'difference',
  'Difference',
  'The second number minus the first number.',
);

export const multiplicationActionOutputSchema = wholeNumberOutput(
  'product',
  'Product',
  'The first number multiplied by the second number.',
);

export const divisionActionOutputSchema = wholeNumberOutput(
  'quotient',
  'Quotient',
  'The first number divided by the second number. May be fractional.',
);

export const moduloActionOutputSchema = wholeNumberOutput(
  'remainder',
  'Remainder',
  'The remainder of the first number divided by the second number.',
);

export const generateRandomActionOutputSchema = wholeNumberOutput(
  'randomNumber',
  'Random Number',
  'A pseudo-random integer between the two numbers, inclusive.',
);
