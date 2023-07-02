import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export async function upsertOfflineDonation(propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${propsValue['baseUrl']}/integration/ext/v1/offlineDonations`,
        headers: {
            'authToken': propsValue['authentication'] as string,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: {
            payload: {
                donations: propsValue['donations']
            }
        },
    });

    return response.body.payload;
}