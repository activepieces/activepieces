import {
  createAction,
  isNil,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyPropUtils, ninetyProps } from '../common/props';
import { rockOutputSchema } from '../common/output-schemas';

export const updateRock = createAction({
  auth: ninetyAuth,
  name: 'update_rock',
  classification: 'WRITE',
  displayName: 'Update Rock',
  description: 'Change a rock, move its status, or archive it',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one Ninety rock by id. Only the fields you set are sent. Setting the status to DONE is how a rock is completed, and On track or Off track is what a weekly meeting reports. Safe to retry.',
    idempotent: true,
  },
  outputSchema: rockOutputSchema,
  props: {
    rockId: Property.ShortText({
      displayName: 'Rock ID',
      description: 'The id of the rock to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    statusCode: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'On track', value: 'ON_TRACK' },
          { label: 'Off track', value: 'OFF_TRACK' },
          { label: 'Done', value: 'DONE' },
          { label: 'Canceled', value: 'CANCELED' },
          { label: 'Draft', value: 'DRAFT' },
        ],
      },
    }),
    levelCode: Property.StaticDropdown({
      displayName: 'Level',
      required: false,
      options: {
        options: [
          { label: 'Individual', value: 'USER' },
          { label: 'Department', value: 'DEPARTMENT' },
          { label: 'Company', value: 'COMPANY' },
          { label: 'Company and department', value: 'COMPANY_AND_DEPARTMENT' },
        ],
      },
    }),
    quarter: Property.StaticDropdown({
      displayName: 'Quarter',
      required: false,
      options: {
        options: [
          { label: 'Q1', value: 'Q1' },
          { label: 'Q2', value: 'Q2' },
          { label: 'Q3', value: 'Q3' },
          { label: 'Q4', value: 'Q4' },
          { label: 'None', value: 'None' },
        ],
      },
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    teamId: ninetyProps.teamIdMove,
    userId: ninetyProps.ownerIdKeep,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    futureScope: ninetyProps.rockFutureScope,
    additionalTeamIds: ninetyProps.additionalTeamIds,
    clearAdditionalTeams: Property.Checkbox({
      displayName: 'Unshare From Additional Teams',
      description:
        'Removes every additional team from the rock. An empty selection above leaves them as they are, so this is the only way to clear them.',
      required: false,
    }),
    archived: ninetyProps.archivedSetter,
  },
  async run({ auth, propsValue }) {
    const rock = await ninetyCommon.updateRock({
      token: auth.secret_text,
      rockId: propsValue.rockId,
      rock: {
        ...spreadIfDefined('title', propsValue.title),
        ...spreadIfDefined('statusCode', propsValue.statusCode),
        ...spreadIfDefined('levelCode', propsValue.levelCode),
        ...spreadIfDefined('quarter', propsValue.quarter),
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('userId', propsValue.userId),
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined('futureScope', propsValue.futureScope),
        ...spreadIfDefined(
          'archived',
          ninetyPropUtils.triStateToBoolean(propsValue.archived)
        ),
        ...spreadIfDefined(
          'dueDate',
          ninetyCommon.toOptionalIsoDate({
            value: propsValue.dueDate,
            field: 'Due Date',
          })
        ),
        ...spreadIfDefined(
          'additionalTeamIds',
          propsValue.clearAdditionalTeams === true
            ? []
            : isNil(propsValue.additionalTeamIds) ||
              propsValue.additionalTeamIds.length === 0
            ? undefined
            : propsValue.additionalTeamIds
        ),
      },
    });
    return rock;
  },
});
