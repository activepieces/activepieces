import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const createProjectAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Creates a new project with description and organizer',
  props: {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    organizer_id: wealthboxCommon.userId,
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: false,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
  },
  async run(context) {
    const { name, description, organizer_id, start_date, end_date, tags } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const projectData: any = {
      name,
      organizer_id,
    };

    if (description) projectData.description = description;
    if (start_date) projectData.start_date = start_date;
    if (end_date) projectData.end_date = end_date;
    if (tags && tags.length > 0) projectData.tags = tags;

    const result = await client.createProject(projectData);
    
    return result;
  },
});
