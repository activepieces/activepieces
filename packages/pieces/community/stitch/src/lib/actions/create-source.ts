import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stitchAuth } from '../../';
import { makeConnectRequest, StitchSource } from '../common';

const SOURCE_TYPES = [
  'airbnb', 'amplitude', 'asana', 'bigquery', 'braintree', 'campaign_monitor',
  'chargebee', 'close_io', 'eloqua', 'facebook_ads', 'fullstory', 'github',
  'gitlab', 'google_ads', 'google_analytics', 'google_sheets', 'heap',
  'hubspot', 'intercom', 'jira', 'klaviyo', 'linkedin_ads', 'marketo',
  'mixpanel', 'mongodb', 'mysql', 'outbrain', 'pardot', 'pipedrive',
  'platform_mysql', 'platform_postgres', 'postgres', 'quickbooks',
  'recurly', 'referral_saasquatch', 'responsys', 'revinate', 's3_csv',
  'salesforce', 'sendgrid', 'shiphero', 'shippo', 'shopify', 'slack',
  'snapchat_ads', 'square', 'stripe', 'taboola', 'twitter_ads',
  'uservoice', 'woocommerce', 'xero', 'zendesk', 'zuora',
];

export const createSourceAction = createAction({
  auth: stitchAuth,
  name: 'create_source',
  displayName: 'Create Source',
  description: 'Connects a new data source to your Stitch account.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Source Type',
      description: 'The type of source to connect (e.g. Salesforce, HubSpot, MySQL).',
      required: true,
      options: {
        options: SOURCE_TYPES.map((t) => ({
          label: t
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          value: t,
        })),
      },
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'A human-readable name for this source (e.g. "Production Salesforce").',
      required: true,
    }),
    properties: Property.Json({
      displayName: 'Connection Properties',
      description:
        'Source-specific configuration as a JSON object. ' +
        'Fields differ per source type. For example, for MySQL: ' +
        '{"host":"db.example.com","port":3306,"username":"stitch","password":"...","database":"mydb"}. ' +
        'Check the Stitch docs for the required fields for your source type.',
      required: false,
      defaultValue: {},
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as {
      connect_api_token: string;
      import_api_token: string;
      client_id: string;
    };
    const source = await makeConnectRequest<StitchSource>(
      auth,
      HttpMethod.POST,
      '/v4/sources',
      {
        type: context.propsValue.type,
        display_name: context.propsValue.display_name,
        properties: context.propsValue.properties ?? {},
      }
    );
    return {
      id: source.id,
      display_name: source.display_name,
      type: source.type,
      stitch_client_id: source.stitch_client_id,
      created_at: source.created_at,
      updated_at: source.updated_at,
    };
  },
});
