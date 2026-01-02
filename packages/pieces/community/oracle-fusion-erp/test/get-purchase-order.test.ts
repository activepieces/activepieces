import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getPurchaseOrderAction } from '../src/lib/actions/get-purchase-order';

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

describe('getPurchaseOrderAction', () => {
  const mockAuth = {
    baseUrl: 'https://test-oracle.example.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have correct metadata', () => {
    expect(getPurchaseOrderAction.name).toBe('get_purchase_order');
    expect(getPurchaseOrderAction.displayName).toBe('Get Purchase Order');
    expect(getPurchaseOrderAction.props.poId).toBeDefined();
  });

  test('should fetch purchase order by PO ID', async () => {
    const mockPurchaseOrder = {
      POHeaderId: 'PO-001',
      OrderNumber: '4500012345',
      Supplier: 'Acme Corp',
      Status: 'Open',
      TotalAmount: 25000.00,
      Currency: 'USD',
      Lines: [
        {
          LineNumber: 1,
          ItemDescription: 'Office Supplies',
          Quantity: 100,
          UnitPrice: 250.00,
        },
      ],
    };

    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: mockPurchaseOrder,
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        poId: 'PO-001',
      },
    };

    const result = await getPurchaseOrderAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledTimes(1);
    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: HttpMethod.GET,
        url: 'https://test-oracle.example.com/fscmRestApi/resources/latest/purchaseOrders/PO-001',
      })
    );
    expect(result).toEqual(mockPurchaseOrder);
  });

  test('should handle purchase order not found', async () => {
    (httpClient.sendRequest as jest.Mock).mockRejectedValue(
      new Error('Purchase order not found')
    );

    const context = {
      auth: mockAuth,
      propsValue: {
        poId: 'INVALID-PO',
      },
    };

    await expect(getPurchaseOrderAction.run(context as any)).rejects.toThrow(
      'Purchase order not found'
    );
  });

  test('should include bearer token in request', async () => {
    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: { POHeaderId: 'PO-002' },
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        poId: 'PO-002',
      },
    };

    await getPurchaseOrderAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        authentication: {
          type: 'BEARER_TOKEN',
          token: 'mock-access-token',
        },
      })
    );
  });

  test('should handle network timeout', async () => {
    (httpClient.sendRequest as jest.Mock).mockRejectedValue(
      new Error('Request timeout')
    );

    const context = {
      auth: mockAuth,
      propsValue: {
        poId: 'PO-003',
      },
    };

    await expect(getPurchaseOrderAction.run(context as any)).rejects.toThrow(
      'Request timeout'
    );
  });

  test('should URL-encode special characters in PO ID', async () => {
    (httpClient.sendRequest as jest.Mock).mockResolvedValue({
      body: { POHeaderId: 'PO-2024/001' },
    });

    const context = {
      auth: mockAuth,
      propsValue: {
        poId: 'PO-2024/001',
      },
    };

    await getPurchaseOrderAction.run(context as any);

    expect(httpClient.sendRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test-oracle.example.com/fscmRestApi/resources/latest/purchaseOrders/PO-2024%2F001',
      })
    );
  });
});
