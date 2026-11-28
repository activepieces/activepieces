import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sallaUtils } from '../../common/helpers';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiGetStoreInfoAction = createAction({
  auth: sallaAuth,
  name: 'ai_get_store_info',
  classification: 'READ',
  displayName: 'Get Store Info',
  description: 'Gets the connected store profile.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the profile of the connected Salla store: id, name, plan, status, currency, store URL, contact email, logo and description. Use it to learn the store currency or to confirm which store the connection points at; it takes no input.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.storeInfo,
  props: {},
  async run({ auth }) {
    const response = await sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: '/store/info' });
    const data = response.body.data;
    return sallaUtils.withKeys({ record: sallaApi.isRecord(data) ? data : {}, keys: STORE_KEYS });
  },
});


const STORE_KEYS = [
  'id',
  'name',
  'entity',
  'type',
  'email',
  'avatar',
  'plan',
  'status',
  'verified',
  'currency',
  'domain',
  'description',
];
