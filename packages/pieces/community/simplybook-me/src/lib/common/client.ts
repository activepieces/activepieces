import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import {
  Booking,
  Client,
  Comment,
  CreateBookingDto,
  CreateClientDto,
  Invoice,
  Note,
  NoteDto,
  BookingQuery,
  ClientQuery,
  InvoiceQuery,
  ListParams,
  ListResult,
  ReportParams,
  ReportResult,
  EventList,
  WebhookSubscription,
  SimplyBookError,
  NotSupportedError,
  BookingSchema,
  ClientSchema,
  CommentSchema,
  NoteSchema,
  InvoiceSchema,
  EventListSchema,
} from './types';

export interface SimplyBookClientOptions {
  companyLogin: string;
  apiKey: string;
  baseUrl?: string;
}

export class SimplyBookClient {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private readonly companyLogin: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: SimplyBookClientOptions) {
    this.companyLogin = options.companyLogin;
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://user-api.simplybook.me';
  }

  private async ensureAuthenticated(): Promise<void> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return;
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.baseUrl}/login`,
        body: {
          jsonrpc: '2.0',
          method: 'getToken',
          params: [this.companyLogin, this.apiKey],
          id: 1,
        },
      };

      const response = await httpClient.sendRequest(request);

      if (response.body.error) {
        throw new SimplyBookError(
          response.body.error.message || 'Authentication failed',
          401,
          'AUTH_ERROR'
        );
      }

      this.token = response.body.result;
      this.tokenExpiry = Date.now() + 3600000;
    } catch (error) {
      if (error instanceof SimplyBookError) {
        throw error;
      }
      throw new SimplyBookError(
        'Failed to authenticate with SimplyBook.me API',
        401
      );
    }
  }

  private async makeRequest<T>(
    method: string,
    params: any[] = [],
    retryCount = 0
  ): Promise<T> {
    await this.ensureAuthenticated();

    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${this.baseUrl}/`,
        body: {
          jsonrpc: '2.0',
          method,
          params,
          id: Date.now(),
        },
        headers: {
          'X-Company-Login': this.companyLogin,
          'X-Token': this.token!,
          'Content-Type': 'application/json',
        },
      };

      const response = await httpClient.sendRequest(request);

      if (response.body.error) {
        throw new SimplyBookError(
          response.body.error.message || 'API request failed',
          response.status,
          response.body.error.code
        );
      }

      return response.body.result;
    } catch (error: any) {
      if (error.response?.status === 401 && retryCount < 2) {
        this.token = null;
        this.tokenExpiry = 0;
        return this.makeRequest<T>(method, params, retryCount + 1);
      }
      throw this.handleError(error);
    }
  }

  private handleError(error: any): SimplyBookError {
    if (error.response) {
      const status = error.response.status;
      let message = 'API request failed';

      switch (status) {
        case 401:
          message = 'Invalid API key or authentication failed';
          break;
        case 403:
          message = 'Insufficient permissions';
          break;
        case 404:
          message = 'Resource not found';
          break;
        case 422:
          message = 'Validation error';
          break;
        case 429:
          message = 'Rate limit exceeded';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = 'Server error, please try again later';
          break;
      }

      return new SimplyBookError(message, status);
    }

    if (error.code === 'ECONNABORTED') {
      return new SimplyBookError('Request timeout', 408);
    }

    return new SimplyBookError('Network error occurred');
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxAttempts = 3,
    baseDelay = 500
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (error instanceof SimplyBookError) {
          if (
            error.statusCode &&
            error.statusCode >= 400 &&
            error.statusCode < 500 &&
            error.statusCode !== 429
          ) {
            throw error;
          }
        }

        if (attempt === maxAttempts) {
          break;
        }

        const delay =
          baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  async createBooking(payload: CreateBookingDto): Promise<Booking> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('makeBooking', [
        payload.service_id,
        payload.provider_id,
        payload.client_id,
        payload.start_date_time,
        payload.notes || '',
      ]);
      return BookingSchema.parse(result);
    });
  }

  async cancelBooking(
    bookingId: string,
    opts?: { reason?: string }
  ): Promise<void> {
    return this.retryWithBackoff(async () => {
      await this.makeRequest('cancelBooking', [bookingId, opts?.reason || '']);
    });
  }

  async addBookingComment(
    bookingId: string,
    comment: string
  ): Promise<Comment> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('addBookingComment', [
        bookingId,
        comment,
      ]);
      return CommentSchema.parse(result);
    });
  }

  async createClient(payload: CreateClientDto): Promise<Client> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('addClient', [
        payload.name,
        payload.email,
        payload.phone || '',
      ]);
      return ClientSchema.parse(result);
    });
  }

  async deleteClient(clientId: string): Promise<void> {
    return this.retryWithBackoff(async () => {
      await this.makeRequest('deleteClient', [clientId]);
    });
  }

  async createReport(params: ReportParams): Promise<ReportResult> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('generateReport', [
        params.type,
        params.start_date,
        params.end_date,
      ]);
      return {
        data: result,
        generated_at: new Date().toISOString(),
      };
    });
  }

  async createNote(payload: NoteDto): Promise<Note> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('addNote', [payload.text]);
      return NoteSchema.parse(result);
    });
  }

  async findBooking(query: BookingQuery): Promise<Booking[]> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getBookings', [query]);
      return result.map((booking) => BookingSchema.parse(booking));
    });
  }

  async findClient(query: ClientQuery): Promise<Client[]> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getClients', [query]);
      return result.map((client) => ClientSchema.parse(client));
    });
  }

  async findInvoice(query: InvoiceQuery): Promise<Invoice | null> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('getInvoice', [query]);
      return result ? InvoiceSchema.parse(result) : null;
    });
  }

  async listBookings(params?: ListParams): Promise<ListResult<Booking>> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('getBookingsList', [
        params?.page || 1,
        params?.limit || 50,
      ]);
      return {
        data: result.data.map((booking: any) => BookingSchema.parse(booking)),
        total: result.total,
        page: params?.page || 1,
        limit: params?.limit || 50,
      };
    });
  }

  async subscribeWebhook(
    callbackUrl: string,
    events: string[]
  ): Promise<WebhookSubscription> {
    throw new NotSupportedError(
      'Webhook subscription not supported - using polling fallback'
    );
  }

  async unsubscribeWebhook(subscriptionId: string): Promise<void> {
    throw new NotSupportedError('Webhook unsubscription not supported');
  }

  async listEvents(since?: string, page?: number): Promise<EventList> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any>('getEventList', [
        since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        page || 1,
      ]);
      return EventListSchema.parse(result);
    });
  }

  async uploadFile(
    fileBase64?: string,
    filePath?: string
  ): Promise<{ fileId: string; url: string }> {
    throw new NotSupportedError(
      'File upload not yet implemented - requires API endpoint confirmation'
    );
  }

  async getServices(): Promise<
    Array<{ id: string; name: string; duration: number }>
  > {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getUnitList', []);
      return result.map((service) => ({
        id: service.id.toString(),
        name: service.name,
        duration: service.duration || 60,
      }));
    });
  }

  async getProviders(): Promise<Array<{ id: string; name: string }>> {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getWorkDaysList', []);
      return result.map((provider) => ({
        id: provider.id.toString(),
        name: provider.name,
      }));
    });
  }

  async getClients(): Promise<
    Array<{ id: string; name: string; email: string }>
  > {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getClientList', []);
      return result.map((client) => ({
        id: client.id.toString(),
        name: client.name,
        email: client.email,
      }));
    });
  }

  async getBookings(): Promise<
    Array<{
      id: string;
      client_name: string;
      service_name: string;
      start_time: string;
    }>
  > {
    return this.retryWithBackoff(async () => {
      const result = await this.makeRequest<any[]>('getBookingsList', [1, 100]);
      return result.map((booking) => ({
        id: booking.id.toString(),
        client_name: booking.client_name || 'Unknown Client',
        service_name: booking.service_name || 'Unknown Service',
        start_time: booking.start_date_time,
      }));
    });
  }
}
