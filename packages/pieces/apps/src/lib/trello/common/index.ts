import { BasicAuthentication, BasicAuthProperty, BasicAuthPropertyValue, httpClient, HttpMethod, HttpRequest, Property } from "@activepieces/framework"
import { callClickUpApi } from "../../clickup/common";
import { TrelloCard } from "./props/card";

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
    }),
    boards: Property.Dropdown({
        displayName: 'Boards',
        description: 'List of boards',
        required: true,
        refreshers: ['authentication'],
        options: async (propsValue) => {
            if (propsValue['authentication'] === undefined) {
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                };
            }

            const basicAuthProperty = propsValue['authentication'] as BasicAuthPropertyValue;
            const user = await getauthoriseduser(basicAuthProperty.username, basicAuthProperty.password);
            const boards = await listBoards(basicAuthProperty.username, basicAuthProperty.password, user.id);
        
            return boards.map((board: { id: any; name: any; }) => ({
            value: board.id,
            label: board.name,
            }));
        }
    })
}

async function getauthoriseduser(apikey: string, token: string) {
    
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}members/me`
        + `?key=` + apikey
        + `&token=` + token,
        headers: {
            Accept: 'application/json'
        },
        body: {},
        queryParams: {},
    };
    const response = await httpClient.sendRequest(request);

    return response.body;
}

async function getBoardList(apikey: string, token: string) {
    const user = await getauthoriseduser(apikey, token);
    const boards = await listBoards(apikey, token, user.id);
  
    return boards.map((board: { id: any; name: any; }) => ({
      value: board.id,
      label: board.name,
    }));
  }

async function listBoards(apikey: string, token: string, user_id: string) {
    
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}members/${user_id}/boards`
        + `?key=` + apikey
        + `&token=` + token,
        headers: {
            Accept: 'application/json'
        },
        body: {},
        queryParams: {},
    };
    const response = await httpClient.sendRequest(request);

    return response.body;
}

async function listBoardLists(apikey: string, token: string, board_id: string) {
    
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}boards/${board_id}/lists`
        + `?key=` + apikey
        + `&token=` + token,
        headers: {
            Accept: 'application/json'
        },
        body: {},
        queryParams: {},
    };
    const response = await httpClient.sendRequest(request);

    return response.body;
}