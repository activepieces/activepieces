import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetEmailContactForReferenceAsVcardOutputSchema } from '../../../output-schemas';

export const getEmailContactForReferenceAsVcardAction = createAction({
  auth: podioAuth,
  name: 'podio_get_email_contact_for_reference_as_vcard',
  outputSchema: podioGetEmailContactForReferenceAsVcardOutputSchema,
  displayName: 'Get Email Contact for Reference as vCard',
  description: 'Gets the email-in address of a workspace, app, organization or item as a vCard.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the Podio email-in address of a workspace, app, organization or item as vCard text, for import into an address book. Use Get Email Contact for Reference for structured data. The id comes from List Org Spaces, List Apps, List Organizations or Filter Items, depending on the name.',
    idempotent: true,
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
  },
  async run({ auth, propsValue }) {
    return {
      vcard: await podioClient.request<string>({
        auth,
        method: HttpMethod.GET,
        path: `/email/contact/${propsValue.name}/${refTypeFor({ name: propsValue.name })}/${propsValue.refId}/vcard`,
      }),
    };
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
