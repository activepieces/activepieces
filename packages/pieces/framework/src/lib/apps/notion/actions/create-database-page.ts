import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property';

export const notionCreateDatabasePage = createAction({
  name: 'notion_create_database_page',
  displayName: 'Create database page',
  description: 'Notion create database page',
  sampleData: {},
  props: {
    authentication: Property.OAuth2({
      displayName: 'Authentication',
      description: "",
      authUrl: "https://api.notion.com/v1/oauth/authorize?client_id=a5162711-eadc-41b0-9ea7-422bc009d74d&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fdemo.activepieces.com%2Fredirect",
      tokenUrl: "https://api.notion.com/v1/oauth/token",
      required: true,
      scope: []
    }),
    icon_url: Property.ShortText({
      displayName: "Icon URL",
      description: "The icon of the new page. An external URL.",
      required: false
    }),
    cover_url: Property.ShortText({
      displayName: "Cover URL",
      description: "The cover image of the new page",
      required: false
    }),
    parent_database_id: Property.ShortText({
      displayName: "Meeting's topic",
      description: "The meeting's topic",
      required: true
    }),
    properties: Property.Object({
      displayName: "Meeting's topic",
      description: "The values of the page's properties. The schema must match the parent database's properties.",
      required: true
    }),
    children: Property.Array({
      displayName: "Children",
      description: "The content to be rendered on the new page, represented as an array of block objects.",
      required: true
    })
  },

  async run(context) {
    const body = {
      cover: {
        type: "external",
        external: {
          url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
        }
      },
      icon: {
        type: "external",
        external: {
          url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Tuscankale.jpg"
        }
      },
      parent: {
        type: "database_id",
        database_id: context.propsValue.parent_database_id
      }
    }

    const request = {
      method: HttpMethod.POST,
      url: `https://api.notion.com/v1/pages`,
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication!.access_token
      },
      queryParams: {}
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Page creation response", result)

    if (result.status === 201) {
      return result.body
    } else {
      return result
    }
  },
});
