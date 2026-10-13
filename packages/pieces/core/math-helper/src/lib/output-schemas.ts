import { OutputSchema } from '@activepieces/pieces-framework';

// Every action returns a bare number, so each schema is a single whole-output
// field: value: '' resolves to the entire step output and adds no path segment.
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
  'The starting number minus the number to subtract.',
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
  'A random whole number between the minimum and maximum, both included.',
);
