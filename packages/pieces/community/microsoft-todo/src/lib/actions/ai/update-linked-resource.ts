import { createAction, Property } from '@activepieces/pieces-framework';
import { LinkedResource } from '@microsoft/microsoft-graph-types';
import { microsoftToDoAuth } from '../../auth';
import { createTodoClient } from '../../common';
import { todoApi } from '../../common/todo-api';
import { todoProps } from '../../common/todo-props';
import { linkedResourceOutputSchema } from '../../output-schemas';

export const microsoftTodoUpdateLinkedResourceAction = createAction({
  auth: microsoftToDoAuth,
  name: 'microsoft_todo_update_linked_resource',
  outputSchema: linkedResourceOutputSchema,
  displayName: 'Update Linked Resource',
  description: 'Change the title, app name, URL or external ID of a linked resource.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Change one or more fields of a linked resource on a Microsoft To Do task. Get the linked resource ID from List Linked Resources. Fields left empty keep their values.',
    idempotent: true,
  },
  props: {
    list_id: todoProps.listId(),
    task_id: todoProps.taskId(),
    linked_resource_id: todoProps.linkedResourceId(),
    display_name: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    application_name: Property.ShortText({
      displayName: 'Application Name',
      required: false,
    }),
    web_url: Property.ShortText({
      displayName: 'URL',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      required: false,
    }),
  },
  async run(context) {
    const { list_id, task_id, linked_resource_id, display_name, application_name, web_url, external_id } =
      context.propsValue;
    const patch: LinkedResource = {
      ...(display_name !== undefined ? { displayName: display_name } : {}),
      ...(application_name !== undefined ? { applicationName: application_name } : {}),
      ...(web_url !== undefined ? { webUrl: web_url } : {}),
      ...(external_id !== undefined ? { externalId: external_id } : {}),
    };
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to change.');
    }
    const client = createTodoClient(context.auth);
    const resource: LinkedResource = await client
      .api(todoApi.linkedResourcePath({ listId: list_id, taskId: task_id, linkedResourceId: linked_resource_id }))
      .update(patch);
    return todoApi.toLinkedResource(resource);
  },
});
