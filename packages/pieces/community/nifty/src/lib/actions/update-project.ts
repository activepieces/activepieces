import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { niftyProps } from '../common';
import { NIFTY_ACCESS_TYPE_OPTIONS, NIFTY_ARCHIVE_OPTIONS, NIFTY_TASK_VIEW_OPTIONS, niftyOps } from '../common/operations';
import { projectOutputSchema } from '../output-schemas';

export const updateProject = createAction({
  auth: niftyAuth,
  name: 'update_project',
  displayName: 'Update Project',
  description: 'Rename a project, change its description, access or view, or archive it.',
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Nifty project picked from a dropdown (agents: use nifty_project_update): name, description, access level, default view, or archive/unarchive. Only filled fields change. Idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'project', display: 'section', label: 'Project to Update', icon: 'inbox', props: ['portfolio', 'project'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'text', props: ['changes_info', 'name', 'description'] },
    { key: 'settings', display: 'section', label: 'Settings', icon: 'sliders', props: ['access_type', 'default_tasks_view', 'archive'] },
  ],
  props: {
    portfolio: niftyProps.portfolio({ required: false }),
    project: niftyProps.project({ required: true, includeArchived: true }),
    changes_info: Property.MarkDown({ value: 'Fields left empty keep their current value.', variant: MarkdownVariant.INFO }),
    name: Property.ShortText({ displayName: 'New Name', required: false }),
    description: Property.LongText({
      displayName: 'New Description',
      description: 'Nifty cannot clear a project description.',
      required: false,
    }),
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
        projectId: p.project,
        name: p.name,
        description: p.description,
        accessType: p.access_type,
        defaultTasksView: p.default_tasks_view,
        archive: p.archive,
      },
    });
  },
});
