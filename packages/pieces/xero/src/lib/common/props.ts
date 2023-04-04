import { AuthenticationType, httpClient, HttpMethod, HttpRequest, OAuth2PropertyValue, Property } from "@activepieces/framework";

export const props = {
  authentication: Property.OAuth2({
    description: "",
    displayName: 'Authentication',
    authUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    required: true,
    scope: [
      'accounting.contacts',
      'accounting.transactions'
    ]
  }),
  tenant_id: Property.Dropdown({
    displayName: 'Organization',
    description: 'Tenant ID',
    refreshers: ['authentication'],
    required: true,
    options: async ({ authentication }) => {
      if (!authentication)
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first'
        }

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.xero.com/connections',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (authentication as OAuth2PropertyValue).access_token
        }
      }
  
      const result = await httpClient.sendRequest<{
        id: string,
        authEventId: string,
        tenantId: string,
        tenantType: string,
        tenantName: string,
        createdDateUtc: string,
        updatedDateUtc: string,
      }[]>(request)

      if (result.status === 200) {
        return {
          disabled: false,
          options: [{
            label: `Tenant Id: ${result.body?.[0].tenantId}`, 
            value: result.body?.[0].tenantId
          }]
        }
      }

      return {
        disabled: true,
        options: [],
        placeholder: "Error processing tenant_id"
      }
    }
  }),
  invoice_id: Property.ShortText({
    displayName: "Invoice ID",
    description: "ID of the invoice to update",
    required: false
  }),
  contact_id: (required=false) => Property.ShortText({
    displayName: "Contact ID",
    description: "ID of the contact to create invoice for.",
    required: required
  }),
  contact_name: (required = false) => Property.ShortText({
    displayName: "Name",
    description: "Contact name, in full.",
    required: required
  }),
  contact_email: (required = false) => Property.ShortText({
    displayName: "Email",
    description: "Email address of the contact.",
    required: required
  })
}