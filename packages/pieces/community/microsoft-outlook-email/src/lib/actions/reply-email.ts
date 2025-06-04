import { createAction, Property } from '@activepieces/pieces-framework';
import { outlookEmailAuth } from '../../index';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const replyEmail = createAction({
  auth: outlookEmailAuth,
  name: 'reply-email',
  displayName: 'Reply to Email',
  description: 'Reply to an outlook email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      required: true,
    }),
    replyBody: Property.LongText({
      displayName: 'Reply Body',
      required: true,
    }),
    ccRecipients: Property.Array({
      displayName: 'CC Recipients',
      required: false,
    }),
    bccRecipients: Property.Array({
      displayName: 'BCC Recipients',
      required: false,
    }),
    attachments: Property.File({
      displayName: 'Attachments',
      description: 'Files to attach to the email',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Create Draft',
      description: 'If enabled, creates draft without sending',
      required: true,
      defaultValue: false,
    }),
  },

  async run(context) {
    const { auth, propsValue } = context;
    const {
      messageId,
      replyBody,
      ccRecipients,
      bccRecipients,
      attachments,
      draft,
    } = propsValue;

    try {
      // Step 1: Create draft reply
      const draftResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://graph.microsoft.com/v1.0/me/messages/${messageId}/createReply`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (draftResponse.status !== 201) {
        throw new Error(
          `Failed to create draft: ${JSON.stringify(draftResponse.body)}`
        );
      }

      const draftId = draftResponse.body.id;

      // Step 2: Update draft with content and recipients
      const updatePayload: any = {
        body: {
          contentType: 'HTML',
          content: replyBody,
        },
      };

      if (ccRecipients?.length) {
        updatePayload.ccRecipients = ccRecipients
          .filter((email) => typeof email === 'string')
          .map((email: string) => ({
            emailAddress: { address: email.trim() },
          }));
      }

      if (bccRecipients?.length) {
        updatePayload.bccRecipients = bccRecipients
          .filter((email) => typeof email === 'string')
          .map((email: string) => ({
            emailAddress: { address: email.trim() },
          }));
      }

      await httpClient.sendRequest({
        method: HttpMethod.PATCH,
        url: `https://graph.microsoft.com/v1.0/me/messages/${draftId}`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: updatePayload,
      });

      // Step 3: Add attachments if they exist
      if (attachments) {
        const attachmentResponse = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://graph.microsoft.com/v1.0/me/messages/${draftId}/attachments`,
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
            'Content-Type': 'application/json',
          },
          body: {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: attachments.filename,
            contentBytes: attachments.base64,
          },
        });

        if (attachmentResponse.status !== 201) {
          throw new Error(
            `Failed to add attachment: ${JSON.stringify(
              attachmentResponse.body
            )}`
          );
        }
      }
      // Step 4: Send or keep as draft based on user selection
      if (!draft) {
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://graph.microsoft.com/v1.0/me/messages/${draftId}/send`,
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        });
        return {
          success: true,
          message: 'Reply sent successfully',
          draftId: draftId,
        };
      } else {
        return {
          success: true,
          message: 'Draft created successfully',
          draftId: draftId,
          draftLink: `https://outlook.office.com/mail/drafts/id/${draftId}`,
        };
      }
    } catch (error) {
      console.error('Reply Email Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(errorMessage);
    }
  },
});
