import { OAuth2PropertyValue, Property } from "@activepieces/framework";
import { Client } from "@notionhq/client";

export const notionCommon = {
    baseUrl: "https://api.notion.com/v1",
    authentication: Property.OAuth2({
        displayName: "Notion Account",
        authUrl: "https://api.notion.com/v1/oauth/authorize",
        tokenUrl: "https://api.notion.com/v1/oauth/token",
        scope: [],
        extra: {
            owner: "user"
        },
        required: true,
    }),
    database_id: Property.Dropdown<string>({
        displayName: "Database",
        required: true,
        description: "Select the database you want to use",
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (!propsValue['authentication']) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Notion account first",
                    options: []
                }
            }
            const notion = new Client({
                auth: (propsValue['authentication'] as OAuth2PropertyValue).access_token,
                notionVersion: "2022-02-22",
            });
            const databases = await notion.search({
                filter: {
                    property: "object",
                    value: "database",
                }
            });
            return {
                placeholder: "Select a database",
                options: databases.results.map((database: any) => ({
                    label: database.title[0].plain_text,
                    value: database.id
                }))
            }
        }
    })
}