import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall } from '../common';

export const deleteBouncesBulk = createAction({
  auth: mailgunAuth,
  name: 'delete_bounces_bulk',
  displayName: 'Delete Bounces (Bulk)',
  description:
    'Remove bounced addresses from the Mailgun suppression list, either all at once for a domain or a single address. Useful for cleanup after a spam/bot attack has inflated the bounce list.',
  props: {
    domain: mailgunCommon.domainDropdown,
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Delete all bounces for the domain, or a single address.',
      required: true,
      defaultValue: 'all',
      options: {
        options: [
          { label: 'All bounces for this domain', value: 'all' },
          { label: 'Single address', value: 'single' },
        ],
      },
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description:
        'Email address to remove from the bounce list. Required when Scope is "Single address".',
      required: false,
    }),
    confirm: Property.Checkbox({
      displayName: 'Confirm deletion',
      description:
        'Check this box to confirm you want to permanently remove bounces. This action cannot be undone.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { domain, scope, address, confirm } = context.propsValue;
    const auth = context.auth;

    if (!confirm) {
      throw new Error(
        'Deletion not confirmed. Check the "Confirm deletion" box to proceed.',
      );
    }

    if (scope === 'single') {
      const trimmed = address?.trim();
      if (!trimmed) {
        throw new Error(
          'An address is required when Scope is "Single address".',
        );
      }
      await mailgunApiCall({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        method: HttpMethod.DELETE,
        path: `/v3/${domain}/bounces/${encodeURIComponent(trimmed)}`,
      });
      return {
        scope: 'single',
        domain,
        address: trimmed,
        deleted: true,
      };
    }

    await mailgunApiCall({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.DELETE,
      path: `/v3/${domain}/bounces`,
    });

    return {
      scope: 'all',
      domain,
      deleted: true,
    };
  },
});
