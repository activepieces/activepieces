

import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";

export const uscreenApiUrl = 'https://api.uscreen.io/v1';

export const uscreenPublisherApiUrl = 'https://uscreen.io/publisher_api/v1';


export interface UscreenProduct {
    id: number;
    name: string;
}

export interface UscreenInvoice {
    id: string;
    title: string;
    total: string;
    amount: string;
    discount: string;
    offer_id: string;
    customer_name: string;
    customer_email: string;
    status: string;
    paid_at: string; 
    created_at: string;
    [key: string]: unknown;
}

export class UscreenClient {
    constructor(private apiKey: string) {}

    /**
     * Makes an authenticated request to the Uscreen PUBLISHER API.
     */
    async makeRequest<T>(method: HttpMethod, url: string, body?: object, query?: QueryParams): Promise<T> {
        const request: HttpRequest<object> = {
            method,
            url: `${uscreenPublisherApiUrl}${url}`,
            body: body,
            queryParams: query,
            headers: {
                "X-Store-Token": this.apiKey,
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        };
        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    /**
     * Fetches a paginated list of invoices, sorted by payment date.
     */
    async getInvoices(params: {
        sort_by: string,
        status: string,
        per_page?: number
    }): Promise<{ items: UscreenInvoice[] }> {
        
        const query: QueryParams = {
            sort_by: params.sort_by,
            status: params.status,
        };

        if (params.per_page !== undefined) {
            query['per_page'] = params.per_page.toString();
        }
        
        try {
            return await this.makeRequest<{ items: UscreenInvoice[] }>(
                HttpMethod.GET,
                '/invoices',
                undefined,
                query 
            );
        } catch (e) {
            console.error("Failed to fetch Uscreen invoices", e);
            return { items: [] };
        }
    }


    /**
     * Fetches a list of offers (subscriptions).
     */
    async getOffers(): Promise<UscreenProduct[]> {
        try {
            return await this.makeRequest<UscreenProduct[]>(
                HttpMethod.GET,
                '/offers'
            );
        } catch (e) {
            console.error("Failed to fetch Uscreen offers", e);
            return [];
        }
    }

    /**
     * Fetches a list of programs (bundles).
     */
    async getPrograms(): Promise<UscreenProduct[]> {
        try {
            return await this.makeRequest<UscreenProduct[]>(
                HttpMethod.GET,
                '/programs'
            );
        } catch (e) {
            console.error("Failed to fetch Uscreen programs", e);
            return [];
        }
    }

    async getCustomers() {
        try {
            return await this.makeRequest<{ id: number; email: string }[]>(
                HttpMethod.GET,
                '/customers'
            );
        } catch (e) {
            console.error("Failed to fetch Uscreen customers", e);
            return [];
        }
    }
}