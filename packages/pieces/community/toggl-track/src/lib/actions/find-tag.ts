import { createAction, Property } from '@activepieces/pieces-framework';
import { QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglModels, TwoTag } from '../common/models';
import { togglOutputSchemas } from '../output-schemas';

export const findTag = createAction({
  auth: togglTrackAuth,
  name: 'find_tag',
  classification: 'SEARCH',
  displayName: 'Find Tag',
  description: 'Find a tag by name in a workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists tags in a workspace, optionally filtered by name. Returns an array of tags. Read-only.',
    idempotent: true,
  },
  props: {
    workspace_id: togglCommon.workspace_id,
    search: Property.ShortText({
      displayName: 'Tag Name',
      description: 'Search by tag name.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination.',
      required: false,
    }),
    per_page: Property.Number({
      displayName: 'Items Per Page',
      description: 'Number of items per page (Toggl 2.0: max 100).',
      required: false,
    }),
  },
  outputSchema: togglOutputSchemas.tagList,
  async run(context) {
    const { search, page, per_page } = context.propsValue;
    const auth = context.auth;
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });

    if (togglApi.isTwo(auth)) {
      const tags = await togglApi.listTwoPageOrAll<TwoTag>({
        auth,
        path: `/workspaces/${workspaceId}/tags`,
        queryParams: search ? { name: search } : {},
        page: page ?? undefined,
        perPage: per_page ?? undefined,
      });
      return tags.map(togglModels.tag);
    }

    const queryParams: QueryParams = {};
    if (search) queryParams['search'] = search;
    if (page) queryParams['page'] = page.toString();
    if (per_page) queryParams['per_page'] = per_page.toString();
    const tags = await togglApi.request<Record<string, unknown>[] | null>({
      auth,
      method: togglApi.HttpMethod.GET,
      path: `/workspaces/${workspaceId}/tags`,
      queryParams,
    });
    return tags ?? [];
  },
});
