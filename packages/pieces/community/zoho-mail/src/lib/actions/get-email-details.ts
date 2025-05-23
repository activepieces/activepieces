import { createAction, Property } from "@activepieces/pieces-framework";
import { zohoMailAuth } from "../../index";
import { zohoMailCommon } from "../common";

export const getEmailDetails = createAction({
  name: 'get_email_details',
  displayName: 'Get Email Details',
  description: 'Get the details of a specific email',
  auth: zohoMailAuth,
  props: {
    accountId: zohoMailCommon.accountIdProperty,
    folder: zohoMailCommon.folderProperty,
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to get details for',
      required: true,
    }),
    includeContent: Property.Checkbox({
      displayName: 'Include Content',
      description: 'Whether to include the email content in the response',
      required: false,
      defaultValue: true,
    }),
    includeBlockContent: Property.Checkbox({
      displayName: 'Include Block Content',
      description: 'Whether to include block quote content along with the email body',
      required: false,
      defaultValue: false,
      refreshers: ['includeContent'],
      showIf: (values) => !!values['includeContent'],
    }),
    includeAttachmentInfo: Property.Checkbox({
      displayName: 'Include Attachment Info',
      description: 'Whether to include attachment information in the response',
      required: false,
      defaultValue: false,
    }),
    includeInlineImages: Property.Checkbox({
      displayName: 'Include Inline Images',
      description: 'Whether to include inline image information in the attachment details',
      required: false,
      defaultValue: false,
      refreshers: ['includeAttachmentInfo'],
      showIf: (values) => !!values['includeAttachmentInfo'],
    }),
  },
  async run({ auth, propsValue }) {
    const {
      accountId: accountIdProp,
      folder,
      messageId,
      includeContent,
      includeBlockContent,
      includeAttachmentInfo,
      includeInlineImages
    } = propsValue;

    // Use provided account ID or get the default one
    const accountId = accountIdProp || await zohoMailCommon.getAccountId(auth);

    // Get email details
    const emailDetails = await zohoMailCommon.getEmailDetails(auth, accountId, folder as string, messageId);

    const result: Record<string, any> = {
      metadata: emailDetails,
    };

    // If includeContent is true, also get the email content
    if (includeContent) {
      const emailContent = await zohoMailCommon.getEmailContent(
        auth,
        accountId,
        folder as string,
        messageId,
        includeBlockContent as boolean
      );
      result.content = emailContent;
    }

    // If includeAttachmentInfo is true, also get attachment information
    if (includeAttachmentInfo) {
      const attachmentInfo = await zohoMailCommon.getAttachmentInfo(
        auth,
        accountId,
        folder as string,
        messageId,
        includeInlineImages as boolean
      );
      result.attachments = attachmentInfo;
    }

    return result;
  },
});
