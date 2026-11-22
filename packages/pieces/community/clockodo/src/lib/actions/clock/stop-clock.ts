import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../../common';
import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoAuth } from '../../auth';

export default createAction({
  auth: clockodoAuth,
  name: 'stop_clock',
  classification: 'WRITE',
  displayName: 'Stop Clock',
  description: 'Stops the running Clockodo stopwatch',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.entry,
  aiMetadata: {
    description:
      'Stops a running Clockodo stopwatch and returns the finished entry with its end time and duration. Pass the numeric entry id of the running entry (from Get Running Clock or Start Clock); leave it empty to stop the connection user\'s own running clock. Fails when no clock is running. Not idempotent: a second call fails because the clock is already stopped.',
    idempotent: false,
  },
  props: {
    entry_id: Property.ShortText({
      displayName: 'Entry ID',
      description: 'ID of the running entry. Leave empty to stop your own running clock.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const given = clockodoRequests.parseOptionalId({ value: propsValue.entry_id, field: 'Entry ID' });
    const entryId = given ?? (await client.getClock()).running?.id;
    if (entryId === undefined) {
      throw new Error('No Clockodo clock is running for this user, so there is nothing to stop.');
    }
    const response = await client.stopClock(entryId);
    return clockodoRequests.clockEntry({ response, operation: 'stop clock' });
  },
});
