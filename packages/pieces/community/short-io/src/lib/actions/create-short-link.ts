import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, folderIdDropdown } from '../common/props';

export const createShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'create-short-link',
  displayName: 'Create Short Link',
  description:
    'Create a new short link with optional parameters (title, UTM tags, expiration, cloaking, etc.)',
  props: {
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      required: true,
    }),
    domain: domainIdDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    folderId: folderIdDropdown,
    cloaking: Property.Checkbox({
      displayName: 'Enable Cloaking',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: false,
    }),
    redirectType: Property.StaticDropdown({
      displayName: 'Redirect Type',
      description:
        'The HTTP status code for the redirect. The default is 302 (Found).',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '301 (Moved Permanently)', value: '301' },
          { label: '302 (Found)', value: '302' },
          { label: '303 (See Other)', value: '303' },
          { label: '307 (Temporary Redirect)', value: '307' },
          { label: '308 (Permanent Redirect)', value: '308' },
        ],
      },
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'The date and time when the link will become inactive.',
      required: false,
    }),
    expiredURL: Property.ShortText({
      displayName: 'Expired Redirect URL',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags for the link',
      required: false,
    }),
    utmSource: Property.ShortText({
      displayName: 'UTM Source',
      required: false,
    }),
    utmMedium: Property.ShortText({
      displayName: 'UTM Medium',
      required: false,
    }),
    utmCampaign: Property.ShortText({
      displayName: 'UTM Campaign',
      required: false,
    }),
    utmTerm: Property.ShortText({
      displayName: 'UTM Term',
      required: false,
    }),
    utmContent: Property.ShortText({
      displayName: 'UTM Content',
      required: false,
    }),
    ttl: Property.Number({
      displayName: 'Time to Live (in seconds)',
      description:
        '⚠️ CAUTION: Link will be PERMANENTLY DELETED after this many seconds. This action cannot be undone. Use with extreme caution.',
      required: false,
    }),
    androidURL: Property.ShortText({
      displayName: 'Android URL',
      required: false,
    }),
    iphoneURL: Property.ShortText({
      displayName: 'iPhone URL',
      required: false,
    }),
    createdAt: Property.DateTime({
      displayName: 'Creation Time',
      description: 'Overrides the creation time of the link.',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
      description: 'Disable link after specified number of clicks (minimum: 1)',
      required: false,
    }),
    passwordContact: Property.Checkbox({
      displayName: 'Show Contact for Password Recovery',
      required: false,
    }),
    skipQS: Property.Checkbox({
      displayName: 'Skip Query String Merge',
      required: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archive Link',
      required: false,
    }),
    splitURL: Property.ShortText({
      displayName: 'Split URL',
      required: false,
    }),
    splitPercent: Property.Number({
      displayName: 'Split Percent',
      description: 'Split URL percentage (1-100)',
      required: false,
    }),
    integrationAdroll: Property.ShortText({
      displayName: 'Adroll Integration ID',
      required: false,
    }),
    integrationFB: Property.ShortText({
      displayName: 'Facebook Integration ID',
      required: false,
    }),
    integrationGA: Property.ShortText({
      displayName: 'Google Analytics ID',
      required: false,
    }),
    integrationGTM: Property.ShortText({
      displayName: 'Google Tag Manager ID',
      required: false,
    }),
    allowDuplicates: Property.Checkbox({
      displayName: 'Allow Duplicates',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Custom path for the short link (optional).',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      originalURL,
      domain: domainString,
      path,
      title,
      cloaking,
      password,
      redirectType,
      expiresAt,
      expiredURL,
      tags,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      ttl,
      androidURL,
      iphoneURL,
      createdAt,
      clicksLimit,
      passwordContact,
      skipQS,
      archived,
      splitURL,
      splitPercent,
      integrationAdroll,
      integrationFB,
      integrationGA,
      integrationGTM,
      allowDuplicates,
      folderId,
    } = propsValue;

    // Input validation
    if (clicksLimit && clicksLimit < 1) {
      throw new Error('Clicks limit must be at least 1');
    }
    
    if (splitPercent && (splitPercent < 1 || splitPercent > 100)) {
      throw new Error('Split percent must be between 1 and 100');
    }

    if (redirectType && !['301', '302', '303', '307', '308'].includes(redirectType)) {
      throw new Error('Invalid redirect type. Must be one of: 301, 302, 303, 307, 308');
    }

    const domainObject = JSON.parse(domainString as string);

    const body: Record<string, unknown> = {
      originalURL,
      domain: domainObject.hostname,
    };

    const optionalParams = {
      path,
      title,
      cloaking,
      password,
      redirectType,
      expiresAt,
      expiredURL,
      tags,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent,
      ttl: ttl ? ttl * 1000 : undefined,
      androidURL,
      iphoneURL,
      createdAt,
      clicksLimit,
      passwordContact,
      skipQS,
      archived,
      splitURL,
      splitPercent,
      integrationAdroll,
      integrationFB,
      integrationGA,
      integrationGTM,
      allowDuplicates,
      folderId,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined && value !== '') {
        body[key] = value;
      }
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: '/links',
        body,
      });

      return {
        success: true,
        message: 'Short link created successfully',
        data: response,
      };
    } catch (error: any) {
      if (error.message.includes('409')) {
        throw new Error(
          'A short link with this path already exists but points to a different original URL.'
        );
      }
      
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your input values and try again.'
        );
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      
      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to create short link: ${error.message}`);
    }
  },
});
