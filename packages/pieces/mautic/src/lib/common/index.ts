import { Property } from '@activepieces/pieces-framework';
import { getFields, markdownDescription } from "./helper";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";


export const mauticCommon= {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        description: markdownDescription,
        props: {
            base_url: Property.ShortText({
                displayName: 'Base URL',
                required: true,
            }),
            username: Property.ShortText({
                displayName: 'Username',
                required: true
            }),
            password: Property.SecretText({
                displayName: 'Password',
                required: true
            })
        },
        required: true
    }),
    contactFields: getFields("contact"),
    companyFields: getFields("company"),
    id: Property.ShortText({
        displayName: 'Id of the entity',
        required: true,
    }),
};

export const searchEntity = async (
    url: string,
    searchParams: string,
    username: string,
    password: string
) => {
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${url}${searchParams}`,
        headers: {
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
                'base64'
            )}`,
            'Content-Type': 'application/json',
        },
    };
    const response: Record<string, any> = await httpClient.sendRequest(
        request
    );
    const length = response.body.total;
    if (!length || length != 1)
        throw Error(
            'The query is not perfect enough to get single result. Please refine'
        );
    return response;
};
