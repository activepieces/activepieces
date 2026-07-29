import { createAction } from '@activepieces/pieces-framework';

export const getRunId = createAction({
  audience: 'both',
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getRunId',
  displayName: 'Get Run Info',
  description: '',
  aiMetadata: { description: 'Returns the identifier of the flow run that is currently executing, along with a direct link to that run in the Activepieces UI. Use it when a later step needs to reference or report the run itself (e.g. embedding a run link in a Slack alert or a support ticket); it only ever describes the in-progress run and cannot look up a different one. Takes no inputs; read-only and idempotent.', idempotent: true },
  props: {},
  async run(context) {
    const publicUrlWithoutApi = context.server.publicUrl.replace('/api', '');
    return {
      id: context.run.id,
      url: `${publicUrlWithoutApi}projects/${context.project.id}/runs/${context.run.id}`
    }
  },
});
