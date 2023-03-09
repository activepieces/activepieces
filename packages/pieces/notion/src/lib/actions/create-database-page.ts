import { AuthenticationType, createAction, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework";
import { notionCommon } from "../common";

export const notionCreateDatabasePage = createAction({
    name: 'notion_create_database_page',
    displayName: 'Create database page',
    description: 'Notion create database page',
    sampleData: {},
    props: {
      authentication: notionCommon.authentication,
      parent_database_id: Property.ShortText({
        displayName: "Parent database Id",
        description: "The database to create this page under",
        required: true
      }),

      // very crude implementation for now
      // will need to investigate a more efficient way to work with Notion's page properties
      // potential implementation: send a request, get database properties and then prefill
      // property.json with the properties
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
        parent: {
          type: "database_id",
          database_id: context.propsValue.parent_database_id
        },
        properties: {
          ...context.propsValue.properties,
        }
      }
  
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${notionCommon.baseUrl}/pages`,
        body,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue.authentication
        },
        headers: {
          'Notion-Version': '2022-06-28'
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