import { createAction, Property } from '@activepieces/pieces-framework';
import { motionAuth } from '../../index';

interface Label {
  name: string;
}


interface Stage {
  stageDefinitionId: string;
  dueDate: string;
  variableName?: string;
  variableValue?: string;
}

export const createProject = createAction({
  auth: motionAuth,
  name: 'create-project',
  displayName: 'Create Project',
  description: 'Create a new project in Motion',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the project',
      required: true,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'The workspace to which the project belongs',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the project (HTML input accepted)',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'ISO 8601 Due date on the project',
      required: false,
    }),
    priority: Property.Dropdown({
      displayName: 'Priority',
      description: 'Project priority level',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'ASAP', value: 'ASAP' },
            { label: 'HIGH', value: 'HIGH' },
            { label: 'MEDIUM', value: 'MEDIUM' },
            { label: 'LOW', value: 'LOW' },
          ],
        };
      },
      defaultValue: 'MEDIUM',
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'The list of labels by name the project should have',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Label Name',
          required: true,
        }),
      },
    }),
    projectDefinitionId: Property.ShortText({
      displayName: 'Project Definition ID',
      description: 'Optional ID of the project definition (template) to use',
      required: false,
    }),
    stages: Property.Array({
      displayName: 'Stages',
      description: 'Array of stage objects (required if projectDefinitionId is provided)',
      required: false,
      properties: {
        stageDefinitionId: Property.ShortText({
          displayName: 'Stage Definition ID',
          description: 'ID of the stage definition',
          required: true,
        }),
        dueDate: Property.ShortText({
          displayName: 'Stage Due Date',
          description: 'Due date for this stage (ISO 8601)',
          required: true,
        }),
        variableName: Property.ShortText({
          displayName: 'Variable Name',
          description: 'Name of the variable definition (e.g., the "role" name being assigned)',
          required: false,
        }),
        variableValue: Property.ShortText({
          displayName: 'Variable Value',
          description: 'The value for the variable (e.g., the user ID if the variable type is "person")',
          required: false,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const response = await fetch('https://api.usemotion.com/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': auth,
      },
      body: JSON.stringify({
        name: propsValue.name,
        workspaceId: propsValue.workspaceId,
        description: propsValue.description,
        dueDate: propsValue.dueDate,
        priority: propsValue.priority,
        labels: (propsValue.labels as Label[] | undefined)?.map(label => label.name),
        projectDefinitionId: propsValue.projectDefinitionId,
        stages: (propsValue.stages as Stage[] | undefined)?.map(stage => ({
          stageDefinitionId: stage.stageDefinitionId,
          dueDate: stage.dueDate,
          variableInstances: stage.variableName && stage.variableValue ? [{
            variableName: stage.variableName,
            value: stage.variableValue,
          }] : undefined,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create project: ${error.message || response.statusText}`);
    }

    return await response.json();
  },
});
