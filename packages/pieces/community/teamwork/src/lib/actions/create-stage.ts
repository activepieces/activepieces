import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth, TeamworkAuth } from '../common/auth';
import { teamworkClient } from '../common/client';
import { teamworkProps } from '../common/props';

export const createStageAction = createAction({
  auth: teamworkAuth,
  name: 'create_stage',
  displayName: 'Create Stage',
  description: 'Add a new stage in a workflow or board.',
  props: {
    workflow_id: teamworkProps.workflow_id(true),
    name: Property.ShortText({
      displayName: 'Stage Name',
      description: 'The name of the new stage.',
      required: true,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description: 'The hexadecimal color for the stage (e.g., #FF5733).',
      required: false,
    }),
    displayOrder: Property.Number({
      displayName: 'Display Order',
      description: 'The order in which the stage will appear.',
      required: false,
    }),
    showCompletedTasks: Property.Checkbox({
      displayName: 'Show Completed Tasks',
      description: 'Show completed tasks within this stage.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { workflow_id, name, color, displayOrder, showCompletedTasks } = propsValue;
    
    const stageData = {
      name,
      color,
      displayOrder,
      'showCompletedTasks': showCompletedTasks,
    };

    return await teamworkClient.createStage(auth as TeamworkAuth, workflow_id as string, stageData);
  },
});