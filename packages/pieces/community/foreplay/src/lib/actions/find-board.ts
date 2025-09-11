import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { foreplayAuth } from '../common/auth';
import { foreplayCommon } from '../common/props';

export const findBoard = createAction({
    auth: foreplayAuth,
    name: 'find_board',
    displayName: 'Find Board',
    description: 'Finds a board from a dynamic list of all your boards.',
    props: {
        board_id: foreplayCommon.board_id(foreplayAuth),
    },
    async run(context) {
        const { apiKey } = context.auth;
        const boardId = context.propsValue.board_id;


        const response = await httpClient.sendRequest<any>({
            method: HttpMethod.GET,
            url: `https://public.api.foreplay.co/api/boards`,
            headers: {
                'Authorization': apiKey
            }
        });

        const allBoards = response.body['data'] || [];
        const foundBoard = allBoards.find((board: { id: string }) => board.id === boardId);

        return foundBoard || {};
    },
});