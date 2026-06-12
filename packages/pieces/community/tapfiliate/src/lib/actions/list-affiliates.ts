import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { tapfiliateAuth } from '../common/auth';
import {
  buildTapfiliateQuery,
  tapfiliatePaginatedApiCall,
} from '../common/tapfiliate.client';

export const listAffiliatesAction = createAction({
  auth: tapfiliateAuth,
  name: 'list_affiliates',
  displayName: 'List Affiliates',
  description: 'Lists affiliates with optional Tapfiliate filters.',
  audience: 'both',
  aiMetadata: { description: 'Lists affiliates in the Tapfiliate account, paginating through all results. With no filters it returns every affiliate; supplying any of email, referral code, click ID, source ID, parent affiliate ID, or affiliate group ID narrows to matching records. Use it to discover affiliates or resolve an affiliate ID from an email. Read-only and idempotent.', idempotent: true },
  props: {
    clickId: Property.ShortText({
      displayName: 'Click ID',
      required: false,
    }),
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    referralCode: Property.ShortText({
      displayName: 'Referral Code',
      required: false,
    }),
    parentId: Property.ShortText({
      displayName: 'Parent Affiliate ID',
      required: false,
    }),
    affiliateGroupId: Property.ShortText({
      displayName: 'Affiliate Group ID',
      required: false,
    }),
  },
  async run(context) {
    return await tapfiliatePaginatedApiCall({
      method: HttpMethod.GET,
      path: '/affiliates/',
      apiKey: context.auth.secret_text,
      query: buildTapfiliateQuery({
        click_id: context.propsValue.clickId,
        source_id: context.propsValue.sourceId,
        email: context.propsValue.email,
        referral_code: context.propsValue.referralCode,
        parent_id: context.propsValue.parentId,
        affiliate_group_id: context.propsValue.affiliateGroupId,
      }),
    });
  },
});
