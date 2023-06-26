import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { salsaCommon } from "../common/common";

export async function upsertOfflineDonation(propsValue: Record<string, unknown>): Promise<Record<string, unknown>> {    
    const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${salsaCommon.baseUrl}/integration/ext/v1/offlineDonations`,
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