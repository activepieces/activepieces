import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { listMembersOutputSchema } from '../../output-schemas';
import {
  listProjectMembers,
  listProjectMembersAction,
} from '../list-project-members';

const { project: _project, ...originalProps } = listProjectMembersAction.props;

export const listProjectMembersAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_project_members',
  classification: 'SEARCH',
  displayName: 'List Project Members (Agent)',
  description: 'Lists the members of a Deepgram project with their scopes.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every member of a Deepgram project with email, name and scopes (roles), so it also answers which scopes each member holds. Use to audit who has access. Needs an admin or owner key; a member key gets a permission error. Read-only.',
    idempotent: true,
  },
  outputSchema: listMembersOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return listProjectMembers({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
