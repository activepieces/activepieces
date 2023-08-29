import { OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { Client } from "@notionhq/client";

export const notionCommon = {
    baseUrl: "https://api.notion.com/v1",
    database_id: Property.Dropdown<string>({
        displayName: "Database",
        required: true,
        description: "Select the database you want to use",
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Notion account first",
                    options: []
                }
            }
            const notion = new Client({
                auth: (auth as OAuth2PropertyValue).access_token,
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
                    label: database.title?.[0]?.plain_text ?? database.title ?? "Unknown title",
                    value: database.id
                }))
            }
        }
    })
}
