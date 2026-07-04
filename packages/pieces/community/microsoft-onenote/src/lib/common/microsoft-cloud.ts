import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';

const COMMERCIAL_LOGIN_HOST = 'login.microsoftonline.com';
const GOV_LOGIN_HOST = 'login.microsoftonline.us';

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
