import { Property } from '../../../framework/property';

export const hubSpotAuthentication = Property.OAuth2({
  displayName: 'Authentication',
  authUrl: 'https://app.hubspot.com/oauth/authorize',
  tokenUrl: 'https://api.hubapi.com/oauth/v1/token',
  required: true,
  scope: ['crm.objects.contacts.write', 'crm.objects.contacts.read']
});
