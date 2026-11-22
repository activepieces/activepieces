import { createAction, Property } from '@activepieces/pieces-framework';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';
import { signNowClient, signNowData } from '../common/client';
import { signNowSchemas } from '../common/schemas';

export const cancelInviteAction = createAction({
  auth: signNowAuth,
  name: 'cancel_invite',
  displayName: 'Cancel Invite to Sign',
  description: 'Cancels the pending invites to sign a document.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Cancels the pending invites on a SignNow document, halting the signing request and notifying recipients. Works for both role-based field invites and free form invites. Requires the document ID and a cancellation reason; fails with a clear error when nothing is pending, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: signNowSchemas.cancelInvite,
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document whose invite you want to cancel.',
      required: true,
    }),
    reason: Property.ShortText({
      displayName: 'Cancellation Reason',
      description: 'The reason for cancelling the invite.',
      required: true,
    }),
  },
  async run(context) {
    const documentId = signNowData.requiredText({ value: context.propsValue.document_id, label: 'Document ID' });
    const reason = signNowData.requiredText({ value: context.propsValue.reason, label: 'Cancellation Reason' });
    const token = getSignNowBearerToken(context.auth);
    const document = await signNowClient.request({
      token,
      method: 'GET',
      path: `/document/${signNowClient.segment(documentId)}`,
      operation: 'get document',
    });
    const freeFormIds = signNowData.pendingFreeFormInviteIds(document);
    const fieldPending = signNowData.hasPendingFieldInvite(document);
    if (freeFormIds.length === 0 && !fieldPending) {
      throw new Error(`SignNow document ${documentId} has no pending invite to cancel.`);
    }
    const canceled: string[] = [];
    try {
      for (const inviteId of freeFormIds) {
        await signNowClient.request({
          token,
          method: 'PUT',
          path: `/invite/${signNowClient.segment(inviteId)}/cancel`,
          operation: 'cancel free form invite',
          body: { reason },
        });
        canceled.push(inviteId);
      }
      if (fieldPending) {
        await signNowClient.request({
          token,
          method: 'PUT',
          path: `/document/${signNowClient.segment(documentId)}/fieldinvitecancel`,
          operation: 'cancel field invite',
          body: { reason },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new Error(
        canceled.length > 0 ? `${message} Free form invites already cancelled: ${canceled.join(', ')}.` : message
      );
    }
    return { status: 'success', canceled_invite_ids: canceled, canceled_field_invites: fieldPending };
  },
});

