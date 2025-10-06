// src/lib/common/client.ts

import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";
import { simplybookMeApiUrl, SimplybookMeAuthData } from "./auth";

export interface SimplybookMeService {
    id: string;
    name: string;
}

export interface SimplybookMeBooking {
    id: string;
    hash: string;
    client: {
        name: string;
    };
    start_datetime: string;
    payment?: {
        amount: string;
        status: string;
    };
    status?: string;
}

export interface SimplybookMeAdditionalField {
    id: number;
    name: string;
    title: string; // Assuming title exists for display name
    type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'digits' | 'date' | 'time';
}

export interface SimplybookMeUnit {
    id: string;
    name: string;
}

export interface SimplybookMeClientInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
}

export class SimplybookMeClient {
    constructor(private auth: SimplybookMeAuthData) {}

    async makeRequest<T>(method: HttpMethod, url: string, body?: object, query?: Record<string, string>): Promise<T> {
        const request: HttpRequest<object> = {
            method,
            url: `${simplybookMeApiUrl}${url}`,
            body,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                'X-Company-Login': this.auth.company_login,
                'X-Token': this.auth.token 
            },
            queryParams: query,
        };
        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }

    async getServices(): Promise<SimplybookMeService[]> {
        const response = await this.makeRequest<{ data: SimplybookMeService[] }>( HttpMethod.GET, '/admin/services' );
        return response.data;
    }

    async getAdditionalFields(serviceId: string): Promise<SimplybookMeAdditionalField[]> {
        const response = await this.makeRequest<{ data: SimplybookMeAdditionalField[] }>(
            HttpMethod.GET,
            '/admin/additional-fields',
            undefined,
            { 'filter[service_id]': serviceId }
        );
        return response.data;
    }

    async findBookingsRpc(filters: Record<string, unknown>): Promise<SimplybookMeBooking[]> {
        const response = await this.makeRpcRequest('getBookings', [filters]);
        return response.result as SimplybookMeBooking[];
    }

    async makeRpcRequest(method: string, params: (string | number | object | boolean | null)[]) {
        const request: HttpRequest<object> = {
            method: HttpMethod.POST,
            url: `https://user-api.simplybook.me/admin`, 
            body: { jsonrpc: "2.0", method: method, params: params, id: 1 },
            headers: {
                "Content-Type": "application/json",
                'X-Company-Login': this.auth.company_login,
                'X-Token': this.auth.token 
            },
        };
        const { body } = await httpClient.sendRequest(request);
        if (body && (body as { error?: unknown }).error) {
            throw new Error(JSON.stringify((body as { error: unknown }).error));
        }
        return body;
    }

    async getBookings(filters: { serviceId?: string, unitId?: string, startDate?: string, endDate?: string } = {}): Promise<SimplybookMeBooking[]> { 
        const queryParams: Record<string, string> = {};
        if (filters.serviceId) queryParams['filter[service_id]'] = filters.serviceId;
        if (filters.unitId) queryParams['filter[unit_id]'] = filters.unitId;
        if (filters.startDate) queryParams['filter[start_date_time]'] = filters.startDate;
        if (filters.endDate) queryParams['filter[end_date_time]'] = filters.endDate;
        const response = await this.makeRequest<{ data: SimplybookMeBooking[] }>( HttpMethod.GET, '/admin/bookings', undefined, queryParams );
        return response.data;
    }

    async getUnits(): Promise<SimplybookMeUnit[]> {
        const response = await this.makeRpcRequest('getUnitList', []);
        return response.result as SimplybookMeUnit[];
    }

    async getStartTimeMatrix(eventId: string, unitId: string, date: string): Promise<Record<string, string[]>> {
        const response = await this.makeRpcRequest('getStartTimeMatrix', [ date, date, eventId, unitId, 1 ]);
        return response.result as Record<string, string[]>;
    }

    async getClients(): Promise<SimplybookMeClientInfo[]> {
        const response = await this.makeRpcRequest('getClientList', ['', null]);
        const clientsObject = response.result as Record<string, SimplybookMeClientInfo>;
        return Object.values(clientsObject);
    }
    
    async findClients(searchString: string, limit: number | null): Promise<SimplybookMeClientInfo[]> {
        const response = await this.makeRpcRequest('getClientList', [searchString, limit]);
        const clientsObject = response.result as Record<string, SimplybookMeClientInfo>;
        return Object.values(clientsObject);
    }
}