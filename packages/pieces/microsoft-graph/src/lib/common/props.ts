import { Property } from "@activepieces/framework";

export const commonProps = {
  authentication: (scope: string[]) => Property.OAuth2({
    props: {
      tenant: Property.ShortText({
        displayName: 'Tenant Id',
        description: 'Your Tenant Id',
        required: true
      })
    },
    displayName: 'Authentication',
    description: 'Authentication for the webhook',
    required: true,
    authUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
    scope
  })
}