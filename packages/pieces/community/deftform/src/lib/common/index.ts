import {
    httpClient,
    HttpMethod,
    AuthenticationType,
    HttpMessageBody,
    HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { deftformAuth } from '../auth';

const BASE_URL = 'https://deftform.com/api/v1';

export async function deftformApiCall<T extends HttpMessageBody>({
    token,
    method,
    path,
    body,
    queryParams,
}: {
    token: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token,
        },
        queryParams,
        body,
    });
}

export function flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        const flatKey = prefix ? `${prefix}_${key}` : key;

        if (value === null || value === undefined) {
            result[flatKey] = null;
        } else if (Array.isArray(value)) {
            result[flatKey] = value
                .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
                .join(', ');
        } else if (typeof value === 'object') {
            Object.assign(result, flattenObject(value as Record<string, unknown>, flatKey));
        } else {
            result[flatKey] = value;
        }
    }

    return result;
}

export const DeftformCommon = {
    formDropdown: Property.Dropdown({
        displayName: 'Form',
        description: 'Select the form to use',
        refreshers: [],
        required: true,
        auth: deftformAuth,
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, options: [], placeholder: 'Please connect your account first' };
            }
            try {
                const response = await deftformApiCall<{ data: { id: string; name: string }[] }>({
                    token: auth as unknown as string,
                    method: HttpMethod.GET,
                    path: '/forms',
                });
                return {
                    disabled: false,
                    options: response.body.data.map((f) => ({
                        label: f.name,
                        value: f.id,
                    })),
                };
            } catch (error) {
                return { disabled: true, options: [], placeholder: 'Failed to load forms. Check your connection.' };
            }
        },
    }),
};
