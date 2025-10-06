import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export async function getAccountSubdomain(accessToken: string){
    const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: "https://workable.com/spi/v3/accounts",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
        }
    });

    return response.body[0]?.subdomain;
}