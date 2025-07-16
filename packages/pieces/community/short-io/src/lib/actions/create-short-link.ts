import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';

export const createShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'create-short-link',
  displayName: 'Create Short Link',
  description: 'Create a new short link with optional parameters (title, UTM tags, expiration, cloaking, etc.)',
  props: {
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Your Short.io domain (e.g., "yourdomain.short.gy")',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Custom Path (Slug)',
      description: 'Optional. Custom slug for the short URL.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    cloaking: Property.Checkbox({
      displayName: 'Enable Cloaking',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: false,
    }),
    redirectType: Property.Number({
      displayName: 'Redirect Type',
      description: 'HTTP status code (e.g., 301)',
      required: false,
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expiration Date',
      description: 'ISO or timestamp in ms',
      required: false,
    }),
    expiredURL: Property.ShortText({
      displayName: 'Expired Redirect URL',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
    }),
    utmSource: Property.ShortText({ displayName: 'UTM Source', required: false }),
    utmMedium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
    utmCampaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
    utmTerm: Property.ShortText({ displayName: 'UTM Term', required: false }),
    utmContent: Property.ShortText({ displayName: 'UTM Content', required: false }),
    ttl: Property.ShortText({ displayName: 'Time to Live', required: false }),
    androidURL: Property.ShortText({ displayName: 'Android URL', required: false }),
    iphoneURL: Property.ShortText({ displayName: 'iPhone URL', required: false }),
    createdAt: Property.ShortText({ displayName: 'Creation Time', required: false }),
    clicksLimit: Property.Number({ displayName: 'Clicks Limit', required: false }),
    passwordContact: Property.Checkbox({ displayName: 'Show Contact for Password Recovery', required: false }),
    skipQS: Property.Checkbox({ displayName: 'Skip Query String Merge', required: false }),
    archived: Property.Checkbox({ displayName: 'Archive Link', required: false }),
    splitURL: Property.ShortText({ displayName: 'Split URL', required: false }),
    splitPercent: Property.Number({ displayName: 'Split Percent', required: false }),
    integrationAdroll: Property.ShortText({ displayName: 'Adroll Integration ID', required: false }),
    integrationFB: Property.ShortText({ displayName: 'Facebook Integration ID', required: false }),
    integrationGA: Property.ShortText({ displayName: 'Google Analytics ID', required: false }),
    integrationGTM: Property.ShortText({ displayName: 'Google Tag Manager ID', required: false }),
    allowDuplicates: Property.Checkbox({ displayName: 'Allow Duplicates', required: false }),
    folderId: Property.ShortText({ displayName: 'Folder ID', required: false }),
  },
  async run({ propsValue, auth }) {
    const {
      originalURL,
      domain,
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

    const body: Record<string, any> = {
      originalURL,
      domain,
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
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined) {
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
        throw new Error('A short link with this path already exists but points to a different original URL.');
      }

      throw new Error(`Failed to create short link: ${error.message}`);
    }
  },
});
