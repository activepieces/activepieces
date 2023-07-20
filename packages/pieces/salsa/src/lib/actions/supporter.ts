import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export async function searchSupporter(auth: string, propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${propsValue['baseUrl']}/integration/ext/v1/supporters/search`,
        headers: {
            'authToken': auth as string,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: {
            payload: propsValue
        },
    });

    return response.body.payload;
}

export async function upsertSupporter(auth: string, propsValue: {
    baseUrl: string,
    supporters: unknown
}): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${propsValue['baseUrl']}/integration/ext/v1/supporters`,
        headers: {
            'authToken': auth as string,
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