import { createAction, Property } from '@activepieces/pieces-framework';
import { shortioAuth, shortioApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createShortLink = createAction({
  auth: shortioAuth,
  name: 'create_link',
  displayName: 'Create Link',
  description: 'Create a new short link.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain hostname (e.g., example.short.gy)',
      required: true,
    }),
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      description: 'The URL to be shortened',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Custom Path',
      description: 'Custom path for the short link (optional)',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Link title',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of link tags',
      required: false,
    }),
    cloaking: Property.Checkbox({
      displayName: 'Enable Cloaking',
      description: 'Hide the destination URL in the browser',
      required: false,
      defaultValue: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Set a password to protect the link',
      required: false,
    }),
    redirectType: Property.StaticDropdown({
      displayName: 'Redirect Type',
      description: 'HTTP redirect code',
      required: false,
      options: {
        options: [
          { label: '301 - Permanent Redirect', value: 301 },
          { label: '302 - Temporary Redirect', value: 302 },
          { label: '307 - Temporary Redirect (Preserve Method)', value: 307 },
          { label: '308 - Permanent Redirect (Preserve Method)', value: 308 },
        ],
      },
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'Link expiration date',
      required: false,
    }),
    expiredURL: Property.ShortText({
      displayName: 'Expired URL',
      description: 'URL to redirect to when link expires',
      required: false,
    }),
    androidURL: Property.ShortText({
      displayName: 'Android URL',
      description: 'URL for Android devices',
      required: false,
    }),
    iphoneURL: Property.ShortText({
      displayName: 'iPhone URL',
      description: 'URL for iPhone devices',
      required: false,
    }),
    splitURL: Property.ShortText({
      displayName: 'Split URL',
      description: 'Alternative URL for A/B testing',
      required: false,
    }),
    splitPercent: Property.Number({
      displayName: 'Split Percentage',
      description: 'Percentage of traffic to send to split URL (1-100)',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
      description: 'Disable link after specified number of clicks',
      required: false,
    }),
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      description: 'Set utm_source parameter',
      required: false,
    }),
    utmMedium: Property.ShortText({
      displayName: 'UTM Medium',
      description: 'Set utm_medium parameter',
      required: false,
    }),
    utmCampaign: Property.ShortText({
      displayName: 'UTM Campaign',
      description: 'Set utm_campaign parameter',
      required: false,
    }),
    utmTerm: Property.ShortText({
      displayName: 'UTM Term',
      description: 'Set utm_term parameter',
      required: false,
    }),
    utmContent: Property.ShortText({
      displayName: 'UTM Content',
      description: 'Set utm_content parameter',
      required: false,
    }),
    skipQS: Property.Checkbox({
      displayName: 'Skip Query String Merging',
      description: 'Skip query string merging',
      required: false,
      defaultValue: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Mark link as archived',
      required: false,
      defaultValue: false,
    }),
    allowDuplicates: Property.Checkbox({
      displayName: 'Allow Duplicates',
      description: 'Allow creating duplicate links',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const props = propsValue;
    
    const requestBody: Record<string, any> = {
      domain: props.domain,
      originalURL: props.originalURL,
    };

    if (props.allowDuplicates === true) {
      requestBody['allowDuplicates'] = props.allowDuplicates;
    }

    const optionalFields = {
      path: props.path,
      title: props.title,
      tags: props.tags?.length ? props.tags : undefined,
      cloaking: props.cloaking === true ? props.cloaking : undefined,
      password: props.password,
      redirectType: props.redirectType,
      expiresAt: props.expiresAt ? new Date(props.expiresAt).toISOString() : undefined,
      expiredURL: props.expiredURL,
      androidURL: props.androidURL,
      iphoneURL: props.iphoneURL,
      splitURL: props.splitURL,
      splitPercent: props.splitPercent,
      clicksLimit: props.clicksLimit,
      utmSource: props.utmSource,
      utmMedium: props.utmMedium,
      utmCampaign: props.utmCampaign,
      utmTerm: props.utmTerm,
      utmContent: props.utmContent,
      skipQS: props.skipQS === true ? props.skipQS : undefined,
      archived: props.archived === true ? props.archived : undefined,
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value !== undefined) {
        requestBody[key] = value;
      }
    });

    const response = await shortioApiCall({
      apiKey: auth,
      method: HttpMethod.POST,
      resourceUri: '/links',
      body: requestBody,
    });

    return response;
  },
});
