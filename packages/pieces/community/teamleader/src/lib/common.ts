import { TeamleaderAuth } from './auth'; 
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export { TeamleaderAuth };

// Utility to get the Teamleader API base URL from auth props
export function getTeamleaderApiBaseUrl(auth: OAuth2PropertyValue): string {
  // If customDomain is provided in auth, use it; otherwise, use the default
  const customDomain = (auth as Record<string, unknown>)?.['customDomain'] as string | undefined;
  if (customDomain && /^https:\/\/.+\.teamleader\.eu$/.test(customDomain)) {
    return `${customDomain}/api.focus.teamleader.eu`;
  }
  return 'https://api.focus.teamleader.eu';
}
