import { createCampaign } from '../src/lib/actions/create-campaign';
import { getCampaignReport } from '../src/lib/actions/get-campaign-report';
import { createAudience } from '../src/lib/actions/create-audience';
import { addOrUpdateSubscriber } from '../src/lib/actions/add-or-update-subscriber';
import { archiveSubscriber } from '../src/lib/actions/archive-subscriber';
import { unsubscribeEmail } from '../src/lib/actions/unsubscribe-email';
import { findCampaign } from '../src/lib/actions/find-campaign';
import { findCustomer } from '../src/lib/actions/find-customer';
import { findSubscriber } from '../src/lib/actions/find-subscriber';
import { mailchimpCommon } from '../src/lib/common';

// Mock fetch to prevent real API calls
jest.mock('@mailchimp/mailchimp_marketing');

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      id: 'test-id',
      campaigns: [],
      lists: [],
      members: [],
      tags: [],
      customers: [],
      reports: {}
    }),
  })
) as jest.Mock;

// Mock the common utilities
jest.mock('../src/lib/common', () => ({
  mailchimpCommon: {
    makeApiRequest: jest.fn(),
    getMD5EmailHash: jest.fn(),
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

describe('Mailchimp Actions', () => {
  beforeAll(() => {
    // Suppress console.error to prevent API error messages in test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a campaign successfully', async () => {
      const mockCampaignResponse = {
        body: {
          id: 'campaign123',
          type: 'regular',
          settings: {
            subject_line: 'Test Campaign',
            title: 'Test Campaign Title',
          },
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockCampaignResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          type: 'regular',
          list_id: 'list123',
          subject_line: 'Test Campaign',
          title: 'Test Campaign Title',
          from_name: 'Test Sender',
          reply_to: 'test@example.com',
          html_content: '<h1>Hello World</h1>',
        },
      };

      const result = await createCampaign.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/campaigns',
        'POST',
        expect.objectContaining({
          type: 'regular',
          recipients: { list_id: 'list123' },
          settings: expect.objectContaining({
            subject_line: 'Test Campaign',
            title: 'Test Campaign Title',
          }),
        })
      );

      expect(result).toEqual(mockCampaignResponse.body);
    });

    it('should handle campaign creation errors', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValueOnce(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: {
          type: 'regular',
          list_id: 'list123',
          subject_line: 'Test Campaign',
          title: 'Test Campaign Title',
          from_name: 'Test Sender',
          reply_to: 'test@example.com',
        },
      };

      await expect(createCampaign.run(context as any))
        .rejects.toThrow('Failed to create campaign');
    });
  });

  describe('getCampaignReport', () => {
    it('should get campaign report successfully', async () => {
      const mockReportResponse = {
        body: {
          id: 'campaign123',
          campaign_title: 'Test Campaign',
          type: 'regular',
          emails_sent: 1000,
          abuse_reports: 2,
          unsubscribed: 5,
          send_time: '2023-03-26T21:35:57+00:00',
          opens: { 
            opens_total: 500, 
            unique_opens: 450,
            open_rate: 0.5,
            last_open: '2023-03-27T10:00:00+00:00'
          },
          clicks: { 
            clicks_total: 100, 
            unique_clicks: 90,
            unique_subscriber_clicks: 85,
            click_rate: 0.1,
            last_click: '2023-03-27T11:00:00+00:00'
          },
          bounces: {
            hard_bounces: 10,
            soft_bounces: 5,
            syntax_errors: 2
          },
          forwards: {
            forwards_count: 20,
            forwards_opens: 15
          },
          industry_stats: { open_rate: 0.22, click_rate: 0.03 },
          list_stats: { sub_rate: 0.5, unsub_rate: 0.02 }
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValue(mockReportResponse);

      const context = {
        auth: mockAuth,
        propsValue: { 
          campaign_id: 'campaign123',
          include_details: false
        },
      };

      const result = await getCampaignReport.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/reports/campaign123'
      );
      
      // Verify structured response
      expect(result.campaign_id).toBe('campaign123');
      expect(result.campaign_title).toBe('Test Campaign');
      expect(result.emails_sent).toBe(1000);
      expect(result.opens.opens_total).toBe(500);
      expect(result.clicks.clicks_total).toBe(100);
      expect(result.bounces.hard_bounces).toBe(10);
      expect(result.raw_report).toEqual(mockReportResponse.body);
    });

    it('should get campaign report with detailed metrics', async () => {
      const mockReportResponse = {
        body: {
          id: 'campaign123',
          campaign_title: 'Test Campaign',
          emails_sent: 1000,
          opens: { opens_total: 500, open_rate: 0.5 },
          clicks: { clicks_total: 100, click_rate: 0.1 },
        },
      };

      const mockClickDetailsResponse = {
        body: {
          urls_clicked: [
            { id: 'url1', url: 'https://example.com', total_clicks: 50 }
          ]
        }
      };

      const mockOpenDetailsResponse = {
        body: {
          members: [
            { email_address: 'user@example.com', opens_count: 2 }
          ]
        }
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockReportResponse)
        .mockResolvedValueOnce(mockClickDetailsResponse)
        .mockResolvedValueOnce(mockOpenDetailsResponse);

      const context = {
        auth: mockAuth,
        propsValue: { 
          campaign_id: 'campaign123',
          include_details: true
        },
      };

      const result = await getCampaignReport.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledTimes(3);
      expect(mailchimpCommon.makeApiRequest).toHaveBeenNthCalledWith(1, mockAuth, '/reports/campaign123');
      expect(mailchimpCommon.makeApiRequest).toHaveBeenNthCalledWith(2, mockAuth, '/reports/campaign123/click-details');
      expect(mailchimpCommon.makeApiRequest).toHaveBeenNthCalledWith(3, mockAuth, '/reports/campaign123/open-details');
      
      expect(result.click_details).toEqual(mockClickDetailsResponse.body);
      expect(result.open_details).toEqual(mockOpenDetailsResponse.body);
    });

    it('should handle detailed metrics fetch errors gracefully', async () => {
      const mockReportResponse = {
        body: {
          id: 'campaign123',
          campaign_title: 'Test Campaign',
          emails_sent: 1000,
          opens: { opens_total: 500, open_rate: 0.5 },
          clicks: { clicks_total: 100, click_rate: 0.1 },
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockReportResponse)
        .mockRejectedValueOnce(new Error('Click details error'))
        .mockRejectedValueOnce(new Error('Open details error'));

      const context = {
        auth: mockAuth,
        propsValue: { 
          campaign_id: 'campaign123',
          include_details: true
        },
      };

      const result = await getCampaignReport.run(context as any) as any;

      // Should still return main report even if detailed metrics fail
      expect(result.campaign_id).toBe('campaign123');
      expect(result.click_details).toBeUndefined();
      expect(result.open_details).toBeUndefined();
    });

    it('should handle API errors', async () => {
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockRejectedValue(new Error('API Error'));

      const context = {
        auth: mockAuth,
        propsValue: { campaign_id: 'campaign123' },
      };

      await expect(getCampaignReport.run(context as any)).rejects.toThrow(
        'Failed to get campaign report'
      );
    });
  });

  describe('createAudience', () => {
    it('should create audience successfully', async () => {
      const mockAudienceResponse = {
        body: {
          id: 'list123',
          name: 'Test Audience',
          member_count: 0,
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockAudienceResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          name: 'Test Audience',
          contact_company: 'Test Company',
          contact_address1: '123 Test St',
          contact_city: 'Test City',
          contact_state: 'TS',
          contact_zip: '12345',
          contact_country: 'US',
          permission_reminder: 'You subscribed to our newsletter',
          campaign_defaults_from_name: 'Test Sender',
          campaign_defaults_from_email: 'test@example.com',
          campaign_defaults_subject: 'Test Subject',
        },
      };

      const result = await createAudience.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists',
        'POST',
        expect.objectContaining({
          name: 'Test Audience',
          contact: expect.objectContaining({
            company: 'Test Company',
            address1: '123 Test St',
          }),
        })
      );

      expect(result).toEqual(mockAudienceResponse.body);
    });
  });

  describe('addOrUpdateSubscriber', () => {
    it('should add or update subscriber successfully', async () => {
      const mockSubscriberResponse = {
        body: {
          id: 'subscriber123',
          email_address: 'test@example.com',
          status: 'subscribed',
        },
      };

      (mailchimpCommon.getMD5EmailHash as jest.Mock)
        .mockReturnValue('hash123');
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockSubscriberResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          list_id: 'list123',
          email: 'test@example.com',
          status: 'subscribed',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = await addOrUpdateSubscriber.run(context as any) as any;

      expect(mailchimpCommon.getMD5EmailHash).toHaveBeenCalledWith('test@example.com');
      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists/list123/members/hash123',
        'PUT',
        expect.objectContaining({
          email_address: 'test@example.com',
          status: 'subscribed',
          merge_fields: expect.objectContaining({
            FNAME: 'John',
            LNAME: 'Doe',
          }),
        })
      );

      expect(result).toEqual(mockSubscriberResponse.body);
    });
  });

  describe('archiveSubscriber', () => {
    it('should archive subscriber successfully', async () => {
      const mockResponse = {
        body: {
          id: 'subscriber123',
          email_address: 'test@example.com',
          status: 'archived',
        },
      };

      (mailchimpCommon.getMD5EmailHash as jest.Mock)
        .mockReturnValue('hash123');
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          list_id: 'list123',
          email: 'test@example.com',
        },
      };

      const result = await archiveSubscriber.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists/list123/members/hash123',
        'PATCH',
        { status: 'archived' }
      );

      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('unsubscribeEmail', () => {
    it('should unsubscribe email successfully', async () => {
      const mockResponse = {
        body: {
          id: 'subscriber123',
          email_address: 'test@example.com',
          status: 'unsubscribed',
        },
      };

      (mailchimpCommon.getMD5EmailHash as jest.Mock)
        .mockReturnValue('hash123');
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          list_id: 'list123',
          email: 'test@example.com',
        },
      };

      const result = await unsubscribeEmail.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists/list123/members/hash123',
        'PATCH',
        { status: 'unsubscribed' }
      );

      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('findCampaign', () => {
    it('should find campaigns successfully', async () => {
      const mockResponse = {
        body: {
          campaigns: [
            {
              id: 'campaign1',
              settings: {
                subject_line: 'Test Campaign 1',
                title: 'Campaign 1',
              },
            },
            {
              id: 'campaign2',
              settings: {
                subject_line: 'Test Campaign 2',
                title: 'Campaign 2',
              },
            },
          ],
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          search_term: 'Test',
          status: 'sent',
          count: 10,
        },
      };

      const result = await findCampaign.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        expect.stringContaining('/campaigns?')
      );

      expect(result.campaigns).toHaveLength(2);
      expect(result.total_items).toBe(2);
    });
  });

  describe('findCustomer', () => {
    it('should find customer by ID successfully', async () => {
      const mockResponse = {
        body: {
          id: 'customer123',
          email_address: 'customer@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          store_id: 'store123',
          customer_id: 'customer123',
        },
      };

      const result = await findCustomer.run(context as any) as any;

      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/ecommerce/stores/store123/customers/customer123'
      );

      expect(result).toEqual(mockResponse.body);
    });
  });

  describe('findSubscriber', () => {
    it('should find subscriber successfully', async () => {
      const mockResponse = {
        body: {
          id: 'subscriber123',
          email_address: 'test@example.com',
          status: 'subscribed',
        },
      };

      (mailchimpCommon.getMD5EmailHash as jest.Mock)
        .mockReturnValue('hash123');
      (mailchimpCommon.makeApiRequest as jest.Mock)
        .mockResolvedValueOnce(mockResponse);

      const context = {
        auth: mockAuth,
        propsValue: {
          list_id: 'list123',
          email: 'test@example.com',
        },
      };

      const result = await findSubscriber.run(context as any) as any;

      expect(mailchimpCommon.getMD5EmailHash).toHaveBeenCalledWith('test@example.com');
      expect(mailchimpCommon.makeApiRequest).toHaveBeenCalledWith(
        mockAuth,
        '/lists/list123/members/hash123'
      );

      expect(result).toEqual(mockResponse.body);
    });
  });
});
