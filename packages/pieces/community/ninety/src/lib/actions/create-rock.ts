import {
  createAction,
  isNil,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { rockOutputSchema } from '../common/output-schemas';

export const createRock = createAction({
  auth: ninetyAuth,
  name: 'create_rock',
  classification: 'WRITE',
  displayName: 'Create Rock',
  description: 'Set a quarterly rock for a Ninety team',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one Ninety rock, the quarterly goal of the EOS model. Team, title, due date, status, level and quarter are all required. Use Create Milestone afterwards to break the rock into steps. Each call creates a new rock, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: rockOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'What the rock commits to',
      required: true,
    }),
    teamId: ninetyProps.teamIdRequired,
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the rock is due, usually the end of the quarter',
      required: true,
    }),
    statusCode: ninetyProps.rockStatusCode,
    levelCode: ninetyProps.rockLevelCode,
    quarter: ninetyProps.rockQuarter,
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    futureScope: ninetyProps.rockFutureScope,
    additionalTeamIds: ninetyProps.additionalTeamIds,
    addCreatorToFollowersList: Property.Checkbox({
      displayName: 'Follow This Rock',
      description: 'Add the token owner to the rock followers',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const rock = await ninetyCommon.createRock({
      token: auth.secret_text,
      rock: {
        title: propsValue.title,
        teamId: propsValue.teamId,
        dueDate: ninetyCommon.toIsoDate({
          value: propsValue.dueDate,
          field: 'Due Date',
        }),
        statusCode: propsValue.statusCode,
        levelCode: propsValue.levelCode,
        quarter: propsValue.quarter,
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined('futureScope', propsValue.futureScope),
        ...spreadIfDefined(
          'additionalTeamIds',
          isNil(propsValue.additionalTeamIds) ||
            propsValue.additionalTeamIds.length === 0
            ? undefined
            : propsValue.additionalTeamIds
        ),
      },
      addCreatorToFollowersList: propsValue.addCreatorToFollowersList,
    });
    return rock;
  },
});
