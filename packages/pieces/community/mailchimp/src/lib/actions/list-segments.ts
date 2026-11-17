import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const listSegments = createAction({
  auth: mailchimpAuth,
  name: 'list_segments',
  classification: 'SEARCH',
  displayName: 'List Segments and Tags',
  description: 'List the segments and tags of an audience.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists segments of one audience (list_id) one page at a time with ID, name, type and member count. Type "static" covers tags and static segments, "saved" covers condition-based segments, "fuzzy" covers fuzzy segments; leave Type empty for all. The numeric ID is the segment_id for segment member actions and campaign targeting. Check has_more for more pages. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['segments'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    type: Property.StaticDropdown<string>({
      displayName: 'Type',
      description: 'Only return segments of this type.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Saved (condition-based)', value: 'saved' },
          { label: 'Static (includes tags)', value: 'static' },
          { label: 'Fuzzy', value: 'fuzzy' },
        ],
      },
    }),
    count: Property.Number({
      displayName: 'Limit',
      description: 'How many records to return (1-1000). Default 100.',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many records to skip, for paging. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const paging = mailchimpApi.readPaging({ count: context.propsValue.count, offset: context.propsValue.offset, defaultCount: 100 });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<SegmentsResponse>({
      method: HttpMethod.GET,
      path: `/lists/${encodeURIComponent(listId)}/segments`,
      queryParams: {
        count: paging.count,
        offset: paging.offset,
        type: mailchimpApi.optionalText(context.propsValue.type),
      },
      operation: 'list segments',
    });
    const segments = body.segments.map((segment) => ({
      id: segment.id,
      name: segment.name,
      type: segment.type,
      member_count: segment.member_count ?? 0,
      created_at: segment.created_at ?? null,
      updated_at: segment.updated_at ?? null,
    }));
    return {
      segments,
      total_items: body.total_items,
      has_more: paging.offset + segments.length < body.total_items,
    };
  },
});

type SegmentsResponse = {
  segments: {
    id: number;
    name: string;
    type: string;
    member_count?: number;
    created_at?: string;
    updated_at?: string;
  }[];
  total_items: number;
};
