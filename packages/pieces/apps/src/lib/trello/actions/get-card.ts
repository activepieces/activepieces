import { createAction, httpClient, HttpRequest, HttpMethod, Property } from '@activepieces/framework';
import { trelloCommon } from '../common';
import { TrelloCard } from '../common/props/card';

export const getCard = createAction({
	name: 'get_card',
    displayName:'Get Card',
    description: 'Get a card in Trello',
	props: {
        authentication: trelloCommon.authentication,
        cardId: Property.ShortText({
			description: 'The card ID',
			displayName: 'Card ID',
			required: true,
		}),
	},

	async run(context) {
        const configsWithoutAuthentication: Record<string, unknown> = { ...context.propsValue };
        delete configsWithoutAuthentication['authentication'];

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${trelloCommon.baseUrl}cards/` + 
            configsWithoutAuthentication['cardId']
            + `?key=` + context.propsValue.authentication.username
            + `&token=` + context.propsValue.authentication.password,
            headers: {
                Accept: 'application/json'
            },
            body: {},
            queryParams: {},
        };
        const response = await httpClient.sendRequest<TrelloCard>(request);

        return {
            'response': response.body
        }
	},
});
