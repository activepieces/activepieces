import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, joinFilters, klaviyoApi, KlaviyoResource } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listSegmentsAi = createAction({
  auth: klaviyoAuth,
  name: 'list_segments_ai',
  classification: 'SEARCH',
  displayName: 'List Segments',
  description: 'List Klaviyo segments, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Klaviyo segments (up to 10 per page) with their IDs, optionally only those with a given whole name (letter case ignored) or active state. Use to discover segment IDs for List Segment Members. Pass next_cursor back as cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiSegmentPage,
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Whole segment name to match; letter case is ignored.', required: false }),
    is_active: klaviyoInputs.yesNoProp({ displayName: 'Active Only', description: '"yes" returns only active segments, "no" only inactive ones. Omit for all.' }),
    page_size: klaviyoInputs.pageSizeProp({ max: 10, defaultValue: 10 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const name = klaviyoInputs.optionalText(propsValue.name);
    const active = klaviyoInputs.yesNo({ value: propsValue.is_active, label: 'Active Only' });
    const page = await klaviyoApi.listPage({
      auth,
      path: '/segments',
      query: {
        filter: joinFilters([
          name === undefined ? undefined : equalsFilter({ field: 'name', value: name }),
          active === undefined ? undefined : `equals(is_active,${active})`,
        ]),
        'page[size]': klaviyoInputs.pageSize({ value: propsValue.page_size, max: 10, defaultValue: 10 }),
      },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: flatSegment });
  },
});

function flatSegment(segment: KlaviyoResource): Record<string, unknown> {
  return Object.fromEntries(Object.entries(klaviyoInputs.flatGroup(segment)).filter(([key]) => key !== 'definition'));
}
