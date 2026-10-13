import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const listTeamMembersAction = createAction({
  name: 'list_team_members',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'List Team Members',
  description: 'Lists staff members of the Square account. Needs a connection created or reconnected with piece version 1.0.0 or later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Square team members (staff) with IDs, names, status and assigned locations, one page at a time. Use it to see who works at which location. Needs the EMPLOYEES_READ permission (reconnect older connections). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    location_id: squareProps.locationIdText(),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'ACTIVE',
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Inactive', value: 'INACTIVE' },
          { label: 'All', value: 'ALL' },
        ],
      },
    }),
    limit: squareProps.limitProp({ max: 200, fallback: 50 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.teamMembers,
  async run(context) {
    const locationId = squareInputs.optionalId({ value: context.propsValue.location_id, label: 'Location ID' });
    const status = context.propsValue.status ?? 'ACTIVE';
    const filter = squareOps.dropUndefined({
      location_ids: locationId ? [locationId] : undefined,
      status: status === 'ALL' ? undefined : status,
    });
    const body = await squareClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['v2', 'team-members', 'search'],
      body: squareOps.dropUndefined({
        query: Object.keys(filter).length > 0 ? { filter } : undefined,
        limit: squareInputs.limit({ value: context.propsValue.limit, fallback: 50, max: 200 }),
        cursor: squareInputs.cursor(context.propsValue.cursor),
      }),
      operation: 'list team members',
    });
    return squareShape.page({ items: squareShape.list({ value: body, key: 'team_members' }).map(squareShape.teamMember), cursor: squareShape.str({ value: body, key: 'cursor' }) });
  },
});
