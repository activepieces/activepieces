import {
    AuthenticationType,
    httpClient,
    HttpError,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
} from '@activepieces/pieces-common';
import { GetField, PaginatedResponse, RequestParams } from './types'; 
import { isNil } from '@activepieces/shared';
type FlexibleQueryParams = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

export const pipedriveCommon = {
    subscribeWebhook: async (
        object: string,
        action: string,
        webhookUrl: string,
        apiDomain: string,
        accessToken: string,
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${apiDomain}/api/v2/webhooks`,
            body: {
                event_object: object,
                event_action: action,
                subscription_url: webhookUrl,
                version: '2.0', 
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            queryParams: {}, 
        };

        const { body: webhook } = await httpClient.sendRequest<{
            data: { id: string }; 
        }>(request);
        return webhook;
    },

    unsubscribeWebhook: async (webhookId: string, apiDomain: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${apiDomain}/api/v2/webhooks/${webhookId}`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
        };
        return await httpClient.sendRequest(request);
    },
};

export type PipedriveApiCallParams = {
    accessToken: string;
    apiDomain: string;
    method: HttpMethod;
    resourceUri: string; 
    query?: RequestParams; 
    body?: any;
};


export async function pipedriveApiCall<T extends HttpMessageBody>({
    accessToken,
    apiDomain,
    method,
    resourceUri,
    query,
    body,
}: PipedriveApiCallParams): Promise<T> {
    const url = `${apiDomain}/api${resourceUri}`;

    
    const qs: Record<string, string> = {}; 
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined) {
                qs[key] = Array.isArray(value) ? value.map(String).join(',') : String(value);
            }
        }
    }

    let requestBody: any;
    if (body) {
        requestBody = Object.entries(body).reduce((acc, [key, value]) => {
            if (!isNil(value)) {
                acc[key] = value;
            }
            return acc;
        }, {} as Record<string, any>);
    }

    const request: HttpRequest = {
        method,
        url,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: accessToken,
        },
        queryParams: qs, 
        body: requestBody,
    };

    try {
        const response = await httpClient.sendRequest<T>(request);
        return response.body;
    } catch (error) {
        if (error instanceof HttpError) {
            if (error.response.status === 403) {
                throw new Error('Please reconnect your Pipedrive account.');
            }
        }
        throw error;
    }
}


export async function pipedrivePaginatedApiCall<T extends HttpMessageBody>({
    accessToken,
    apiDomain,
    method,
    resourceUri,
    query,
    body,
}: PipedriveApiCallParams): Promise<T[]> {
   
    const qs: FlexibleQueryParams = query ? { ...query } : {}; 

    
    let cursor: string | undefined = undefined;
    const resultData: T[] = [];
    let hasMoreItems = true;

    do {
        
        const currentQuery: FlexibleQueryParams = { ...qs }; 
        if (cursor) {
            currentQuery.cursor = cursor;
        }
        currentQuery.limit = 100; 

        const response = await pipedriveApiCall<PaginatedResponse<T>>({
            accessToken,
            apiDomain,
            method,
            resourceUri, 
            query: currentQuery as RequestParams, 
            body,
        });

        if (isNil(response.data)) {
            break;
        }

      
        if (Array.isArray(response.data)) {
            resultData.push(...response.data);
        } else {
            
            resultData.push(response.data);
        }

        
        hasMoreItems = response.additional_data?.pagination?.more_items_in_collection ?? false;
        cursor = response.additional_data?.pagination?.next_cursor; // Get next cursor

    } while (hasMoreItems && cursor); // Continue if more items and a valid cursor exist

    return resultData;
}


export function pipedriveTransformCustomFields(
    customFieldsDefinitions: GetField[],
    responseData: Record<string, any>, // Use Record<string, any> to allow dynamic indexing
): Record<string, any> {
    const updatedResponseData = { ...responseData };

    
    const rawCustomFields = responseData.custom_fields || {};

    
    for (const field of customFieldsDefinitions) {
        if (!field.edit_flag) { 
            continue;
        }

        const oldKey = field.key;
        const newKey = field.name;
        const fieldType = field.field_type;

        
        if (oldKey in rawCustomFields) {
            const value = rawCustomFields[oldKey];

            if (isNil(value)) {
                updatedResponseData[newKey] = null;
            } else if (fieldType === 'enum') {
                
                updatedResponseData[newKey] =
                    field.options?.find((option) => option.id === value)?.label || null; 
            } else if (fieldType === 'set') {
                
                if (Array.isArray(value)) {
                    updatedResponseData[newKey] = value.map(
                        (item) => field.options?.find((option) => option.id === item)?.label || null, 
                    );
                } else {
                    
                    updatedResponseData[newKey] = value;
                }
            } else if (fieldType === 'monetary') {
                
                if (typeof value === 'object' && value !== null && 'value' in value && 'currency' in value) {
                    updatedResponseData[newKey] = `${value.value} ${value.currency}`; 
                } else {
                    updatedResponseData[newKey] = value; 
                }
            } else if (fieldType === 'address') {
                
                if (typeof value === 'object' && value !== null && 'formatted_address' in value) {
                    updatedResponseData[newKey] = value.formatted_address; 
                } else {
                    updatedResponseData[newKey] = value; 
                }
            }
            else {
                // For other types (text, numeric, date, time), the value is direct
                updatedResponseData[newKey] = value;
            }
        }
    }

    
    delete updatedResponseData.custom_fields;

    return updatedResponseData;
}