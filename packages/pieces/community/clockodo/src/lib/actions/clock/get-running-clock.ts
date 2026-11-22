import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'get_running_clock',
  classification: 'READ',
  displayName: 'Get Running Clock',
  description: 'Retrieves the running stopwatch entry of this connection user',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.runningClock,
  aiMetadata: {
    description:
      'Returns the time entry currently being clocked by the connection user as running, or running = null when no clock is active. Use before Start Clock or Stop Clock. Read-only and idempotent; takes no input.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const res = await makeClient(auth.props).getClock();
    return { running: res.running ?? null };
  },
});
