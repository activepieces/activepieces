import { HttpMessageBody, HttpMethod, HttpResponse, httpClient } from "@activepieces/pieces-common"

export function getBaseUrl(shopName: string) {
    return `https://${shopName}.myshopify.com/admin/api/2023-10`
}

export function sendShopifyRequest(data: {
    url: string,
    method: HttpMethod,
    body?: any,
    queryParams?: any,
    auth: {
        shopName: string,
        adminToken: string
    }
}): Promise<HttpResponse<HttpMessageBody>> {
    return httpClient.sendRequest({
        url: `${getBaseUrl(data.auth.shopName)}${data.url}`,
        method: data.method,
        body: data.body,
        queryParams: data.queryParams,
        headers: {
            "X-Shopify-Access-Token": data.auth.adminToken
        },
    })
}