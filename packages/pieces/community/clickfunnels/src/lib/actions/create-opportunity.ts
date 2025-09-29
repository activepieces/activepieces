import { createAction, Property } from '@activepieces/pieces-framework';
import { clickfunnelsAuth } from '../common/constants';
import {
  contactsDropdown,
  pipelinesDropdown,
  pipelineStagesDropdown,
  teamMembershipsDropdown,
  teamsDropdown,
  workspacesDropdown,
} from '../common/props';
import { clickfunnelsApiService } from '../common/requests';

export const createOpportunity = createAction({
  auth: clickfunnelsAuth,
  name: 'createOpportunity',
  displayName: 'Create Opportunity',
  description:
    'Create a new opportunity for a contact.',
  props: {
    name: Property.ShortText({
      displayName: 'Opportunity Name',
      description: 'The name or title of the opportunity.',
      required: true,
    }),
    teamId: teamsDropdown(['auth']),
    workspaceId: workspacesDropdown(['auth', 'teamId']),
    pipelineId: pipelinesDropdown(['auth', 'workspaceId']),
    pipelineStageId: pipelineStagesDropdown(['auth', 'pipelineId']),
    contactId: contactsDropdown(['auth', 'workspaceId']),
    assigneeId: teamMembershipsDropdown(['auth', 'teamId'], false),
    value: Property.Number({
      displayName: 'Value',
      description:
        'The potential value of this opportunity in the default currency of the workspace',
      required: false,
    }),
    closedAt: Property.DateTime({
      displayName: 'Close Date',
      description: 'The expected close date for the opportunity.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const payload = {
      name: propsValue.name,
      pipelines_stage_id: propsValue.pipelineStageId,
      primary_contact_id: propsValue.contactId,
      ...(propsValue.value && {
        value: propsValue.value,
      }),
      ...(propsValue.closedAt && {
        closed_at: new Date(propsValue.closedAt as string).toISOString(),
      }),
      assignee_id: propsValue.assigneeId,
    };

    const response = await clickfunnelsApiService.createOpportunity(
      auth,
      propsValue.workspaceId as string,
      {
        sales_opportunity: payload,
      }
    );

    return response;
  },
});
