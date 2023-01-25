import { OAuth2Property, Property } from "../../../framework/property";

export const slackAuthWithScopes = (...scopes: string[]): OAuth2Property => {
  return Property.OAuth2({
    description: '',
    displayName: 'Authentication',
    authUrl: 'https://slack.com/oauth/authorize',
    tokenUrl: 'https://slack.com/api/oauth.access',
    required: true,
    scope: scopes,
  });
};
