import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { getCurrentUserOutputSchema } from '../output-schemas';

export const getCurrentUser = createAction({
  auth: huggingFaceAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User & Token',
  description: 'Get the Hugging Face account behind the connection and the role of its access token.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the account behind the connected token (username, full name, email, PRO status, organizations with the user's role in each) and the token's name, role ('read', 'write' or 'fineGrained') and fine-grained permissions. Call it first to learn the username or organization namespaces, or to diagnose 401/403 errors: a 'read' token cannot perform Hub writes. Never returns the token value. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getCurrentUserOutputSchema,
  props: {},
  async run(context) {
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/whoami-v2',
    });
    const body = hfHub.isRecord(response.body) ? response.body : {};
    const accessToken = pickRecord({ source: pickRecord({ source: body, key: 'auth' }), key: 'accessToken' });
    const fineGrained = pickRecord({ source: accessToken, key: 'fineGrained' });
    const orgs = Array.isArray(body['orgs']) ? body['orgs'].filter(hfHub.isRecord) : [];
    const scoped = Array.isArray(fineGrained?.['scoped']) ? fineGrained['scoped'].filter(hfHub.isRecord) : [];
    return {
      username: pickString({ source: body, key: 'name' }),
      full_name: pickString({ source: body, key: 'fullname' }),
      email: pickString({ source: body, key: 'email' }),
      email_verified: pickBoolean({ source: body, key: 'emailVerified' }),
      is_pro: pickBoolean({ source: body, key: 'isPro' }),
      avatar_url: pickString({ source: body, key: 'avatarUrl' }),
      account_type: pickString({ source: body, key: 'type' }),
      organizations: orgs.map((org) => ({
        name: pickString({ source: org, key: 'name' }),
        full_name: pickString({ source: org, key: 'fullname' }),
        role_in_org: pickString({ source: org, key: 'roleInOrg' }),
        is_enterprise: pickBoolean({ source: org, key: 'isEnterprise' }),
      })),
      token_name: pickString({ source: accessToken, key: 'displayName' }),
      token_role: pickString({ source: accessToken, key: 'role' }),
      token_created_at: pickString({ source: accessToken, key: 'createdAt' }),
      token_can_read_gated_repos: pickBoolean({ source: fineGrained, key: 'canReadGatedRepos' }),
      token_global_permissions: pickStringArray({ source: fineGrained, key: 'global' }),
      token_scoped_permissions: scoped.map((scope) => {
        const entity = pickRecord({ source: scope, key: 'entity' });
        return {
          entity_type: pickString({ source: entity, key: 'type' }),
          entity_name: pickString({ source: entity, key: 'name' }),
          permissions: pickStringArray({ source: scope, key: 'permissions' }),
        };
      }),
    };
  },
});

function pickRecord({ source, key }: PickParams): Record<string, unknown> | null {
  const value = source?.[key];
  return hfHub.isRecord(value) ? value : null;
}

function pickString({ source, key }: PickParams): string | null {
  const value = source?.[key];
  return typeof value === 'string' ? value : null;
}

function pickBoolean({ source, key }: PickParams): boolean | null {
  const value = source?.[key];
  return typeof value === 'boolean' ? value : null;
}

function pickStringArray({ source, key }: PickParams): string[] {
  const value = source?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

type PickParams = {
  source: Record<string, unknown> | null;
  key: string;
};
