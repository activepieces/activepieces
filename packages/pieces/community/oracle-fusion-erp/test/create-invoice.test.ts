import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createInvoiceAction } from '../src/lib/actions/create-invoice';

// Mock httpClient
jest.mock('@activepieces/pieces-common', () => ({
  ...jest.requireActual('@activepieces/pieces-common'),
  httpClient: {
    sendRequest: jest.fn(),
  },
}));

// Mock getOAuthToken
jest.mock('../src/lib/auth', () => ({
  getOAuthToken: jest.fn().mockResolvedValue('mock-access-token'),
  OracleFusionAuth: {},
}));

describe('createInvoiceAction', () => {
  const mockAuth = {
    baseUrl: 'https://test-oracle.example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have correct metadata', () => {
    expect(createInvoiceAction.name).toBe('create_invoice');
    expect(createInvoiceAction.displayName).toBe('Create Payables Invoice');
    expect(createInvoiceAction.props.invoiceNumber).toBeDefined();
    expect(createInvoiceAction.props.supplierId).toBeDefined();
    expect(createInvoiceAction.props.invoiceAmount).toBeDefined();
    expect(createInvoiceAction.props.invoiceDate).toBeDefined();
    expect(createInvoiceAction.props.invoiceCurrency).toBeDefined();
    expect(createInvoiceAction.props.description).toBeDefined();
  });

  test('should create invoice with all required fields', async () => {
    const mockResponse = {
      InvoiceId: 'INV-001',
      InvoiceNumber: 'INV-2024-001',
      Status: 'Created',
    };

    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: mockResponse,
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        invoiceNumber: 'INV-2024-001',
        supplierId: 'SUP-123',
        invoiceAmount: 1500.00,
        invoiceDate: '2024-12-06',
        invoiceCurrency: 'USD',
        description: 'Test invoice for services',
      },
    };

    const result = await createInvoiceAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.POST,
        url: 'https://test-oracle.example.com/fscmRestApi/resources/latest/payablesInvoices',
        body: {
          InvoiceNumber: 'INV-2024-001',
          SupplierId: 'SUP-123',
          InvoiceAmount: 1500.00,
          InvoiceDate: '2024-12-06',
          InvoiceCurrency: 'USD',
          Description: 'Test invoice for services',
        },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('should create invoice without optional description', async () => {
    const mockResponse = {
      InvoiceId: 'INV-002',
      InvoiceNumber: 'INV-2024-002',
      Status: 'Created',
    };

    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: mockResponse,
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        invoiceNumber: 'INV-2024-002',
        supplierId: 'SUP-456',
        invoiceAmount: 2500.00,
        invoiceDate: '2024-12-06',
        invoiceCurrency: 'EUR',
        description: undefined,
      },
    };

    const result = await createInvoiceAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          Description: '',
        }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  test('should handle validation error from API', async () => {
    (httpClient.sendRequest as jest.Mock).mockRejectedValue(
      new Error('Invalid supplier ID')
    );

    const context = {
      auth: mockAuth,
      propsValue: {
        invoiceNumber: 'INV-2024-003',
        supplierId: 'INVALID',
        invoiceAmount: 1000.00,
        invoiceDate: '2024-12-06',
        invoiceCurrency: 'USD',
      },
    };

    await expect(createInvoiceAction.run(context as any)).rejects.toThrow(
      'Invalid supplier ID'
    );
  });

  test('should include correct headers', async () => {
    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: { InvoiceId: 'INV-003' },
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        invoiceNumber: 'INV-2024-004',
        supplierId: 'SUP-789',
        invoiceAmount: 500.00,
        invoiceDate: '2024-12-06',
        invoiceCurrency: 'GBP',
      },
    };

    await createInvoiceAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
        },
      })
    );
  });

  test('should include bearer token in request', async () => {
    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: { InvoiceId: 'INV-004' },
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        invoiceNumber: 'INV-2024-005',
        supplierId: 'SUP-999',
        invoiceAmount: 750.00,
        invoiceDate: '2024-12-06',
        invoiceCurrency: 'USD',
      },
    };

    await createInvoiceAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        authentication: {
          type: 'BEARER_TOKEN',
          token: 'mock-access-token',
        },
      })
    );
  });
});
