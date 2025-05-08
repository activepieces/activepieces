import { Property, createAction, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, AuthenticationType, QueryParams } from "@activepieces/pieces-common";
import { microsoftToDoAuth } from "../../index";


interface TaskList {
    id: string;
    displayName: string;
}

interface FindTaskListResponse {
    value: TaskList[];
}

export const findTaskListByNameAction = createAction({
    auth:microsoftToDoAuth,
    name: 'find_task_list_by_name',
    displayName: 'Find Task List by Name',
    description: 'Find a Microsoft To Do task list by its name.',
    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            description: 'The name (or partial name) of the task list to find.',
            required: true,
        }),
        match_type: Property.StaticDropdown({
            displayName: 'Match Type',
            description: 'How to match the list name.',
            required: false,
            defaultValue: 'contains',
            options: {
                options: [
                    { label: 'Contains', value: 'contains' },
                    { label: 'Starts With', value: 'startsWith' },
                    { label: 'Exact Match', value: 'exact' },
                ]
            }
        })
    },
    async run(context) {
        const { auth, propsValue } = context;
        const oauthAuth = auth as OAuth2PropertyValue;
        const { name, match_type } = propsValue;

        let filterString = "";
        switch (match_type) {
            case 'startsWith':
                filterString = `startsWith(displayName, '${name}')`;
                break;
            case 'exact':
                filterString = `displayName eq '${name}'`;
                break;
            case 'contains':
            default:
                filterString = `contains(displayName, '${name}')`;
                break;
        }

        const queryParams: QueryParams = { '$filter': filterString };

        const response = await httpClient.sendRequest<FindTaskListResponse>({
            method: HttpMethod.GET,
            url: `https://graph.microsoft.com/v1.0/me/todo/lists`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: oauthAuth.access_token,
            },
            queryParams: queryParams,
        });

        return response.body.value;
    }
});
