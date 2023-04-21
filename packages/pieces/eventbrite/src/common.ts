import { AuthenticationType, HttpMethod, httpClient } from "@activepieces/pieces-common";
import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";

export const props = {
  authentication: Property.OAuth2({
    displayName: 'Authentication',
    description: 'OAuth',
    required: true,
    authUrl: 'https://www.eventbrite.com/oauth/authorize',
    tokenUrl: 'https://www.eventbrite.com/oauth/token',
    scope: []
  }),
  organization_id: Property.Dropdown({
    displayName: 'Organization',
    description: 'The ID of the organization to trigger a webhook',
    required: true,
    refreshers: ['authentication'],
    options: async ({ authentication }) => {
      if (!authentication)
        return {
          disabled: true,
          placeholder: 'connect your account first',
          options: [],
        }

      const response = await httpClient.sendRequest<OrganizationList>({
        method: HttpMethod.GET,
        url: `https://www.eventbriteapi.com/v3/users/me/organizations/`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (authentication as OAuth2PropertyValue).access_token
        }
      })

      return {
        disabled: false,
        options: response.body
          .organizations
          .map((organization) => ({ label: organization.name, value: organization.id })),
      };
    }
  }),
  event_id: Property.Dropdown({
    displayName: 'Event',
    description: 'The Event to triggers. Leave blank to attach to all events.',
    required: false,
    refreshers: ['authentication', 'organization_id'],
    options: async ({ authentication, organization_id }) => {
      if (!authentication)
        return { disabled: true, placeholder: 'Please connect your account first', options: [] }
      if (!organization_id)
        return { disabled: true, placeholder: 'Please select an organization first', options: [] }

      const response = await httpClient.sendRequest<{
        events: {
          id: string,
          name: {
            text: string
            html: string
          },
        }[]
      }>({
        method: HttpMethod.GET,
        url: `https://www.eventbriteapi.com/v3/organizations/${organization_id}/events/`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: (authentication as OAuth2PropertyValue).access_token
        }
      })

      return {
        disabled: false,
        options: response.body
          .events
          .map((event) => ({ label: event.name.text, value: event.id })),
      };
    }
  })
}

interface OrganizationList {
  pagination: {
    object_count: number
    page_number: number
    page_size: number
    page_count: number
    continuation: string
    has_more_items: boolean
  },
  organizations: Organization[]
}

interface Organization {
  id: string
  name: string
  vertical: string
  image_id: string
}