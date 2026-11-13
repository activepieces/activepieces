import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { deepgramReports } from '../common/reports';
import { listMembersOutputSchema } from '../output-schemas';

export const listProjectMembersAction = createAction({
  auth: deepgramAuth,
  name: 'list_project_members',
  classification: 'SEARCH',
  displayName: 'List Project Members',
  description:
    'Lists the members of a Deepgram project with their roles. Needs an admin or owner API key.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists every member of a Deepgram project with email, name and scopes (roles). Use to audit who has access. Requires an admin or owner API key; a member key gets a permission error. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listMembersOutputSchema,
  props: {
    project: deepgramProps.project(),
  },
  async run(context) {
    return listProjectMembers({
      apiKey: context.auth.secret_text,
      input: context.propsValue,
    });
  },
});

export async function listProjectMembers({
  apiKey,
  input,
}: {
  apiKey: string;
  input: ListMembersInput;
}) {
  const projectId = await deepgramProjects.resolveProjectId({
    apiKey,
    project: input.project,
  });
  const response = await deepgramClient.request<MembersResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: deepgramProjects.projectPath({ projectId, rest: ['members'] }),
    timeoutMs: DEEPGRAM_TIMEOUTS.manage,
    operation: 'list project members',
  });
  return {
    members: (response.body?.members ?? []).map((member) => ({
      member_id: member.member_id ?? '',
      email: member.email ?? null,
      first_name: member.first_name ?? null,
      last_name: member.last_name ?? null,
      scopes: deepgramReports.joinList(member.scopes),
    })),
  };
}

type MembersResponse = {
  members?: {
    member_id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    scopes?: string[];
  }[];
};

export type ListMembersInput = {
  project?: string;
};
