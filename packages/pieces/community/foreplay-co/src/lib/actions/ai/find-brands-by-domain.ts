import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const DOMAIN_RE = /^(https?:\/\/)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/\S*)?$/;

const findBrandsByDomain = createAction({
  auth: foreplayCoAuth,
  name: 'find_brands_by_domain',
  classification: 'SEARCH',
  displayName: 'Find Brands by Domain',
  description: 'Find brands that advertise from a website domain.',
  audience: 'ai',
  aiMetadata: {
    description: 'Finds brands whose ads point to a website domain (e.g. allbirds.com or a full URL). Use it to turn a company website into Foreplay brand IDs and Facebook page IDs. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brandList,
  props: {
    domain: Property.ShortText({ displayName: 'Domain', description: 'example.com or https://example.com', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 10, default 10.', required: false }),
    order: Property.StaticDropdown({ displayName: 'Order', required: false, options: { options: [{ label: 'Most ranked', value: 'most_ranked' }, { label: 'Least ranked', value: 'least_ranked' }] } }),
  },
  async run({ auth, propsValue }) {
    const domain = foreplayProps.requiredText({ value: propsValue.domain, label: 'Domain' });
    if (!DOMAIN_RE.test(domain)) throw new Error('Domain must look like example.com or https://example.com.');
    const response = await foreplayClient.request({
      auth,
      path: '/api/brand/getBrandsByDomain',
      query: {
        domain,
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 10 }) ?? 10,
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.BRAND_ORDERS }),
      },
    });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.brand);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { findBrandsByDomain };
