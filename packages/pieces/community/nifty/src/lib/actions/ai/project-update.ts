import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../../auth';
import { NIFTY_ACCESS_TYPE_OPTIONS, NIFTY_ARCHIVE_OPTIONS, NIFTY_TASK_VIEW_OPTIONS, niftyOps } from '../../common/operations';
import { projectOutputSchema } from '../../output-schemas';

export const niftyProjectUpdate = createAction({
  auth: niftyAuth,
  name: 'nifty_project_update',
  displayName: 'Update Project (AI)',
  description: 'Updates a project by ID. Built for AI agents.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Updates a Nifty project's name, description, access level or default task view, or archives/unarchives it; only the fields you pass change. Archiving hides the project but keeps its tasks and is undone with unarchive. Nifty cannot blank a project description. Requires project_id and at least one change. Idempotent.",
    idempotent: true,
  },
  props: {
    project_id: Property.ShortText({ displayName: 'Project ID', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    access_type: Property.StaticDropdown({
      displayName: 'Access Type',
      required: false,
      options: { options: NIFTY_ACCESS_TYPE_OPTIONS },
    }),
    default_tasks_view: Property.StaticDropdown({
      displayName: 'Default Tasks View',
      required: false,
      options: { options: NIFTY_TASK_VIEW_OPTIONS },
    }),
    archive: Property.StaticDropdown({
      displayName: 'Archive',
      required: false,
      defaultValue: 'unchanged',
      options: { options: NIFTY_ARCHIVE_OPTIONS },
    }),
  },
  outputSchema: projectOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return niftyOps.updateProject({
      auth: context.auth,
      input: {
        projectId: p.project_id,
        name: p.name,
        description: p.description,
        accessType: p.access_type,
        defaultTasksView: p.default_tasks_view,
        archive: p.archive,
      },
    });
  },
});
