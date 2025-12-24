import { HttpMethod } from '@activepieces/pieces-common';
export declare function callFiservApi<T = any>(method: HttpMethod, auth: any, endpoint: string, body?: any): Promise<{
    body: T;
}>;
