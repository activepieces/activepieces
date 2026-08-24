import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaCreateAdPackAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_create_ad_pack',
  displayName: 'Create Ad Pack From Product URL',
  description: 'Product page URL in — 6 scene photos, a lip-synced UGC video, 8 static ads and captions out (59 credits with video, 9 without); poll with Get Ad Pack',
  props: {
    productUrl: Property.ShortText({
      displayName: 'Product Page URL',
      description: 'Shopify, WooCommerce, Amazon or any product page with images',
      required: true,
    }),
    includeVideo: Property.Checkbox({
      displayName: 'Include UGC Video (50 credits)',
      required: false,
      defaultValue: true,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.POST,
      '/ad-pack',
      { url: propsValue.productUrl, include_images: true, include_ads: true, include_captions: true, include_animations: false, include_video: propsValue.includeVideo ?? true },
    );
  },
});
