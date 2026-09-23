import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaAccessRequestOutputSchema } from '../../output-schemas';

export const asanaCreateAccessRequestAction = createAction({
  auth: asanaAuth,
  name: 'create_access_request',
  classification: 'WRITE',
  displayName: 'Request Access',
  description: 'Ask for access to a private Asana project or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Submits a request, as the connected user, to join a private project or portfolio, with an optional message for its owners, and returns the request with its approval_status. Use it when a project returns a permission error. Asana may treat this as a paid feature on some plans. Not idempotent: a repeat call while the connected user already has a pending request for the same target fails with an "already requested" error instead of creating a second request, so treat that error as meaning a request is already pending.',
    idempotent: false,
  },
  outputSchema: asanaAccessRequestOutputSchema,
  props: {
    target: Property.ShortText({
      displayName: 'Project or Portfolio GID',
      description: 'Gid of the private project or portfolio to request access to.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Optional note for the owners explaining why access is needed.',
      required: false,
    }),
  },
  async run(context) {
    const { target, message } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/access_requests',
      operation: 'Request Access',
      data: {
        target: target.trim(),
        ...(asanaUtils.hasValue(message) ? { message } : {}),
      },
    });
  },
});
