import { mailChimpNewCampaignTrigger } from '../src/lib/triggers/new-campaign-trigger';
import { mailChimpLinkClickedTrigger } from '../src/lib/triggers/link-clicked-trigger';
import { mailChimpEmailOpenedTrigger } from '../src/lib/triggers/email-opened-trigger';
import { mailChimpNewCustomerTrigger } from '../src/lib/triggers/new-customer-trigger';
import { mailChimpNewOrderTrigger } from '../src/lib/triggers/new-order-trigger';
import { mailChimpNewSegmentTagSubscriberTrigger } from '../src/lib/triggers/new-segment-tag-subscriber-trigger';
import { mailChimpNewOrUpdatedSubscriberTrigger } from '../src/lib/triggers/new-or-updated-subscriber-trigger';
import { mailchimpCommon } from '../src/lib/common';

// Mock fetch to prevent real API calls
jest.mock('@mailchimp/mailchimp_marketing');

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      clicks: [],
      opens: [],
      campaigns: [],
      customers: [],
      orders: [],
      members: []
    }),
  })
) as jest.Mock;

// Mock the common utilities
jest.mock('../src/lib/common', () => ({
  mailchimpCommon: {
    getMailChimpServerPrefix: jest.fn(),
    enableWebhookRequest: jest.fn(),
    disableWebhookRequest: jest.fn(),
    makeApiRequest: jest.fn(),
    mailChimpListIdDropdown: {
      displayName: 'Audience',
      required: true,
    },
    mailChimpCampaignIdDropdown: {
      displayName: 'Campaign',
      required: true,
    },
    mailChimpStoreIdDropdown: {
      displayName: 'Store',
      required: true,
    },
  },
}));

const mockAuth = {
  access_token: 'test-token',
  refresh_token: 'refresh-token',
  expires_in: 3600,
  token_type: 'Bearer',
  scope: '',
  data: {},
};

describe('Mailchimp Triggers', () => {
  beforeAll(() => {
    // Suppress console.error to prevent API error messages in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mailChimpNewCampaignTrigger', () => {
    it('should enable webhook successfully', async () => {
      (mailchimpCommon.getMailChimpServerPrefix as jest.Mock)
        .mockResolvedValue('us1');
      (mailchimpCommon.enableWebhookRequest as jest.Mock)
        .mockResolvedValue('webhook123');

      const context = {
        auth: mockAuth,
        propsValue: { list_id: 'list123' },
        webhookUrl: 'https://example.com/webhook',
        store: {
          put: jest.fn(),
        },
      };

      await mailChimpNewCampaignTrigger.onEnable(context as any);

      expect(mailchimpCommon.getMailChimpServerPrefix).toHaveBeenCalledWith('test-token');
      expect(mailchimpCommon.enableWebhookRequest).toHaveBeenCalledWith({
        server: 'us1',
        listId: 'list123',
        token: 'test-token',
        webhookUrl: 'https://example.com/webhook',
        events: { campaign: true },
      });
      expect(context.store.put).toHaveBeenCalledWith(
        'mail_chimp_campaign_webhook_data',
        { id: 'webhook123', listId: 'list123' }
      );
    });

    it('should disable webhook successfully', async () => {
      (mailchimpCommon.getMailChimpServerPrefix as jest.Mock)
        .mockResolvedValue('us1');

      const context = {
        auth: mockAuth,
        store: {
          get: jest.fn().mockResolvedValue({ id: 'webhook123', listId: 'list123' }),
        },
      };

      await mailChimpNewCampaignTrigger.onDisable(context as any);

      expect(mailchimpCommon.disableWebhookRequest).toHaveBeenCalledWith({
        server: 'us1',
        token: 'test-token',
        listId: 'list123',
        webhookId: 'webhook123',
      });
    });

    it('should process webhook payload', async () => {
      const mockPayload = {
        type: 'campaign',
        fired_at: '2009-03-26 21:35:57',
        data: {
          id: '42694e9e57',
          subject: 'Newsletter Campaign',
          list_id: 'a6b5da1054',
          status: 'sent',
          send_time: '2009-03-26 21:35:57',
        },
      };

      const context = {
        payload: { body: mockPayload },
      };

      const result = await mailChimpNewCampaignTrigger.run(context as any) as any;

      expect(result).toEqual([mockPayload]);
    });

    it('should return empty array for undefined payload', async () => {
      const context = {
        payload: { body: undefined },
      };

      const result = await mailChimpNewCampaignTrigger.run(context as any) as any;

      expect(result).toEqual([]);
    });
  });

  describe('mailChimpLinkClickedTrigger', () => {
    it('should enable trigger successfully', async () => {
      const context = {
        store: {
          put: jest.fn(),
        },
      };

      await mailChimpLinkClickedTrigger.onEnable(context as any);

      expect(context.store.put).toHaveBeenCalledWith(
        'last_check',
        expect.any(String)
      );
    });

    it('should fetch click details successfully', async () => {
      const mockResponse = {
        body: {
          clicks: [
            {
              id: 'click123',
              campaign_id: '42694e9e57',
              email_address: 'user@example.com',
              url: 'https://example.com/link',
              timestamp: '2009-03-26T21:35:57+00:00',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { campaign_id: 'campaign123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpLinkClickedTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/reports/campaign123/click-details'
      );
      expect(result).toEqual(mockResponse.body.clicks);
    });

    it('should handle API errors gracefully', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValue(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: { campaign_id: 'campaign123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpLinkClickedTrigger.run(context as any) as any;

      expect(result).toEqual([]);
    });
  });

  describe('mailChimpNewCustomerTrigger', () => {
    it('should fetch new customers successfully', async () => {
      const mockResponse = {
        body: {
          customers: [
            {
              id: 'customer123',
              email_address: 'customer@example.com',
              created_at: '2023-03-26T21:35:57+00:00',
              first_name: 'John',
              last_name: 'Doe',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue('2023-03-25T21:35:57+00:00'),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewCustomerTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/ecommerce/stores/store123/customers'
      );
      expect(result).toEqual(mockResponse.body.customers);
    });

    it('should handle API errors gracefully', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValue(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewCustomerTrigger.run(context as any) as any;

      expect(result).toEqual([]);
    });
  });

  describe('mailChimpNewOrderTrigger', () => {
    it('should fetch new orders successfully', async () => {
      const mockResponse = {
        body: {
          orders: [
            {
              id: 'order123',
              customer: {
                id: 'customer123',
                email_address: 'customer@example.com',
              },
              processed_at_foreign: '2023-03-26T21:35:57+00:00',
              order_total: 100.00,
              currency_code: 'USD',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue('2023-03-25T21:35:57+00:00'),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewOrderTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/ecommerce/stores/store123/orders'
      );
      expect(result).toEqual(mockResponse.body.orders);
    });

    it('should handle API errors gracefully', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValue(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewOrderTrigger.run(context as any) as any;

      expect(result).toEqual([]);
    });
  });

  describe('mailChimpNewSegmentTagSubscriberTrigger', () => {
    it('should fetch new tagged subscribers successfully', async () => {
      const mockResponse = {
        body: {
          members: [
            {
              id: 'subscriber123',
              email_address: 'user@example.com',
              tags: [
                { id: 123, name: 'VIP' },
              ],
              last_changed: '2023-03-26T21:35:57+00:00',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { list_id: 'list123', tag_name: 'VIP' },
        store: {
          get: jest.fn().mockResolvedValue('2023-03-25T21:35:57+00:00'),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewSegmentTagSubscriberTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists/list123/members?tags=VIP&since_last_changed=2023-03-25T21:35:57+00:00'
      );
      expect(result).toEqual(mockResponse.body.members);
    });

    it('should handle API errors gracefully', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValue(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: { list_id: 'list123', tag_name: 'VIP' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewSegmentTagSubscriberTrigger.run(context as any) as any;

      expect(result).toEqual([]);
    });
  });

  describe('mailChimpEmailOpenedTrigger', () => {
    it('should fetch open details successfully', async () => {
      const mockResponse = {
        body: {
          opens: [
            {
              id: 'open123',
              campaign_id: '42694e9e57',
              email_address: 'user@example.com',
              timestamp: '2009-03-26T21:35:57+00:00',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { campaign_id: 'campaign123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpEmailOpenedTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/reports/campaign123/open-details'
      );
      expect(result).toEqual(mockResponse.body.opens);
    });
  });

  describe('mailChimpNewCustomerTrigger', () => {
    it('should fetch new customers successfully', async () => {
      const mockResponse = {
        body: {
          customers: [
            {
              id: 'customer123',
              email_address: 'customer@example.com',
              first_name: 'John',
              last_name: 'Doe',
              created_at: '2009-03-26T21:35:57+00:00',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewCustomerTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/ecommerce/stores/store123/customers'
      );
      expect(result).toEqual(mockResponse.body.customers);
    });
  });

  describe('mailChimpNewOrderTrigger', () => {
    it('should fetch new orders successfully', async () => {
      const mockResponse = {
        body: {
          orders: [
            {
              id: 'order123',
              customer: {
                id: 'customer123',
                email_address: 'customer@example.com',
              },
              order_total: 100.00,
              processed_at_foreign: '2009-03-26T21:35:57+00:00',
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { store_id: 'store123' },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewOrderTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/ecommerce/stores/store123/orders'
      );
      expect(result).toEqual(mockResponse.body.orders);
    });
  });

  describe('mailChimpNewSegmentTagSubscriberTrigger', () => {
    it('should fetch tagged members successfully', async () => {
      const mockResponse = {
        body: {
          members: [
            {
              id: 'subscriber123',
              email_address: 'user@example.com',
              status: 'subscribed',
              tags: [{ id: 123, name: 'VIP' }],
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: { 
          list_id: 'list123',
          tag_name: 'VIP',
        },
        store: {
          get: jest.fn().mockResolvedValue(null),
          put: jest.fn(),
        },
      };

      const result = await mailChimpNewSegmentTagSubscriberTrigger.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        expect.stringContaining('/lists/list123/members?tags=VIP')
      );
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContainEqual({ id: 123, name: 'VIP' });
    });
  });

  describe('mailChimpNewOrUpdatedSubscriberTrigger', () => {
    it('should enable webhook successfully', async () => {
      (mailchimpCommon.getMailChimpServerPrefix as jest.Mock)
        .mockResolvedValue('us1');
      (mailchimpCommon.enableWebhookRequest as jest.Mock)
        .mockResolvedValue('webhook123');

      const context = {
        auth: mockAuth,
        propsValue: { list_id: 'list123' },
        webhookUrl: 'https://example.com/webhook',
        store: {
          put: jest.fn(),
        },
      };

      await mailChimpNewOrUpdatedSubscriberTrigger.onEnable(context as any);

      expect(mailchimpCommon.enableWebhookRequest).toHaveBeenCalledWith({
        server: 'us1',
        listId: 'list123',
        token: 'test-token',
        webhookUrl: 'https://example.com/webhook',
        events: { profile: true },
      });
    });

    it('should process profile webhook payload', async () => {
      const mockPayload = {
        type: 'profile',
        fired_at: '2009-03-26 21:35:57',
        data: {
          id: '8a25ff1d98',
          list_id: 'a6b5da1054',
          email: 'api@mailchimp.com',
          email_type: 'html',
          merges: {
            EMAIL: 'api@mailchimp.com',
            FNAME: 'Mailchimp',
            LNAME: 'API',
          },
        },
      };

      const context = {
        payload: { body: mockPayload },
      };

      const result = await mailChimpNewOrUpdatedSubscriberTrigger.run(context as any) as any;

      expect(result).toEqual([mockPayload]);
    });
  });
});
