import { Property, createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType } from "@activepieces/pieces-common";
import { microsoftToDoAuth } from "../../index";

export const createTaskListAction = createAction({
    auth:microsoftToDoAuth,
    name: 'create_task_list',
    displayName: 'Create Task List',
    description: 'Create a new task list in Microsoft To Do.',
    props: {
        displayName: Property.ShortText({
            displayName: 'List Name',
            description: 'The name for the new task list.',
            required: true,
        }),
    },
    async run(context) {
        const { auth, propsValue } = context;
        const oauthAuth = auth as OAuth2PropertyValue;

        const response = await httpClient.sendRequest<{
            id: string;
            displayName: string;
        }>({
            method: HttpMethod.POST,
            url: `https://graph.microsoft.com/v1.0/me/todo/lists`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: oauthAuth.access_token,
            },
            body: {
                displayName: propsValue.displayName,
            },
        });

        return response.body;
    }
});
