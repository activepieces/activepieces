import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaStoryOutputSchema } from '../../output-schemas';

export const asanaGetStoryAction = createAction({
  auth: asanaAuth,
  name: 'get_story',
  classification: 'READ',
  displayName: 'Get Story',
  description: 'Get one comment or activity entry of an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one story (a comment or a system activity entry) by gid, including its text, rich text, author, pin state and whether it can be edited. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaStoryOutputSchema,
  props: {
    story: Property.ShortText({
      displayName: 'Story GID',
      description: 'Gid of the story. Obtain it from List Task Stories or Add Task Comment.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/stories/${asanaUtils.pathSegment(context.propsValue.story)}`,
      operation: 'Get Story',
      query: { opt_fields: ASANA_FIELDS.story },
    });
  },
});
