import { createAction, Property } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { tokportalPaginatedApiCall } from '../common/client';
import { BUNDLE_STATUS_OPTIONS, tokportalProps } from '../common/props';

export const listBundles = createAction({
  auth: tokportalAuth,
  name: 'list_bundles',
  displayName: 'List Bundles',
  description: 'Lists the bundles (missions) of the workspace with optional filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'List TokPortal bundles, optionally filtered by status, bundle type, platform or external reference. Returns a flat array of bundle objects. Safe to retry.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by bundle status.',
      required: false,
      options: { options: BUNDLE_STATUS_OPTIONS },
    }),
    bundleType: tokportalProps.bundleType(false),
    platform: tokportalProps.platform(false),
    externalRef: Property.ShortText({
      displayName: 'External Reference',
      description: 'Only return bundles created with this exact external_ref.',
      required: false,
    }),
    accountStatus: Property.ShortText({
      displayName: 'Account Status',
      description:
        'Filter by the status of the bundle account listing, for example configured, published, in_review or finalized.',
      required: false,
    }),
    maxResults: tokportalProps.maxResults(),
  },
  async run(context) {
    const { status, bundleType, platform, externalRef, accountStatus, maxResults } = context.propsValue;
    return await tokportalPaginatedApiCall({
      apiKey: context.auth.secret_text,
      resourceUri: '/bundles',
      query: {
        status,
        bundle_type: bundleType,
        platform,
        external_ref: externalRef,
        account_status: accountStatus,
      },
      maxResults: maxResults ?? undefined,
    });
  },
});
