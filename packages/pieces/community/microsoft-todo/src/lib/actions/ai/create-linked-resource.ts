import { createAction, Property } from '@activepieces/pieces-framework';
import { LinkedResource } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { linkedResourceOutputSchema } from '../../output-schemas';

export const microsoftTodoCreateLinkedResourceAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_create_linked_resource',
  outputSchema: linkedResourceOutputSchema,
  displayName: 'Create Linked Resource',
  description: 'Link a task back to the item it came from.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attach a linked resource to a Microsoft To Do task: a link back to the item that created it (an email, ticket, CRM record or web page), shown in the task details. Identify the task by list ID and task ID from List Tasks. Not idempotent: every call adds another link.',
    idempotent: false,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    display_name: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the linked item, for example the email subject.',
      required: true,
    }),
    application_name: Property.ShortText({
      displayName: 'Application Name',
      description: 'Name of the app the item comes from, for example "Zendesk".',
      required: true,
    }),
    web_url: Property.ShortText({
      displayName: 'URL',
      description: 'Link that opens the item.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'ID of the item in the source app.',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, task_id, display_name, application_name, web_url, external_id } = context.propsValue;
    const client = createTodoClient(context.auth);
    const resource: LinkedResource = await client
      .api(`${todoApi.taskPath({ listId: list_id, taskId: task_id })}/linkedResources`)
      .post({
        displayName: display_name,
        applicationName: application_name,
        ...(web_url ? { webUrl: web_url } : {}),
        ...(external_id ? { externalId: external_id } : {}),
      });
    return todoApi.toLinkedResource(resource);
  },
});
