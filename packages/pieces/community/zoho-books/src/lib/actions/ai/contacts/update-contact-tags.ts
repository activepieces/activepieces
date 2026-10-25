import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const updateContactTagsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_update_contact_tags',
  displayName: 'Update Contact Tags',
  description: 'Sets reporting tag options on a Zoho Books contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets reporting tag options on a contact: each tag given gets the option given, and the other tags already on the contact are kept. It reads the contact first, so an edit made in between can be overwritten. Current tags are in Get Contact; to remove a tag use Remove Contact Tag.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Reporting tags to set, each with its tag ID and the ID of the option to select.',
      required: true,
      properties: {
        tagId: Property.ShortText({
          displayName: 'Tag ID',
          description: 'Reporting tag ID.',
          required: true,
        }),
        tagOptionId: Property.ShortText({
          displayName: 'Tag Option ID',
          description: 'ID of the reporting tag option to select.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { contactId, tags } = context.propsValue;
    if (
      tags.length === 0 ||
      !tags.every(
        (tag): tag is { tagId: string; tagOptionId: string } =>
          typeof tag === 'object' &&
          tag !== null &&
          'tagId' in tag &&
          typeof tag.tagId === 'string' &&
          tag.tagId !== '' &&
          'tagOptionId' in tag &&
          typeof tag.tagOptionId === 'string' &&
          tag.tagOptionId !== '',
      )
    ) {
      throw new Error('Tags must be a non-empty list, each with a Tag ID and a Tag Option ID.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    const current = await zohoBooksApi.getContact({
      auth: context.auth,
      organizationId,
      contactId,
    });
    const given = new Set(tags.map((tag) => tag.tagId));
    const kept = (current.contact?.tags ?? [])
      .filter((tag) => !given.has(tag.tag_id))
      .map((tag) => ({ tag_id: tag.tag_id, tag_option_id: tag.tag_option_id }));
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(contactId)}/tags`,
      query: { organization_id: organizationId },
      body: {
        tags: [
          ...kept,
          ...tags.map((tag) => ({ tag_id: tag.tagId, tag_option_id: tag.tagOptionId })),
        ],
      },
    });
  },
});
