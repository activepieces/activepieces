import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { weincAuth } from '../auth';
import { compact, weincRequest, WeincProject } from '../common/client';
import { projectStatusOptions } from '../common/props';

export const listProjects = createAction({
  auth: weincAuth,
  name: 'list_projects',
  displayName: 'List Projects',
  description: 'Lists projects in your organization, newest first.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists WeInc projects newest first, optionally filtered by client ID, status or a name search. Returns up to 100 per call; use Offset to page. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({ displayName: 'Name Contains', required: false }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Only return projects that belong to this client.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: projectStatusOptions,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many projects to return (1 to 100).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many projects to skip, for paging.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { q, clientId, status, limit, offset } = context.propsValue;
    const queryParams = compact({
      q,
      client_id: clientId,
      status,
      limit: limit?.toString(),
      offset: offset?.toString(),
    }) as Record<string, string>;
    const res = await weincRequest<{ projects: WeincProject[]; total: number }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/projects',
      queryParams,
    });
    return res.projects;
  },
});
