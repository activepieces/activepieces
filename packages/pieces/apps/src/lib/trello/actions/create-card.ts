import { createAction, httpClient, HttpRequest, HttpMethod, Property } from '@activepieces/framework';
import { trelloCommon } from '../common';
import { TrelloCard } from '../common/props/card';

export const createCard = createAction({
	name: 'create_card',
    displayName:'Create Card',
    description: 'Create a new card in Trello',
	props: {
        authentication: trelloCommon.authentication,
        board_id: trelloCommon.board_id,
        list_id: trelloCommon.list_id,
		name: Property.ShortText({
			description: 'The name of the card to create',
			displayName: 'Task Name',
			required: true,
		}),
		description: Property.LongText({
			description: 'The description of the card to create',
			displayName: 'Task Description',
			required: false,
		}),
	},

	async run(context) {
        const configsWithoutAuthentication: Record<string, unknown> = { ...context.propsValue };
        delete configsWithoutAuthentication['authentication'];

        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${trelloCommon.baseUrl}cards` + 
            `?idList=` + configsWithoutAuthentication['list_id']
            + `&key=` + context.propsValue.authentication.username
            + `&token=` + context.propsValue.authentication.password,
            headers: {
                Accept: 'application/json'
            },
            body: {
                name: configsWithoutAuthentication['name'],
                desc: configsWithoutAuthentication['description'],
            },
            queryParams: {
            },
        };
        const response = await httpClient.sendRequest<TrelloCard>(request);

        return response.body
	},
});
