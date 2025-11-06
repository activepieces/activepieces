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
    console.log("this is response" + response.body.accounts[0].subdomain);

    return response.body.accounts[0]?.subdomain;
}