import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const mollieCommon = {
  baseUrl: 'https://api.mollie.com/v2',

  async makeRequest<T = any>(
    auth: string,
    method: HttpMethod,
    endpoint: string,
    body?: any,
    queryParams?: Record<string, any>
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
      queryParams,
    });
    return response.body;
  },

  async listResources<T = any>(
    auth: string,
    resource: string,
    queryParams?: Record<string, any>
  ): Promise<T> {
    return await this.makeRequest<T>(
      auth,
      HttpMethod.GET,
      `/${resource}`,
      undefined,
      queryParams
    );
  },

  async getResource<T = any>(
    auth: string,
    resource: string,
    resourceId: string
  ): Promise<T> {
    return await this.makeRequest<T>(
      auth,
      HttpMethod.GET,
      `/${resource}/${resourceId}`
    );
  },

  async createResource<T = any>(
    auth: string,
    resource: string,
    data: any
  ): Promise<T> {
    return await this.makeRequest<T>(
      auth,
      HttpMethod.POST,
      `/${resource}`,
      data
    );
  },

  async updateResource<T = any>(
    auth: string,
    resource: string,
    resourceId: string,
    data: any
  ): Promise<T> {
    return await this.makeRequest<T>(
      auth,
      HttpMethod.PATCH,
      `/${resource}/${resourceId}`,
      data
    );
  },

  async deleteResource<T = any>(
    auth: string,
    resource: string,
    resourceId: string
  ): Promise<T> {
    return await this.makeRequest<T>(
      auth,
      HttpMethod.DELETE,
      `/${resource}/${resourceId}`
    );
  },
};

export interface MolliePayment {
  id: string;
  mode: string;
  createdAt: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  method: string | null;
  metadata: Record<string, any>;
  status: string;
  isCancelable: boolean;
  expiresAt: string;
  profileId: string;
  sequenceType: string;
  redirectUrl: string;
  webhookUrl?: string;
  _links: {
    self: {
      href: string;
      type: string;
    };
    checkout?: {
      href: string;
      type: string;
    };
    dashboard?: {
      href: string;
      type: string;
    };
  };
}

export interface MollieCustomer {
  id: string;
  mode: string;
  name: string;
  email: string;
  locale?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  _links: {
    self: {
      href: string;
      type: string;
    };
    dashboard?: {
      href: string;
      type: string;
    };
  };
}

export interface MollieOrder {
  id: string;
  profileId: string;
  method?: string;
  mode: string;
  amount: {
    value: string;
    currency: string;
  };
  status: string;
  isCancelable: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt: string;
  lines: Array<{
    id: string;
    orderId: string;
    name: string;
    sku?: string;
    type: string;
    status: string;
    quantity: number;
    unitPrice: {
      value: string;
      currency: string;
    };
    totalAmount: {
      value: string;
      currency: string;
    };
  }>;
  billingAddress?: {
    streetAndNumber: string;
    postalCode: string;
    city: string;
    region?: string;
    country: string;
  };
  redirectUrl?: string;
  webhookUrl?: string;
  _links: {
    self: {
      href: string;
      type: string;
    };
    checkout?: {
      href: string;
      type: string;
    };
    dashboard?: {
      href: string;
      type: string;
    };
  };
}

export interface MollieRefund {
  id: string;
  amount: {
    value: string;
    currency: string;
  };
  status: string;
  createdAt: string;
  description?: string;
  metadata?: Record<string, any>;
  paymentId: string;
  settlementId?: string;
  settlementAmount?: {
    value: string;
    currency: string;
  };
  _links: {
    self: {
      href: string;
      type: string;
    };
    payment: {
      href: string;
      type: string;
    };
    settlement?: {
      href: string;
      type: string;
    };
  };
}
