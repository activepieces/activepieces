
import { httpClient, HttpMethod, HttpRequest, QueryParams } from "@activepieces/pieces-common";
import { BigCommerceAuth } from "./auth";

/**
 * Returns the base URL for the BigCommerce API
 * @param storeHash The store hash from the API path
 */
export const getBigCommerceApiUrl = (storeHash: string): string => {
    return `https://api.bigcommerce.com/stores/${storeHash}`;
};


export interface BigCommerceCategory { id: number; name: string; }
export interface BigCommerceCustomer { id: number; first_name: string; last_name: string; email: string; }
export interface BigCommerceCountry { id: number; country: string; country_iso2: string; }
export interface BigCommerceState { id: number; state: string; state_abbreviation: string; }
export interface BigCommerceProduct { id: number; name: string; sku: string; type: 'physical' | 'digital'; price: number; weight: number; [key: string]: unknown; }
export interface BigCommerceAddress { id: number; customer_id: number; first_name: string; last_name: string; street_1: string; city: string; state_or_province: string; postal_code: string; country_code: string; [key: string]: unknown; }
export interface BigCommerceAbandonedCart { cart_id: string; customer_id: number; email: string; created_at: string; updated_at: string; [key: string]: unknown; }
export interface BigCommerceCart { id: string; customer_id: number; email: string; currency: { code: string }; created_time: string; line_items: { physical_items: unknown[]; digital_items: unknown[]; gift_certificates: unknown[]; custom_items: unknown[]; }; [key: string]: unknown; }
export interface BigCommerceOrder { id: number; customer_id: number; date_created: string; status_id: number; status: string; total_inc_tax: string; billing_address: Record<string, unknown>; [key: string]: unknown; }


export interface BigCommerceShipment {
    id: number; 
    order_id: number;
    customer_id: number;
    order_address_id: number;
    date_created: string; 
    tracking_number: string;
    shipping_provider: string;
    items: {
        order_product_id: number;
        product_id: number;
        quantity: number;
    }[];
    [key: string]: unknown; 
}


export class BigCommerceClient {
    private baseUrl: string;
    private headers: Record<string, string>;

    constructor(auth: BigCommerceAuth) {
        this.baseUrl = getBigCommerceApiUrl(auth.storeHash);
        this.headers = {
            'X-Auth-Token': auth.accessToken,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
    }

    async makeRequest<T>(
        method: HttpMethod,
        endpoint: string,
        body?: object,
        query?: QueryParams
    ): Promise<T> {
        const request: HttpRequest<object> = { method, url: `${this.baseUrl}${endpoint}`, body: body, queryParams: query, headers: this.headers, };
        const { body: responseBody } = await httpClient.sendRequest<T>(request);
        return responseBody;
    }
    async getCategories(): Promise<BigCommerceCategory[]> { try { const r = await this.makeRequest<{ data: BigCommerceCategory[] }>( HttpMethod.GET, '/v3/catalog/categories' ); return r.data; } catch (e) { console.error("Failed to fetch BigCommerce categories", e); return []; } }
    async getCustomers(limit = 250): Promise<BigCommerceCustomer[]> { try { const r = await this.makeRequest<{ data: BigCommerceCustomer[] }>( HttpMethod.GET, '/v3/customers', undefined, { limit: limit.toString() } ); return r.data; } catch (e) { console.error("Failed to fetch BigCommerce customers", e); return []; } }
    async getCountries(limit = 250): Promise<BigCommerceCountry[]> { try { const r = await this.makeRequest<{ data: BigCommerceCountry[] }>( HttpMethod.GET, '/v3/countries', undefined, { limit: limit.toString() } ); return r.data; } catch (e) { console.error("Failed to fetch BigCommerce countries", e); return []; } }
    async getStatesForCountry(countryId: number): Promise<BigCommerceState[]> { try { const r = await this.makeRequest<{ data: BigCommerceState[] }>( HttpMethod.GET, `/v3/countries/${countryId}/states` ); return r.data; } catch (e) { console.error(`Failed to fetch states for country ${countryId}`, e); return []; } }
    async getAbandonedCarts(query: QueryParams): Promise<BigCommerceAbandonedCart[]> { try { const r = await this.makeRequest<{ data: BigCommerceAbandonedCart[] }>( HttpMethod.GET, '/v3/abandoned-carts', undefined, query ); return r.data; } catch (e) { console.error("Failed to fetch abandoned carts", e); return []; } }
    async getCart(cartId: string): Promise<BigCommerceCart> { const r = await this.makeRequest<{ data: BigCommerceCart }>( HttpMethod.GET, `/v3/carts/${cartId}` ); return r.data; }
    async getCustomerById(customerId: number): Promise<BigCommerceCustomer> {
        const response = await this.makeRequest<{ data: BigCommerceCustomer[] }>( HttpMethod.GET, `/v3/customers?id:in=${customerId}` );
        if (response.data && response.data.length > 0) { return response.data[0]; } else { throw new Error(`Customer with ID ${customerId} not found.`); }
    }
    async getAddressById(customerId: number, addressId: number): Promise<BigCommerceAddress> {
        const response = await this.makeRequest<{ data: BigCommerceAddress[] }>( HttpMethod.GET, `/v3/customers/addresses?customer_id:in=${customerId}&id:in=${addressId}` );
        if (response.data && response.data.length > 0) { return response.data[0]; } else { throw new Error(`Address with ID ${addressId} for customer ${customerId} not found.`); }
    }
    async getOrderById(orderId: number): Promise<BigCommerceOrder> {
        return await this.makeRequest<BigCommerceOrder>( HttpMethod.GET, `/v2/orders/${orderId}` );
    }
    async getProductById(productId: number): Promise<BigCommerceProduct> {
        const response = await this.makeRequest<{ data: BigCommerceProduct }>( HttpMethod.GET, `/v3/catalog/products/${productId}` ); return response.data;
    }
    async getShipmentById(orderId: number, shipmentId: number): Promise<BigCommerceShipment> {
        return await this.makeRequest<BigCommerceShipment>(
            HttpMethod.GET,
            `/v2/orders/${orderId}/shipments/${shipmentId}`
        );
    }
}