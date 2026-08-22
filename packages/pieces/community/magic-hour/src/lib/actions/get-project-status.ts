import { createAction, Property } from '@activepieces/pieces-framework';
import { magicHourAuth } from '../auth';
import { magicHourCommon } from '../common';

export const getProjectStatusAction = createAction({
  auth: magicHourAuth,
  name: 'get_project_status',
  classification: 'READ',
  displayName: 'Get Project Status',
  description:
    'Fetches the status and download URLs of a video or image project by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Look up a Magic Hour video or image project by ID to check whether it is queued, rendering, complete or failed, and get its download URLs. Use after starting a generation with "Wait for Completion" turned off. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    projectType: Property.StaticDropdown({
      displayName: 'Project Type',
      required: true,
      defaultValue: 'video',
      options: {
        options: [
          { label: 'Video', value: 'video' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description:
        'The project_id returned by a Text to Video, Image to Video or Generate Image step.',
      required: true,
    }),
  },
  async run(context) {
    const { projectType, projectId } = context.propsValue;
    const apiKey = context.auth.secret_text;
    if (projectType === 'image') {
      const project = await magicHourCommon.getImageProject({
        apiKey,
        projectId,
      });
      return magicHourCommon.toImageOutput({ project, model: null });
    }
    const project = await magicHourCommon.getVideoProject({
      apiKey,
      projectId,
    });
    return magicHourCommon.toVideoOutput({ project, model: null });
  },
});
