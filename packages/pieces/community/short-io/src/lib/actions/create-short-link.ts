import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinkBody } from '../common/link-body';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown, folderIdDropdown } from '../common/props';

export const createShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'create-short-link',
  classification: 'WRITE',
  displayName: 'Create Short Link',
  description:
    'Create a new short link with optional parameters (title, UTM tags, expiration, cloaking, etc.)',
  audience: 'human',
  aiMetadata: { description: 'Creates a new short link on a Short.io domain pointing to a target URL, with optional path/slug, title, UTM tags, expiration, click limit, cloaking, A/B split, and analytics integrations. Use to generate a shortened URL. Requires an original URL and a domain; not idempotent — each call creates a new link (set Allow Duplicates to avoid 409 conflicts on a repeated path).', idempotent: false },
  outputSchema: shortIoSchemas.legacyLink,
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
        'Permanently deletes the link this many seconds from now (minimum 604800 = 7 days). Short.io may delete it up to 2 hours later. This cannot be undone.',
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
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const body = {
      ...shortIoLinkBody.legacyLinkBody({ values: { ...propsValue }, now: Date.now() }),
      originalURL: propsValue.originalURL,
      domain: domain.hostname,
    };
    try {
      const response = await shortIoClient.request({ method: HttpMethod.POST, auth, path: '/links', body });
      return {
        success: true,
        message: 'Short link created successfully',
        data: shortIoLinks.scrubLink(response),
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: {
          409: 'A short link with this path already exists but points to a different original URL.',
          400: 'Short.io rejected the link settings.',
        },
      });
    }
  },
});
