import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { lokaliseAuth } from '../common/auth';

export const createProject = createAction({
  auth: lokaliseAuth,
  name: 'createProject',
  displayName: 'Create Project',
  description: 'Create a new project in your Lokalise team',
  props: {
    projectName: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the project',
      required: false,
    }),
    projectType: Property.StaticDropdown({
      displayName: 'Project Type',
      description: 'Type of the project',
      required: false,
      options: {
        options: [
          {
            label: 'Web and Mobile (Software Projects)',
            value: 'localization_files',
          },
          { label: 'Documents (Ad hoc documents)', value: 'paged_documents' },
          {
            label: 'Marketing Projects (with integrations)',
            value: 'content_integration',
          },
          {
            label: 'Marketing Projects (Automatically translated)',
            value: 'marketing',
          },
          {
            label:
              'Marketing Projects (Automatically translated with integrations)',
            value: 'marketing_integrations',
          },
        ],
      },
    }),
    baseLangIso: Property.ShortText({
      displayName: 'Base Language ISO',
      description:
        'Language/locale code of the project base language (e.g., "en", "en-us")',
      required: false,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description:
        'ID of the team to create a project in (numerical ID or UUID). If omitted, the project will be created in your current team',
      required: false,
    }),
    isSegmentationEnabled: Property.Checkbox({
      displayName: 'Enable Segmentation',
      description: 'Enable Segmentation feature for project',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      projectName,
      description,
      projectType,
      baseLangIso,
      teamId,
      isSegmentationEnabled,
    } = context.propsValue;

    const body: any = {
      name: projectName,
      ...(description && { description }),
      ...(projectType && { project_type: projectType }),
      ...(baseLangIso && { base_lang_iso: baseLangIso }),
      ...(teamId && { team_id: teamId }),
      ...(isSegmentationEnabled && { is_segmentation_enabled: true }),
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/projects',
      body
    );

    return response;
  },
});
