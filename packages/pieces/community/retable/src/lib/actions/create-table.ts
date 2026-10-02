import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { retableAuth } from '../..';
import { retableCommon } from '../common';

export const retableCreateTableAction = createAction({
  auth: retableAuth,
  name: 'retable_create_table',
  classification: 'WRITE',
  displayName: 'Create Table',
  description: 'Creates a new table (retable) in a project with a default "Name" column',
  audience: 'ai',
  aiMetadata: { description: 'Creates a new Retable table inside a project, starting with a single default "Name" column. Use Add Columns afterward to define the table\'s schema. Not idempotent — each call creates a new table.', idempotent: false },
  props: {
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'ID of the project, from Get Projects or Get Specific Workspace',
      required: true,
    }),
  },
  async run(context) {
    const { project_id } = context.propsValue;
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${retableCommon.baseUrl}/project/${project_id}/retable`,
        headers: {
          ApiKey: context.auth.secret_text,
        },
      })
    ).body;
  },
});
