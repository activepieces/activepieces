import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoApiCall } from '../common/client';
import { shortIoAuth } from '../common/auth';
import { domainIdDropdown, linkIdDropdown } from '../common/props';

export const updateShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'update-short-link',
  displayName: 'Update Short Link',
  description:
    "Update an existing short link's original URL, path, title, or other properties using its link ID.",
  props: {
    domain: domainIdDropdown,
    linkId: linkIdDropdown,
    originalURL: Property.ShortText({
      displayName: 'Original URL',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Custom Path (Slug)',
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
    expiresAt: Property.ShortText({
      displayName: 'Expiration Date (ISO or timestamp)',
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
    ttl: Property.DateTime({
      displayName: 'Time to Live (ISO or ms)',
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
    createdAt: Property.ShortText({
      displayName: 'Created At (ISO or ms)',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
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
      displayName: 'Split Percent (1-100)',
      required: false,
    }),
    integrationAdroll: Property.ShortText({
      displayName: 'Adroll Integration',
      required: false,
    }),
    integrationFB: Property.ShortText({
      displayName: 'Facebook Integration',
      required: false,
    }),
    integrationGA: Property.ShortText({
      displayName: 'Google Analytics Integration',
      required: false,
    }),
    integrationGTM: Property.ShortText({
      displayName: 'Google Tag Manager Integration',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { linkId, domain, ...bodyParams } = propsValue;

    const filteredBody: Record<string, any> = {};
    for (const [key, value] of Object.entries(bodyParams)) {
      if (value !== null && value !== undefined) {
        filteredBody[key] = value;
      }
    }

    try {
      const response = await shortIoApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: `/links/${linkId}`,
        body: filteredBody,
      });

      return {
        success: true,
        message: 'Short link updated successfully',
        data: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to update short link: ${error.message}`);
    }
  },
});
