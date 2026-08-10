import { OutputSchema } from '@activepieces/pieces-framework';

/**
 * Both actions have a bare `return {}` branch, but it is only the branch that
 * suspends the run on a waitpoint. When the flow resumes, `run()` is called
 * again with `ExecutionType.RESUME` and returns the full object below, so the
 * settled step output always carries these keys — `{}` is transient.
 */
export const delayForActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'delayForInMs',
      label: 'Delayed For',
      format: 'duration',
      description: 'How long the flow waited, in milliseconds.',
    },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const delayUntilActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'delayTill',
      label: 'Delayed Until',
      format: 'datetime',
      description: 'The timestamp the flow waited for before continuing.',
    },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};
