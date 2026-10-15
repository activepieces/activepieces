import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinkBody } from '../common/link-body';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown, linkIdDropdown } from '../common/props';
import { shortIoValues } from '../common/values';

export const expireShortLinkAction = createAction({
  auth: shortIoAuth,
  name: 'expire-short-link',
  classification: 'DESTRUCTIVE',
  displayName: 'Expire Short Link',
  description: 'Set an expiration date or click limit to deactivate a short link.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sets an expiration on an existing short link so it deactivates at a given date/time or after a number of clicks, optionally sending expired visitors to a fallback URL. Requires an expiration date or a click limit. Idempotent: re-applying the same settings leaves the link unchanged.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.legacyLink,
  props: {
    domain: domainIdDropdown,
    linkId: linkIdDropdown,
    expiresAt: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'The date and time when the link will become inactive.',
      required: false,
    }),
    clicksLimit: Property.Number({
      displayName: 'Clicks Limit',
      description: 'Disable link after specified number of clicks (minimum: 1)',
      required: false,
    }),
    expiredURL: Property.ShortText({
      displayName: 'Expired Redirect URL',
      description: 'Optional URL to redirect users when the link has expired.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { clicksLimit } = shortIoLinkBody.validateLinkOptions({
      clicksLimit: propsValue.clicksLimit,
      splitPercent: undefined,
      redirectType: undefined,
    });
    const expiresAt = propsValue.expiresAt ? shortIoValues.toIsoDateTime({ value: propsValue.expiresAt, label: 'Expiration date' }) : undefined;
    if (expiresAt === undefined && clicksLimit === undefined) {
      throw new Error('You must provide either an expiration date or a clicks limit to expire the link.');
    }
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const linkId = shortIoClient.seg({ value: propsValue.linkId, label: 'Short Link' });
    try {
      const response = await shortIoClient.request({
        method: HttpMethod.POST,
        auth,
        path: `/links/${linkId}`,
        query: { domain_id: domain.id },
        body: shortIoValues.compact({ expiresAt, clicksLimit, expiredURL: propsValue.expiredURL?.trim() }),
      });
      return {
        success: true,
        message: 'Short link expiration settings updated successfully',
        data: shortIoLinks.scrubLink(response),
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Short link not found. Check the link and domain.' } });
    }
  },
});
