import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const BREAKDOWNS = ['overall', 'country', 'age,gender', 'user_segment_key', 'publisher_platform,platform_position'];
const PROVIDERS = ['facebook', 'tiktok'];
const WINDOWS = ['1d', '7d', '28d'];

const getLensReport = createAction({
  auth: foreplayCoAuth,
  name: 'get_lens_report',
  classification: 'READ',
  displayName: 'Get Lens Report',
  description: 'Get reporting rows from a Foreplay Lens.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns ad-account reporting rows (core metrics, actions, action values) from a Foreplay Lens for a date range, broken down by overall, country, "age,gender", user_segment_key or "publisher_platform,platform_position", for provider facebook or tiktok. Attribution windows 1d/7d/28d (click default 7d, view default 1d). Up to 10 rows per page; when hasMore is true call again with page set to nextPage. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.lensReport,
  props: {
    lensId: Property.ShortText({ displayName: 'Lens ID', required: true }),
    from: Property.ShortText({ displayName: 'From', description: 'YYYY-MM-DD', required: true }),
    to: Property.ShortText({ displayName: 'To', description: 'YYYY-MM-DD', required: true }),
    breakdownType: Property.StaticDropdown({ displayName: 'Breakdown', required: true, options: { options: BREAKDOWNS.map((b) => ({ label: b, value: b })) } }),
    provider: Property.StaticDropdown({ displayName: 'Provider', required: true, options: { options: [{ label: 'Facebook', value: 'facebook' }, { label: 'TikTok', value: 'tiktok' }] } }),
    attrClick: Property.StaticDropdown({ displayName: 'Click Attribution', required: false, options: { options: WINDOWS.map((w) => ({ label: w, value: w })) } }),
    attrView: Property.StaticDropdown({ displayName: 'View Attribution', required: false, options: { options: WINDOWS.map((w) => ({ label: w, value: w })) } }),
    page: Property.Number({ displayName: 'Page', description: '1-based, default 1.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 10, default 10.', required: false }),
  },
  async run({ auth, propsValue }) {
    const from = foreplayProps.dayOnly({ value: propsValue.from, label: 'From' });
    const to = foreplayProps.dayOnly({ value: propsValue.to, label: 'To' });
    if (from === undefined || to === undefined) throw new Error('From and To are required.');
    if (from > to) throw new Error('From must be on or before To.');
    const page = foreplayProps.parseInteger({ value: propsValue.page, label: 'Page', min: 1, max: 100_000 }) ?? 1;
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 10 }) ?? 10;
    const response = await foreplayClient.request({
      auth,
      path: '/api/lens/reporting',
      query: {
        lens_id: foreplayProps.foreplayId({ value: propsValue.lensId, label: 'Lens ID' }),
        from,
        to,
        breakdown_type: foreplayProps.enumValue({ value: propsValue.breakdownType, label: 'Breakdown', allowed: BREAKDOWNS }),
        provider: foreplayProps.enumValue({ value: propsValue.provider, label: 'Provider', allowed: PROVIDERS }),
        attr_click: foreplayProps.enumValue({ value: propsValue.attrClick, label: 'Click Attribution', allowed: WINDOWS }),
        attr_view: foreplayProps.enumValue({ value: propsValue.attrView, label: 'View Attribution', allowed: WINDOWS }),
        page,
        limit,
      },
    });
    const items = foreplayMappers.listOf(response.body).filter(foreplayClient.isRecord);
    const meta = foreplayMappers.metadataOf(response.body);
    const pages = foreplayMappers.num(meta['pages']);
    const hasMore = items.length > 0 && (pages !== null ? page < pages : items.length >= limit);
    return { items, count: items.length, total: foreplayMappers.num(meta['count']), page, hasMore, nextPage: hasMore ? page + 1 : null, ...foreplayMappers.credits(response) };
  },
});

export { getLensReport };
