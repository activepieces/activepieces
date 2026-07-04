import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';
const GOV_LOGIN_HOST = 'login.microsoftonline.us';

const DELEGATED_SCOPE = 'Mail.ReadWrite Mail.Send Calendars.Read offline_access User.Read';
const APP_ONLY_COMMERCIAL_SCOPE = 'https://graph.microsoft.com/.default';
const APP_ONLY_GOV_SCOPE = 'https://graph.microsoft.us/.default';

const GRAPH_BASE_URLS: Record<string, string> = {
  [COMMERCIAL_LOGIN_HOST]: 'https://graph.microsoft.com',
  [GOV_LOGIN_HOST]: 'https://graph.microsoft.us',
};

export const microsoftCloudProperty = Property.StaticDropdown({
  displayName: 'Cloud Environment',
  description: 'Select your Microsoft cloud environment.',
  required: true,
  defaultValue: COMMERCIAL_LOGIN_HOST,
  options: {
    disabled: false,
    options: [
      { label: 'Commercial (Global)', value: COMMERCIAL_LOGIN_HOST },
      { label: 'US Government (GCC High)', value: GOV_LOGIN_HOST },
    ],
  },
});

export const microsoftScopeProperty = Property.StaticDropdown({
  displayName: 'Access Mode',
  description:
    'Pick the option matching your Grant Type. Use a Delegated option with the Authorization Code grant (acts as the signed-in user). Use an App-only option with the Client Credentials grant (acts as the application — also set Tenant ID and Mailbox), choosing the one that matches your Cloud Environment.',
  required: true,
  defaultValue: DELEGATED_SCOPE,
  options: {
    disabled: false,
    options: [
      { label: 'Delegated — Commercial (Global)', value: DELEGATED_SCOPE },
      { label: 'App-only — Commercial (Global)', value: APP_ONLY_COMMERCIAL_SCOPE },
      { label: 'App-only — US Government (GCC High)', value: APP_ONLY_GOV_SCOPE },
    ],
  },
});

function resolveCloudHost(cloudLoginHost: string | undefined | null): string {
  return cloudLoginHost ?? COMMERCIAL_LOGIN_HOST;
}

export function getMicrosoftCloudFromAuth(auth: OAuth2PropertyValue): string {
  return resolveCloudHost(auth.props?.['cloud'] as string | undefined);
}

export function getGraphBaseUrl(cloudLoginHost: string | undefined | null): string {
  const host = resolveCloudHost(cloudLoginHost);
  return GRAPH_BASE_URLS[host] ?? GRAPH_BASE_URLS[COMMERCIAL_LOGIN_HOST];
}
