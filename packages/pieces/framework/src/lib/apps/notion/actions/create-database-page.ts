import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
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
      authUrl: "https://api.notion.com/v1/oauth/authorize?response_type=code&owner=user",
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
      displayName: "Parent database Id",
      description: "The database to create this page under",
      required: true
    }),
    properties: Property.Json({
      displayName: "Page Properties",
      description: "The values of the page's properties. The schema must match the parent database's properties.",
      required: true
    }),
    children: Property.Array({
      displayName: "Children",
      description: "The content to be rendered on the new page, represented as an array of block objects.",
      required: false
    })
  },

  async run(context) {
    const body = {
      cover: {
        type: "external",
        external: {
          url: context.propsValue.cover_url
        }
      },
      icon: {
        type: "external",
        external: {
          url: context.propsValue.icon_url 
        }
      },
      parent: {
        type: "database_id",
        database_id: context.propsValue.parent_database_id
      }
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.notion.com/v1/pages`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.authentication!.access_token
      },
      headers: {
        'Notion-Version': '1'
      }
    }

    const result = await httpClient.sendRequest<any>(request)
    console.debug("Page creation response", result)

    if (result.status === 201) {
      return result.body
    } else {
      return result
    }
  },
});
