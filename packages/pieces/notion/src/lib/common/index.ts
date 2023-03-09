import { Property } from "@activepieces/framework";

export const notionCommon = {
    baseUrl: "https://api.notion.com/v1",
    authentication: Property.SecretText({
        displayName: "Internal Integration Token",
        required: true,
        description: "Internal Integration Token Obtained From Notion"
    }),
}