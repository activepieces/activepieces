import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendfoxAuth } from '../../../auth';
import { sendfoxAiProps } from '../../../common/ai-props';
import { sendfoxClient } from '../../../common/client';
import type { SendfoxTag } from '../../../common/types';
import { sendfoxAddTagToContactOutputSchema } from '../../../output-schemas';

export const addTagToContactAction = createAction({
  auth: sendfoxAuth,
  name: 'sendfox_add_tag_to_contact',
  outputSchema: sendfoxAddTagToContactOutputSchema,
  displayName: 'Add Tag to Contact',
  description: 'Tag a SendFox contact',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Attaches an existing tag to a contact and returns all of the contact\'s tags. Tagging a contact that already has the tag leaves it unchanged. Tag IDs come from List Tags; contact IDs from Create Contact.',
    idempotent: true,
  },
  props: {
    contactId: sendfoxAiProps.contactId({ required: true }),
    tagId: sendfoxAiProps.tagId({ required: true }),
  },
  async run(context) {
    const { contactId, tagId } = context.propsValue;
    const tags = await sendfoxClient.request<SendfoxTag[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(contactId)}/tags/${encodeURIComponent(tagId)}`,
    });
    return { tags, count: tags.length };
  },
});
