import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput, moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListTasksAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_tasks',
  classification: 'SEARCH',
  displayName: 'List Tasks',
  description: 'List tasks, optionally filtered by project, client, stage or archived state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Moxie tasks filtered by any mix of project id, client id, stage id and archived state; with no filters it returns every active task (archived ones only when Archived is Yes). Use to review the work on a project or find tasks in a given stage; use Search Tasks to match by name. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.taskList,
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Only tasks of this project, from Search Projects.',
      required: false,
    }),
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Only tasks of this client, from Search Clients.',
      required: false,
    }),
    statusId: Property.ShortText({
      displayName: 'Stage ID',
      description: 'Only tasks in this stage, from List Task Stages.',
      required: false,
    }),
    archived: moxieProps.triState({
      displayName: 'Archived',
      description: 'Yes returns only archived tasks. No or empty returns active ones (the Moxie default).',
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/tasks/list',
      query: {
        projectId: moxieInput.optionalId({ value: propsValue.projectId, field: 'Project ID' }),
        clientId: moxieInput.optionalId({ value: propsValue.clientId, field: 'Client ID' }),
        statusId: moxieInput.optionalId({ value: propsValue.statusId, field: 'Stage ID' }),
        archived: moxieInput.triState({ value: propsValue.archived, field: 'Archived' }),
      },
    });
  },
});
