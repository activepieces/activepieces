import type { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Output schemas for the Jira Cloud piece.
 *
 * Authored from a real captured run against a live Jira Cloud site, per the
 * output-schema skill's rule that a schema comes from captured output and never from
 * a guessed shape.
 *
 * The paths describe what `run()` RETURNS — the flattened
 * `{ issueIdOrKey, count, transitions[] }` object — not Jira's raw
 * `{ expand, transitions[] }` envelope, which the action deliberately discards.
 */
export const listIssueTransitionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'issueIdOrKey',
      label: 'Issue ID or Key',
      description:
        'Echoed back so a downstream step can pair transitions with their issue.',
    },
    { key: 'count', label: 'Transition Count', format: 'number' },
    {
      // listItems paths are RELATIVE to one transition — `id`, never
      // `transitions.id`. The schema reference calls the absolute form the #1
      // correctness bug in hand-written schemas.
      key: 'transitions',
      label: 'Transitions',
      labelKey: 'name',
      listItems: [
        {
          key: 'id',
          label: 'Transition ID',
          description:
            'Pass this to Transition Issue. Valid only for this issue at its current status.',
        },
        { key: 'name', label: 'Transition Name' },
        { key: 'toStatusId', label: 'Destination Status ID' },
        { key: 'toStatusName', label: 'Destination Status' },
        {
          key: 'toStatusCategory',
          label: 'Destination Status Category',
          description:
            'One of `new`, `indeterminate`, or `done` — the coarse bucket the destination status belongs to.',
        },
        {
          key: 'isAvailable',
          label: 'Available',
          format: 'boolean',
          description:
            'False only when unavailable transitions were explicitly requested.',
        },
        {
          key: 'hasScreen',
          label: 'Requires Screen',
          format: 'boolean',
          description:
            'True when Jira would prompt for extra fields, which the transition may require.',
        },
      ],
    },
  ],
};
