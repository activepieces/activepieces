import { HttpMessageBody, HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common"
import { filter } from "lodash"

export interface Paging {
    items_per_page: number,
    current_page: number,
    count_pages: number,
    count_items: number
}

export interface Filter {}

export interface ListRequest<T extends Filter> {

    page?: number,
    filter?: T

}

// ======================================
// Customers
// ======================================
export interface Customer {
    id: number,
    name: string,
    number?: string,
    active: boolean,
    billable_default: boolean,
    note?: string,
    color: number
}

export interface CustomerCreateRequest {
    name: string,
    number?: string,
    active?: boolean,
    billable_default?: boolean,
    note?: string,
    color?: number
}

export interface CustomerUpdateRequest {
    name?: string,
    number?: string,
    active?: boolean,
    billable_default?: boolean,
    note?: string,
    color?: number
}

export interface CustomerListFilter extends Filter {
    active?: boolean
}

export interface CustomerListResponse {
    paging: Paging,
    customers: Customer[]
}

function prepareListRequest(request: ListRequest<any>): QueryParams {
    const params: QueryParams = {}
    if(request.page)
        params.page = request.page.toString()
    Object.keys(request.filter).forEach(k => {
        params['filter[' + k + ']'] = request.filter[k].toString()
    })
    return params
}

export class ClockodoClient {

    private clientIdentification: string
    private language: string = 'en'

    constructor(private email: string, private token: string, clientName: string, clientEmail: string) {
        this.clientIdentification = clientName + ';' + clientEmail
    }

    setLanguage(language: string) {
        this.language = language
    }

    async makeRequest<T extends HttpMessageBody>(method: HttpMethod, url: string, query?: QueryParams, body?: object): Promise<T> {
        const res = await httpClient.sendRequest<T>({
            method,
            url: 'https://my.clockodo.com/api' + url,
            queryParams: query,
            body,
            headers: {
                'X-ClockodoApiUser': this.email,
                'X-ClockodoApiKey': this.token,
                'X-Clockodo-External-Application': this.clientIdentification,
                'Accept-Language': this.language
            }
        })
        return res.body
    }

    async listCustomers(request: ListRequest<CustomerListFilter> = {}): Promise<CustomerListResponse> {
        const res = await this.makeRequest<CustomerListResponse>(HttpMethod.GET, '/api/v2/customers', prepareListRequest(request))
        return res
    }

}