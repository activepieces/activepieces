import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { getRunIdActionOutputSchema } from '../output-schemas';

export const getRunId = createAction({
  audience: 'both',
  name: 'getRunId',
  classification: 'READ',
  displayName: 'Get Run Info',
  description: "Gets this run's ID and a link to open it.",
  aiMetadata: { description: 'Returns the identifier of the flow run that is currently executing, along with a direct link to that run in the Activepieces UI. Use it when a later step needs to reference or report the run itself (e.g. embedding a run link in a Slack alert or a support ticket); it only ever describes the in-progress run and cannot look up a different one. Takes no inputs; read-only and idempotent.', idempotent: true },
  props: {
    info: Property.MarkDown({
      value: "Outputs this run's ID and a link that opens the run.",
      variant: MarkdownVariant.INFO,
    }),
  },
  outputSchema: getRunIdActionOutputSchema,
  async run(context) {
    const publicUrlWithoutApi = context.server.publicUrl.replace(/api\/$/, '');
    return {
      id: context.run.id,
      url: `${publicUrlWithoutApi}projects/${context.project.id}/runs/${context.run.id}`
    }
  },
});
