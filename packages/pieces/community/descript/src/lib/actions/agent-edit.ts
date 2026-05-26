import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { descriptAuth } from '../auth';
import { descriptCommon } from '../common';

export const descriptAgentEditAction = createAction({
  auth: descriptAuth,
  name: 'agent_edit',
  displayName: 'Agent Edit (Underlord)',
  description:
    'Use Descript\'s AI agent "Underlord" to edit an existing project or create a new one with a natural language prompt.',
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Choose whether to edit an existing project or create a brand new one.',
      required: true,
      defaultValue: 'existing',
      options: {
        options: [
          { label: 'Edit existing project', value: 'existing' },
          { label: 'Create new project from prompt', value: 'new' },
        ],
      },
    }),
    project_id: Property.Dropdown({
      auth: descriptAuth,
      displayName: 'Project',
      description: 'Select the project for the agent to edit.',
      refreshers: ['mode'],
      required: false,
      options: async ({ auth, mode }) => {
        if (mode !== 'existing')
          return {
            disabled: true,
            options: [],
            placeholder: 'Not needed for new projects',
          };
        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        try {
          const projects = await descriptCommon.fetchAllProjects(
            descriptCommon.getAuthToken(auth)
          );
          return {
            disabled: false,
            options: projects.map((p) => ({ label: p.name, value: p.id })),
          };
        } catch {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load projects. Check your connection.',
          };
        }
      },
    }),
    project_name: Property.ShortText({
      displayName: 'New Project Name',
      description:
        'Name for the new project (only used when creating a new project).',
      required: false,
    }),
    team_access: Property.StaticDropdown({
      displayName: 'Team Access',
      description:
        'Access level for team members on the new project. Only applies when creating a new project.',
      required: false,
      defaultValue: 'none',
      options: {
        options: [
          { label: 'None (private to owner)', value: 'none' },
          { label: 'View', value: 'view' },
          { label: 'Comment', value: 'comment' },
          { label: 'Edit', value: 'edit' },
        ],
      },
    }),
    composition_id: descriptCommon.compositionIdProp(false),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description:
        'Natural language instruction for Underlord. Examples: "Add studio sound to every clip", "Remove all filler words", "Create a 30-second highlight reel with the best moments". Be specific — frame edits as a single one-shot instruction.',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'AI Model',
      description:
        'AI model to use for editing. Leave blank to use the Descript default.',
      required: false,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'Optional webhook URL. When the job finishes or fails, Descript will POST the job status to this URL (same payload as Get Job Status).',
      required: false,
    }),
  },
  async run(context) {
    const {
      mode,
      project_id,
      project_name,
      team_access,
      composition_id,
      prompt,
      model,
      callback_url,
    } = context.propsValue;

    const body: Record<string, unknown> = { prompt };

    if (mode === 'existing') {
      if (!project_id) throw new Error('Please select a project to edit.');
      body['project_id'] = project_id;
      if (composition_id) body['composition_id'] = composition_id;
    } else {
      if (!project_name)
        throw new Error('Please enter a project name for the new project.');
      body['project_name'] = project_name;
      if (team_access) body['team_access'] = team_access;
    }

    if (model) body['model'] = model;
    if (callback_url) body['callback_url'] = callback_url;

    const response = await descriptCommon.descriptApiCall<{
      job_id: string;
      drive_id: string;
      project_id: string;
      project_url: string;
    }>({
      apiKey: descriptCommon.getAuthToken(context.auth),
      method: HttpMethod.POST,
      path: '/jobs/agent',
      body,
    });

    return response.body;
  },
});
