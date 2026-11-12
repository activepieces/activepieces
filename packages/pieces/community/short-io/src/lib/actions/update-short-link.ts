import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinkBody } from '../common/link-body';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown, linkIdDropdown, folderIdDropdown } from '../common/props';

export const updateShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'update-short-link',
  classification: 'WRITE',
  displayName: 'Update Short Link',
  description:
    "Update an existing short link's original URL, path, title, or other properties using its link ID.",
  audience: 'human',
  aiMetadata: { description: "Updates properties of an existing short link identified by its link ID — destination URL, path/slug, title, folder, UTM tags, expiration, cloaking, A/B split, and analytics integrations. Use to modify a link you already created rather than making a new one. Only the fields you set are changed; idempotent — re-sending the same values keyed on the link ID yields the same result.", idempotent: true },
  outputSchema: shortIoSchemas.legacyLink,
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
  },
  async run({ propsValue, auth }) {
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const linkId = shortIoClient.seg({ value: propsValue.linkId, label: 'Short Link' });
    const body = shortIoLinkBody.legacyLinkBody({ values: { ...propsValue }, now: Date.now() });
    try {
      const response = await shortIoClient.request({
        method: HttpMethod.POST,
        auth,
        path: `/links/${linkId}`,
        query: { domain_id: domain.id },
        body,
      });
      return {
        success: true,
        message: 'Short link updated successfully',
        data: shortIoLinks.scrubLink(response),
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({
        error,
        hints: {
          404: 'Short link not found. Check the link and domain.',
          400: 'Short.io rejected the link settings.',
          409: 'Another link on this domain already uses this path.',
        },
      });
    }
  },
});
