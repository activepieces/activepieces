import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropShareCollectionOutputSchema } from '../../../output-schemas';

export const raindropShareCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_share_collection',
  outputSchema: raindropShareCollectionOutputSchema,
  displayName: 'Share Collection',
  description: 'Invites people by email to collaborate on a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends invitation emails to join a collection (ID from List Collections) as a member (can edit and invite others) or viewer (read-only). Takes 1 to 10 emails per call. Not idempotent: each call sends the invitations again; use List Collaborators to see who already joined.',
    idempotent: false,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: true,
      description: 'ID of the collection to share, from List Collections.',
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses to invite, 1 to 10 per call, e.g. ["someone@example.com"].',
      required: true,
    }),
    role: raindropAiProps.collaboratorRole({
      required: true,
      description: 'Access level: "member" can edit and invite more people, "viewer" is read-only.',
    }),
  },
  async run({ auth, propsValue }) {
    const emails = raindropUtils.toStringList({ value: propsValue.emails });
    if (emails.length > 10) {
      throw new Error(`Emails takes at most 10 addresses per call; got ${emails.length}.`);
    }
    return await raindropClient.request<RaindropShareCollectionResponse>({
      auth,
      method: HttpMethod.POST,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}/sharing`,
      body: {
        role: propsValue.role,
        emails,
      },
    });
  },
});

type RaindropShareCollectionResponse = {
  result: boolean;
  emails: string[];
};
