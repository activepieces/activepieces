import { Property } from "@activepieces/framework"

export const trelloCommon = {
    baseUrl: "https://api.trello.com/1/",
    authentication: Property.BasicAuth({
        description: "Trello API & Token key acquired from your Trello Settings",
        displayName: "Trello Connection",
        required: true,
        username: {
            displayName: "API Key",
            description: "Trello API Key",
        },
        password: {
            displayName: "Token",
            description: "Trello Token",
        }
    })
}