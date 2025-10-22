import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';

export const newLeadTrigger = createTrigger({
  auth: whatConvertsAuth,
  name: 'new_lead',
  displayName: 'New Lead',
  description: 'Fires when a new lead is received.',
  props: {},
  sampleData: {
    trigger: 'new',
    lead_id: 153928,
    user_id: '51497-af17340d-62b8-3044-423f-3dc754e621c2',
    lead_type: 'Phone Call',
    lead_status: 'Unique',
    lead_analysis: {
      'Keyword Detection': 'buy,quote,test',
      'Lead Summary':
        'The customer was looking to purchase call tracking services. The agent assisted them with setting up an account.',
      'Intent Detection': 'The customer wanted to purchase services.',
      'Sentiment Detection': 'Positive',
      'Topic Detection': 'call tracking,purchase,sign up',
    },
    last_updated: '2016-01-25T17:18:20Z',
    date_created: '2016-02-01T14:09:01Z',
    quotable: 'Not Set',
    quote_value: null,
    sales_value: null,
    spotted_keywords: 'buy,quote',
    lead_score: 50,
    lead_state: 'Completed',
    profile: 'My Profile',
    profile_id: 51497,
    account: 'My Account',
    account_id: 27313,
    lead_url: 'https://www.whatconverts.com/contact',
    landing_url: 'https://www.whatconverts.com/',
    operating_system: 'iOS 12',
    browser: 'Chrome Mobile 71',
    device_type: 'Smartphone',
    device_make: 'Apple iPhone',
    lead_source: 'google',
    lead_medium: 'cpc',
    lead_campaign: 'lead generation',
    lead_content: 'new ad',
    lead_keyword: 'generating leads',
    ip_address: '107.210.21.188',
    notes: 'This is a new lead!',
    contact_name: 'Jeremy Helms',
    contact_company_name: 'Call Tracking Company',
    contact_email_address: 'hello@whatconverts.com',
    contact_phone_number: '+18887203034',
    email_address: 'hello@whatconverts.com',
    phone_number: '+18887203034',
    city: 'Charlotte',
    state: 'NC',
    zip: '28226',
    country: 'US',
    field_mappings: {
      'Company Name': 'Call Tracking Company',
      'Contact Person': 'Jeremy Helms',
      Email: 'hello@whatconverts.com',
      'Phone Number': '(888) 720-3034',
    },
    gclid: 'CLibmtmqpNICFcSfGwodQbUAvg',
    msclkid: '25d83debf85f146b8f1d66a754c6a56c',
    unbounce_page_id: 'f8e32bbc-e1a1-2c5b-b4d3-c6289c8e33b',
    unbounce_variant_id: 'b',
    unbounce_visitor_id: '107.210.21.1881565955056416071',
    salesforce_user_id: '15228103840',
    roistat_visit_id: 'wqeOuWjfeIUQdd122casdLK',
    hubspot_visitor_id: '5a72d290d2d21865a693f14bcf710fed',
    facebook_browser_id: 'fb.1.1621529626600.927228660',
    facebook_click_id:
      'fb.1.1621529626598.IwAR1yDeb6_5RRDGD3fTthh9cPoaqhLYYyDFLN-LolvQwaMAPMhGRljDj-POc',
    google_analytics_client_id: '1017418163.1594157791',
    vwo_account_id: '512835',
    vwo_experiment_id: '2',
    vwo_variant_id: '2',
    vwo_user_id: 'D4A14C3EFD6DB2A51749E1A931BE96B44',
    duplicate: false,
    spam: false,
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(_context) {
    // User configures the webhook manually in the WhatConverts UI.
  },

  async onDisable(_context) {
    // User removes the webhook manually in the WhatConverts UI.
  },

  async run(context) {
    const payloadBody = context.payload.body as {
      trigger: string;
      lead_type: string;
    };

    if (payloadBody.trigger !== 'new') {
      return [];
    }

    return [context.payload.body];
  },
});
