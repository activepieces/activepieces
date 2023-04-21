import { AuthenticationType, createAction, httpClient, HttpMethod, OAuth2PropertyValue, Property } from "@activepieces/framework";

// https://learn.microsoft.com/en-us/graph/api/channel-post-messages?view=graph-rest-1.0&tabs=http

export const microsoftTeamsSendChannelMessage = createAction({
  name: 'microsoft_teams_send_channel_message',
  description: 'Send Message to a Channel',
  displayName: 'Send Message To Channel',
  props: {
    authentication: Property.OAuth2({
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
      scope: ['ChannelMessage.Send']
    }),
    team_id: Property.Dropdown({
      displayName: 'Team',
      description: 'The team that owns the channel',
      required: true,
      refreshers: ['authentication'],
      options: async ({ authentication }) => {
        if (!authentication) 
          return { disabled: true, placeholder: 'connect your account first', options: [] }

        const response = await httpClient.sendRequest<{
          value: {
            id: string
            displayName: string
            description: string
          }[]
        }>({
          method: HttpMethod.GET,
          url: `https://graph.microsoft.com/v1.0/me/joinedTeams`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (authentication as OAuth2PropertyValue).access_token
          }
        })

        if (response.status === 200) {
          return {
            options: response.body.value.map(team => ({
              value: team.id,
              label: team.displayName,
            }))
          }
        }
        return { disabled: true, placeholder: "Error fetching User's teams", options: [] }
      }
    }),
    channel_id: Property.Dropdown({
      displayName: 'Channel',
      description: 'The channel to send message via',
      required: true,
      refreshers: ['authentication', 'team_id'],
      options: async ({ authentication, team_id }) => {
        if (!authentication)
          return { disabled: true, placeholder: 'Connect your account first', options: [] }
        if (!team_id)
          return { disabled: true, placeholder: 'Please select a team first', options: [] }

        const response = await httpClient.sendRequest<{
          value: {
            id: string
            createdDateTime: string
            displayName: string
            description: string
            membershipType: string
          }[]
        }>({
          method: HttpMethod.GET,
          url: `https://graph.microsoft.com/v1.0/teams/${team_id}/channels`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (authentication as OAuth2PropertyValue).access_token
          }
        })

        if (response.status === 200) {
          return {
            options: response.body.value.map(team => ({
              value: team.id,
              label: team.displayName,
            }))
          }
        }
        return { disabled: true, placeholder: "Error fetching User's teams", options: [] }
      }
    }),
    message_text: Property.LongText({
      displayName: 'Message',
      description: 'The Message text to send to channel',
      required: true,
    })
  },
  sampleData: {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#teams('fbe2bf47-16c8-47cf-b4a5-4b9b187c508b')/channels('19%3A4a95f7d8db4c4e7fae857bcebe0623e6%40thread.tacv2')/messages/$entity",
    "id": "1616990032035",
    "replyToId": null,
    "etag": "1616990032035",
    "messageType": "message",
    "createdDateTime": "2021-03-29T03:53:52.035Z",
    "lastModifiedDateTime": "2021-03-29T03:53:52.035Z",
    "lastEditedDateTime": null,
    "deletedDateTime": null,
    "subject": null,
    "summary": null,
    "chatId": null,
    "importance": "normal",
    "locale": "en-us",
    "webUrl": "https://teams.microsoft.com/l/message/19%3A4a95f7d8db4c4e7fae857bcebe0623e6%40thread.tacv2/1616990032035?groupId=fbe2bf47-16c8-47cf-b4a5-4b9b187c508b&tenantId=2432b57b-0abd-43db-aa7b-16eadd115d34&createdTime=1616990032035&parentMessageId=1616990032035",
    "policyViolation": null,
    "eventDetail": null,
    "from": {
      "application": null,
      "device": null,
      "conversation": null,
      "user": {
        "id": "8ea0e38b-efb3-4757-924a-5f94061cf8c2",
        "displayName": "Robin Kline",
        "userIdentityType": "aadUser"
      }
    },
    "body": {
      "contentType": "text",
      "content": "Hello World"
    },
    "channelIdentity": {
      "teamId": "fbe2bf47-16c8-47cf-b4a5-4b9b187c508b",
      "channelId": "19:4a95f7d8db4c4e7fae857bcebe0623e6@thread.tacv2"
    },
    "attachments": [],
    "mentions": [],
    "reactions": []
  },
  run: async ({ propsValue }) => {

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://graph.microsoft.com/v1.0/teams/${propsValue.team_id}/channels/${propsValue.channel_id}/messages`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: propsValue.authentication['access_token'],
      },
      body: {
        "body": {
          "content": propsValue.message_text,
          "contentType": "html"
        }
      }
    })

    console.debug("send message response", response)

    if (response.status === 200) {
      return response.body
    }

    return response
  }
})