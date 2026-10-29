import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaGetRun = createAction({
  auth: lettaAuth,
  name: 'letta_get_run',
  displayName: 'Get Run',
  description: 'Gets the status of an agent run.',
  classification: 'READ',
  audience: 'ai',
  outputSchema: lettaSchemas.run,
  aiMetadata: {
    description:
      'Retrieves a Letta run by ID: status (created, running, completed, failed, cancelled), stop reason and timing. Use to check how a run that Send Message started ended (find run_id on its messages). Read-only.',
    idempotent: true,
  },
  props: {
    run_id: lettaProps.aiId({ displayName: 'Run ID', description: 'The run ID (run-...) taken from the run_id of a message (Send Message or List Agent Messages).' }),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const runId = lettaApi.requireText({ value: propsValue.run_id, name: 'Run ID' });
    const run = await lettaApi.callLetta(() => client.runs.retrieve(runId));
    return lettaApi.mapRun(run);
  },
});
