import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { DEEPGRAM_TIMEOUTS, deepgramClient } from '../common/client';
import { deepgramProjects } from '../common/projects';
import { deepgramProps } from '../common/props';
import { deepgramReports } from '../common/reports';
import { listKeysOutputSchema } from '../output-schemas';

export const listProjectKeysAction = createAction({
  auth: deepgramAuth,
  name: 'list_project_keys',
  classification: 'SEARCH',
  displayName: 'List API Keys',
  description:
    'Lists the API keys of a Deepgram project (never the secret values). A member key only sees its own keys.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists API key records of a Deepgram project with ID, comment, scopes, creation date and owner email; the secret key value is never returned. Member keys only see keys they created; admin and owner keys see all. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listKeysOutputSchema,
  props: {
    project: deepgramProps.project(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only list keys with this status. Leave empty for all keys.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Expired', value: 'expired' },
        ],
      },
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const projectId = await deepgramProjects.resolveProjectId({
      apiKey,
      project: context.propsValue.project,
    });
    const response = await deepgramClient.request<KeysResponse>({
      apiKey,
      method: HttpMethod.GET,
      path: deepgramProjects.projectPath({ projectId, rest: ['keys'] }),
      query: { status: context.propsValue.status ?? undefined },
      timeoutMs: DEEPGRAM_TIMEOUTS.manage,
      operation: 'list API keys',
    });
    return {
      keys: (response.body?.api_keys ?? []).map((item) => ({
        api_key_id: item.api_key?.api_key_id ?? '',
        comment: item.api_key?.comment ?? null,
        scopes: deepgramReports.joinList(item.api_key?.scopes),
        created: item.api_key?.created ?? null,
        expiration_date: item.api_key?.expiration_date ?? null,
        member_id: item.member?.member_id ?? null,
        member_email: item.member?.email ?? null,
      })),
    };
  },
});

type KeysResponse = {
  api_keys?: {
    member?: { member_id?: string; email?: string };
    api_key?: {
      api_key_id?: string;
      comment?: string;
      scopes?: string[];
      created?: string;
      expiration_date?: string;
    };
  }[];
};
