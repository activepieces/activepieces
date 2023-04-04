import { AuthenticationType, httpClient, HttpMessageBody, HttpMethod, HttpResponse, OAuth2PropertyValue, Property } from "@activepieces/framework";


export const salesforcesCommon = {
    authentication: Property.OAuth2({
        displayName: "Authentication",
        required: true,
        description: "Authenticate with Salesforce Production",
        authUrl: "https://login.salesforce.com/services/oauth2/authorize",
        tokenUrl: "https://login.salesforce.com/services/oauth2/token",
        scope: ["refresh_token+full"],
    }),
    object: Property.Dropdown<string>({
        displayName: "Objects",
        required: true,
        description: "Select the Object",
        refreshers: ['authentication'],
        options: async (value) => {
            if(value['authentication'] === undefined){
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                }
            }   
            const options = await getSalesforceObjects(value['authentication'] as OAuth2PropertyValue);
            return {
                disabled: false,
                options: options.body['sobjects'].map((object: any) => {
                    return {
                        label: object.label,
                        value: object.name
                    }
                }).sort((a: {label: string}, b: {label: string}) => a.label.localeCompare(b.label))
                .filter((object: {label: string}) => !object.label.startsWith("_"))
            }
        }
    }),
    field: Property.Dropdown<string>({
        displayName: "Field",
        description: "Select the Field",
        required: true,
        refreshers: ['authentication', 'object'],
        options: async (value) => {
            if(value['authentication'] === undefined || !value['object']){
                return {
                    disabled: true,
                    placeholder: 'connect your account first',
                    options: [],
                }
            }   
            const options = await getSalesforceFields(value['authentication'] as OAuth2PropertyValue, value['object'] as string);
            return {
                disabled: false,
                options: options.body['fields'].map((field: any) => {
                    return {
                        label: field.label,
                        value: field.name
                    }
                })
            }
        }
    })
}


export async function querySalesforceApi<T extends HttpMessageBody>(method: HttpMethod,
    authentication: OAuth2PropertyValue, 
    query: string): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
        method: method,
        url: `${authentication.data['instance_url']}/services/data/v56.0/query`,
        queryParams: {
            q: query
        },
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authentication['access_token']
        }
    });
}

async function getSalesforceObjects(authentication: OAuth2PropertyValue): Promise<HttpResponse<HttpMessageBody>> {
    return await httpClient.sendRequest<HttpMessageBody>({
        method: HttpMethod.GET,
        url: `${authentication.data['instance_url']}/services/data/v56.0/sobjects`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authentication['access_token']
        }
    });
}
// Write function to list all fields name inside salesforce object
async function getSalesforceFields(authentication: OAuth2PropertyValue, object: string): Promise<HttpResponse<HttpMessageBody>> {
    return await httpClient.sendRequest<HttpMessageBody>({
        method: HttpMethod.GET,
        url: `${authentication.data['instance_url']}/services/data/v56.0/sobjects/${object}/describe`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: authentication['access_token']
        }
    });
}