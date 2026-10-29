import { createAction } from '@activepieces/pieces-framework';
import { lettaAuth } from '../../common/auth';
import { lettaApi } from '../../common/client';
import { lettaProps } from '../../common/props';
import { lettaSchemas } from '../../common/schemas';

export const lettaListRunMessages = createAction({
  auth: lettaAuth,
  name: 'letta_list_run_messages',
  displayName: 'List Run Messages',
  description: 'Lists the messages produced by a run.',
  classification: 'SEARCH',
  audience: 'ai',
  outputSchema: lettaSchemas.messageList,
  aiMetadata: {
    description:
      'Lists the messages a Letta run produced (oldest first by default, so the final assistant reply comes last). Use after Get Run reports completed. Returns one page plus next_cursor. Read-only.',
    idempotent: true,
  },
  props: {
    run_id: lettaProps.aiId({ displayName: 'Run ID', description: 'The run ID (run-...) taken from the run_id of a message (Send Message or List Agent Messages).' }),
    limit: lettaProps.aiLimit({ max: 100 }),
    after: lettaProps.aiAfter(),
    order: lettaProps.aiOrder(),
  },
  async run({ auth, propsValue }) {
    const client = await lettaApi.getLettaClient({ auth: auth.props });
    const runId = lettaApi.requireText({ value: propsValue.run_id, name: 'Run ID' });
    const limit = lettaApi.resolveLimit({ limit: propsValue.limit, max: 100, fallback: 50 });
    const query = { limit, after: lettaApi.optionalText(propsValue.after), order: propsValue.order === 'desc' ? 'desc' : 'asc' };
    const page = await lettaApi.callLetta(() => client.runs.messages.list(runId, query));
    return lettaApi.toPage({ items: page.getPaginatedItems().map(lettaApi.mapMessage), limit, cursorOf: (message) => message.id });
  },
});
