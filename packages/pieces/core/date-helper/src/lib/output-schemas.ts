import { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Every action here returns a date rendered with the step's own "To Time Format"
 * dropdown, which ranges from `YYYY-MM-DD` to unix seconds (`X`). A `datetime`
 * or `date` format hint would misrender those, so `result` is left unformatted
 * and the description carries the meaning instead.
 */
const formattedDateResult = (
  label: string,
  description: string
): OutputSchema => ({
  fields: [{ key: 'result', label, description }],
});

export const formatDateActionOutputSchema = formattedDateResult(
  'Formatted Date',
  'The input date rendered in the chosen output format and time zone.'
);

export const addSubtractDateActionOutputSchema = formattedDateResult(
  'Resulting Date',
  'The input date shifted by the expression, in the chosen output format.'
);

export const getCurrentDateActionOutputSchema = formattedDateResult(
  'Current Date',
  'The current date and time in the chosen time zone and output format.'
);

export const nextDayOfWeekActionOutputSchema = formattedDateResult(
  'Next Occurrence',
  'The next occurrence of the chosen weekday, in the chosen output format.'
);

export const nextDayOfYearActionOutputSchema = formattedDateResult(
  'Next Occurrence',
  'The next occurrence of the chosen month and day, in the chosen output format.'
);

export const firstDayOfPreviousMonthActionOutputSchema = formattedDateResult(
  'First Day of Previous Month',
  'The first day of the previous month, in the chosen output format.'
);

export const lastDayOfPreviousMonthActionOutputSchema = formattedDateResult(
  'Last Day of Previous Month',
  'The last day of the previous month, in the chosen output format.'
);

/**
 * Deliberately NOT schematized: Extract Date Units and Date Difference.
 *
 * Both return `Record<string, …>` keyed by the units picked in their
 * multi-select, so no static field list can match the actual output. The
 * renderer prints an italic "empty" for a described field that doesn't resolve
 * rather than hiding it (see output-table-view.tsx), so describing all eight
 * units means someone extracting only Year sees one value and seven phantom
 * "empty" rows — which reads as "the unit was computed and came back blank"
 * instead of "you never asked for it".
 *
 * Leaving them undescribed is strictly better here: the builder drills the real
 * sample generically and shows exactly the keys that are present, and these two
 * actions already return flat, self-naming JSON (`{ year: 2026, monthName:
 * 'June' }`) with no API noise to curate away. `format: 'number'` was also
 * wrong on the calendar fields — it renders a year as "2,026".
 *
 * The units each action supports are already enumerated in its
 * `aiMetadata.description`, so AI/MCP consumers are not left guessing.
 */
