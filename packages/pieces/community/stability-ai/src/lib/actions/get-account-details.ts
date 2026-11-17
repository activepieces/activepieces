import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stabilityAiAuth } from '../auth';
import { stabilityClient } from '../common/client';
import { accountDetailsOutputSchema } from '../common/output-schemas';

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function mapOrganization(organization: AccountOrganization): MappedOrganization {
  return {
    id: readString(organization.id),
    name: readString(organization.name),
    role: readString(organization.role),
    isDefault: organization.is_default === true,
  };
}

export const getAccountDetails = createAction({
  auth: stabilityAiAuth,
  name: 'get_account_details',
  classification: 'READ',
  displayName: 'Get Account Details',
  description: 'Get the user and organizations behind the connected Stability AI API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the user ID, email, profile picture and organizations (with role and default flag) of the connected Stability AI account. Use Get Account Balance for the credit balance. Free and safe to repeat.',
    idempotent: true,
  },
  props: {},
  outputSchema: accountDetailsOutputSchema,
  async run(context) {
    const body = await stabilityClient.sendJson<AccountResponse>({
      apiKey: context.auth.props.api_key,
      method: HttpMethod.GET,
      path: '/v1/user/account',
    });
    return {
      id: readString(body?.id),
      email: readString(body?.email),
      profilePicture: readString(body?.profile_picture),
      organizations: Array.isArray(body?.organizations) ? body.organizations.map(mapOrganization) : [],
    };
  },
});

type AccountOrganization = {
  id?: unknown;
  name?: unknown;
  role?: unknown;
  is_default?: unknown;
};

type AccountResponse = {
  id?: unknown;
  email?: unknown;
  profile_picture?: unknown;
  organizations?: AccountOrganization[];
};

type MappedOrganization = {
  id: string | null;
  name: string | null;
  role: string | null;
  isDefault: boolean;
};
