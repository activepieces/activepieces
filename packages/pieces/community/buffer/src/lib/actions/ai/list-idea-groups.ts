import { createAction, Property } from '@activepieces/pieces-framework';
import { bufferAuth } from '../../common/auth';
import { bufferAiProps } from '../../common/ai-props';
import { bufferFetch } from '../../common/props';
import { listIdeaGroupsOutputSchema } from '../../common/output-schemas';

export const listIdeaGroups = createAction({
  auth: bufferAuth,
  name: 'list_idea_groups',
  classification: 'SEARCH',
  displayName: 'List Idea Groups',
  description: 'List the columns of the Ideas board in a Buffer organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the columns (groups) of an organization\'s Ideas board, such as To Do, In Progress and Done, with their Group IDs. Use a Group ID to filter List Ideas or to place a new idea with Create Idea. Returns all groups in one call. Read-only.',
    idempotent: true,
  },
  props: {
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The organization ID from List Organizations.',
      required: true,
    }),
  },
  outputSchema: listIdeaGroupsOutputSchema,
  async run(context) {
    const organizationId = bufferAiProps.requiredId({ value: context.propsValue.organizationId, label: 'Organization ID' });
    const groups = await bufferFetch.fetchIdeaGroups({ accessToken: context.auth.secret_text, organizationId });
    return { groups };
  },
});
