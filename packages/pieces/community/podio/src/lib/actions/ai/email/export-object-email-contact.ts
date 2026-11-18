import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const exportObjectEmailContactAction = createAction({
  auth: podioAuth,
  name: 'podio_export_object_email_contact',
  displayName: 'Export Object Email Contact',
  description: 'Adds the email-in address of a workspace, app, organization or item to a linked address book.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds the Podio email-in address of a workspace, app, organization or item (the address that creates tasks, statuses, items or comments by email) as a contact in a linked external address book. Needs a linked account with the "addressbook" capability, from Get Linked Accounts. The id comes from List Org Spaces, List Apps, List Organizations or Filter Items, depending on the name.',
    idempotent: false,
  },
  props: {
    name: podioAiProps.choice({
      required: true,
      displayName: 'Contact Name',
      description:
        'Which email address: "task" or "status" (Reference ID is a workspace), "item_user" or "item_app" (an app), "space" (an organization), "item_comment_user" or "item_comment_app" (an item).',
      values: ['task', 'status', 'item_user', 'item_app', 'space', 'item_comment_user', 'item_comment_app'],
    }),
    refId: podioAiProps.id({ required: true, displayName: 'Reference ID', description: 'The id of the workspace, app, organization or item the Contact Name belongs to.' }),
    linkedAccountId: podioAiProps.id({ required: true, displayName: 'Linked Account ID', description: 'The id of the linked account to export to, from Get Linked Accounts; it must support the "addressbook" capability.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/email/contact/${propsValue.name}/${refTypeFor({ name: propsValue.name })}/${propsValue.refId}/export`,
      body: { linked_account_id: Number(propsValue.linkedAccountId) },
    });
  },
});

function refTypeFor({ name }: { name: string }): string {
  switch (name) {
    case 'task':
    case 'status':
      return 'space';
    case 'item_user':
    case 'item_app':
      return 'app';
    case 'space':
      return 'org';
    case 'item_comment_user':
    case 'item_comment_app':
      return 'item';
    default:
      throw new Error('name must be one of: task, status, item_user, item_app, space, item_comment_user, item_comment_app.');
  }
}
