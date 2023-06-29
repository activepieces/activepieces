import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export async function searchSupporter(propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${propsValue['baseUrl']}/integration/ext/v1/supporters/search`,
        headers: {
            'authToken': propsValue['authentication'] as string,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: {
            payload: propsValue
        },
    });

    return response.body.payload;
}

export async function upsertSupporter(propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${propsValue['baseUrl']}/integration/ext/v1/supporters`,
        headers: {
            'authToken': propsValue['authentication'] as string,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: {
            payload: {
                supporters: propsValue['supporters']
            }
        },
    });

    return response.body.payload;
}