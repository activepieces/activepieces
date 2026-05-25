import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { granolaAuth } from '../../';
import {
  granolaApiCall,
  flattenNote,
  GranolaListResponse,
} from '../common';

export const listNotesAction = createAction({
  auth: granolaAuth,
  name: 'list_notes',
  displayName: 'List Notes',
  description: 'List your meeting notes with optional date filters.',
  props: {
    created_after: Property.DateTime({
      displayName: 'Created After',
      description:
        'Only return notes created after this date. Leave empty to return all notes.',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description:
        'Only return notes created before this date. Leave empty for no upper limit.',
      required: false,
    }),
    updated_after: Property.DateTime({
      displayName: 'Updated After',
      description:
        'Only return notes updated after this date. Useful to find recently modified notes.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of notes to return per page (1–30).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {};

    if (context.propsValue.created_after) {
      queryParams['created_after'] = context.propsValue.created_after;
    }
    if (context.propsValue.created_before) {
      queryParams['created_before'] = context.propsValue.created_before;
    }
    if (context.propsValue.updated_after) {
      queryParams['updated_after'] = context.propsValue.updated_after;
    }
    const pageSize = Math.min(Math.max(context.propsValue.page_size ?? 10, 1), 30);
    queryParams['page_size'] = String(pageSize);

    const response = await granolaApiCall<GranolaListResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/notes',
      queryParams,
    });

    return {
      notes: response.body.notes.map(flattenNote),
      hasMore: response.body.hasMore,
      cursor: response.body.cursor ?? null,
    };
  },
});
