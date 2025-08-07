import {
    AuthenticationType,
    httpClient,
    HttpError,
    HttpMessageBody,
    HttpMethod,
    HttpRequest,
} from '@activepieces/pieces-common';
import { GetField, PaginatedResponse, RequestParams } from './types'; // Assuming RequestParams is Record<string, any> or similar
import { isNil } from '@activepieces/shared';
type FlexibleQueryParams = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

export const pipedriveCommon = {
    /**
     * Subscribes to a Pipedrive webhook for v2 events.
     * @param object The event object (e.g., 'deal', 'person').
     * @param action The event action (e.g., 'added', 'updated').
     * @param webhookUrl The URL where webhook events will be sent.
     * @param apiDomain The Pipedrive API domain.
     * @param accessToken The Pipedrive access token.
     * @returns The created webhook data.
     */
    subscribeWebhook: async (
        object: string,
        action: string,
        webhookUrl: string,
        apiDomain: string,
        accessToken: string,
    ) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${apiDomain}/api/v2/webhooks`, // ✅ Updated to v2 endpoint
            body: {
                event_object: object,
                event_action: action,
                subscription_url: webhookUrl,
                version: '2.0', // ✅ Set webhook version to 2.0
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            queryParams: {}, // Still fine as empty initially
        };

        const { body: webhook } = await httpClient.sendRequest<{
            data: { id: string }; // Webhook ID is a string (UUID) in Pipedrive v2
        }>(request);
        return webhook;
    },

    /**
     * Unsubscribes from a Pipedrive webhook.
     * @param webhookId The ID of the webhook to unsubscribe.
     * @param apiDomain The Pipedrive API domain.
     * @param accessToken The Pipedrive access token.
     * @returns The response from the unsubscribe request.
     */
    unsubscribeWebhook: async (webhookId: string, apiDomain: string, accessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${apiDomain}/api/v2/webhooks/${webhookId}`, // ✅ Updated to v2 endpoint
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
    resourceUri: string; // Expected to contain the /v2/ prefix already, e.g., '/v2/deals'
    query?: RequestParams; // RequestParams is typically Record<string, any>
    body?: any;
};

/**
 * Makes a single API call to Pipedrive.
 * @param params The parameters for the API call.
 * @returns The response body.
 */
export async function pipedriveApiCall<T extends HttpMessageBody>({
    accessToken,
    apiDomain,
    method,
    resourceUri,
    query,
    body,
}: PipedriveApiCallParams): Promise<T> {
    const url = `${apiDomain}/api${resourceUri}`; // ✅ Construct URL directly from apiDomain and resourceUri

    // FIX: Use FlexibleQueryParams for internal construction, then convert values to string
    const qs: Record<string, string> = {}; // Final query params must be string values
    if (query) {
        for (const [key, value] of Object.entries(query)) {
            if (value !== null && value !== undefined) {
                // Handle arrays by joining them with a comma, otherwise convert to string
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
        queryParams: qs, // This is now Record<string, string>
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

/**
 * Makes paginated API calls to Pipedrive using cursor-based pagination (v2).
 * @param params The parameters for the API call.
 * @returns An array of all fetched data.
 */
export async function pipedrivePaginatedApiCall<T extends HttpMessageBody>({
    accessToken,
    apiDomain,
    method,
    resourceUri,
    query,
    body,
}: PipedriveApiCallParams): Promise<T[]> {
    // FIX: Use FlexibleQueryParams for initial query parameters to allow numbers/undefined
    const qs: FlexibleQueryParams = query ? { ...query } : {}; // Create a mutable copy of query params

    // Pipedrive v2 uses cursor-based pagination
    let cursor: string | undefined = undefined;
    const resultData: T[] = [];
    let hasMoreItems = true;

    do {
        // FIX: Use FlexibleQueryParams for currentQuery
        const currentQuery: FlexibleQueryParams = { ...qs }; // Copy query params for each request
        if (cursor) {
            currentQuery.cursor = cursor; // Add cursor for subsequent requests
        }
        currentQuery.limit = 500; // Max limit for pagination

        const response = await pipedriveApiCall<PaginatedResponse<T>>({
            accessToken,
            apiDomain,
            method,
            resourceUri, // resourceUri is expected to already include the /v2/ prefix
            query: currentQuery as RequestParams, // Cast to RequestParams (assuming it's compatible with FlexibleQueryParams)
            body,
        });

        if (isNil(response.data)) {
            break;
        }

        // Ensure response.data is an array before pushing
        if (Array.isArray(response.data)) {
            resultData.push(...response.data);
        } else {
            // Handle cases where data might not be an array (e.g., single object response, though less common for paginated calls)
            resultData.push(response.data);
        }

        // Update pagination state for the next iteration
        hasMoreItems = response.additional_data?.pagination?.more_items_in_collection ?? false;
        cursor = response.additional_data?.pagination?.next_cursor; // Get next cursor

    } while (hasMoreItems && cursor); // Continue if more items and a valid cursor exist

    return resultData;
}

/**
 * Transforms Pipedrive custom fields from their API key format to human-readable names
 * and handles v2 nested structures.
 * @param customFieldsDefinitions An array of custom field definitions (from /v2/entityFields).
 * @param responseData The raw response data from a Pipedrive entity (e.g., deal, person).
 * @returns The transformed response data with human-readable custom field names.
 */
export function pipedriveTransformCustomFields(
    customFieldsDefinitions: GetField[],
    responseData: Record<string, any>, // Use Record<string, any> to allow dynamic indexing
): Record<string, any> {
    const updatedResponseData = { ...responseData };

    // In v2, custom fields are nested under 'custom_fields'
    const rawCustomFields = responseData.custom_fields || {};

    // Iterate through the custom field definitions to map and transform values
    for (const field of customFieldsDefinitions) {
        if (!field.edit_flag) { // Only process editable fields
            continue;
        }

        const oldKey = field.key;
        const newKey = field.name;
        const fieldType = field.field_type;

        // Check if the custom field exists in the rawCustomFields object from the response
        if (oldKey in rawCustomFields) {
            const value = rawCustomFields[oldKey];

            if (isNil(value)) {
                updatedResponseData[newKey] = null;
            } else if (fieldType === 'enum') {
                // For 'enum' (single option), value is a number (option ID) in v2
                updatedResponseData[newKey] =
                    field.options?.find((option) => option.id === value)?.label || null; // Match by numeric ID
            } else if (fieldType === 'set') {
                // For 'set' (multiple options), value is an array of numbers (option IDs) in v2
                if (Array.isArray(value)) {
                    updatedResponseData[newKey] = value.map(
                        (item) => field.options?.find((option) => option.id === item)?.label || null, // Match by numeric ID
                    );
                } else {
                    // Fallback for unexpected non-array 'set' values
                    updatedResponseData[newKey] = value;
                }
            } else if (fieldType === 'monetary') {
                // For 'monetary' (currency) fields, value is an object { value: number, currency: string } in v2
                if (typeof value === 'object' && value !== null && 'value' in value && 'currency' in value) {
                    updatedResponseData[newKey] = `${value.value} ${value.currency}`; // Format as "amount CURRENCY"
                } else {
                    updatedResponseData[newKey] = value; // Keep raw if unexpected format
                }
            } else if (fieldType === 'address') {
                // For 'address' fields, value is an object with address components in v2
                if (typeof value === 'object' && value !== null && 'formatted_address' in value) {
                    updatedResponseData[newKey] = value.formatted_address; // Use formatted address
                } else {
                    updatedResponseData[newKey] = value; // Keep raw if unexpected format
                }
            }
            else {
                // For other types (text, numeric, date, time), the value is direct
                updatedResponseData[newKey] = value;
            }
        }
    }

    // Remove the original custom_fields object from the root of the response,
    // as its contents have been mapped and spread to human-readable keys.
    delete updatedResponseData.custom_fields;

    return updatedResponseData;
}