// Mock for @mailchimp/mailchimp_marketing SDK
export default {
  setConfig: jest.fn(),
  lists: {
    getList: jest.fn().mockResolvedValue({ id: 'list123', name: 'Test List' }),
    getAllLists: jest.fn().mockResolvedValue({ lists: [] }),
    addListMember: jest.fn().mockResolvedValue({ id: 'member123' }),
    updateListMember: jest.fn().mockResolvedValue({ id: 'member123' }),
    deleteListMember: jest.fn().mockResolvedValue({}),
    setListMemberTags: jest.fn().mockResolvedValue({}),
  },
  campaigns: {
    create: jest.fn().mockResolvedValue({ id: 'campaign123' }),
    get: jest.fn().mockResolvedValue({ id: 'campaign123', settings: {} }),
    list: jest.fn().mockResolvedValue({ campaigns: [] }),
    setContent: jest.fn().mockResolvedValue({}),
  },
  reports: {
    getCampaignReport: jest.fn().mockResolvedValue({ 
      id: 'campaign123',
      emails_sent: 100,
      opens: { opens_total: 50 },
      clicks: { clicks_total: 25 }
    }),
    getCampaignClickDetails: jest.fn().mockResolvedValue({ 
      urls_clicked: []
    }),
    getCampaignOpenDetails: jest.fn().mockResolvedValue({
      members: []
    }),
  },
  ecommerce: {
    stores: {
      list: jest.fn().mockResolvedValue({ stores: [] }),
    },
    customers: {
      list: jest.fn().mockResolvedValue({ customers: [] }),
    },
    orders: {
      list: jest.fn().mockResolvedValue({ orders: [] }),
    },
  },
};

export const Status = {
  Subscribed: 'subscribed',
  Unsubscribed: 'unsubscribed',
  Cleaned: 'cleaned',
  Pending: 'pending',
};
