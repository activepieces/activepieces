import { Property, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { zohoMailAuth } from "../../index";
import { zohoMailCommon } from "../common";

export const newEmailReceived = createTrigger({
  name: 'new_email_received',
  displayName: 'New Email Received',
  description: 'Triggers when a new email is received in the inbox',
  auth: zohoMailAuth,
  props: {
    accountId: zohoMailCommon.accountIdProperty,
    includeContent: Property.Checkbox({
      displayName: 'Include Email Content',
      description: 'Whether to include the email content in the response',
      required: false,
      defaultValue: true,
    }),
    includeAttachmentInfo: Property.Checkbox({
      displayName: 'Include Attachment Info',
      description: 'Whether to include attachment information in the response',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Maximum Emails',
      description: 'Maximum number of emails to fetch per poll (max: 200)',
      required: false,
      defaultValue: 50,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    summary: "Hello, this is a sample email",
    sentDateInGMT: "1709867251000",
    subject: "Sample Email",
    messageId: "1709887058769100001",
    threadCount: "0",
    flagid: "flag_not_set",
    status2: "0",
    priority: "3",
    hasInline: "false",
    toAddress: "\"user\"<user@example.com>",
    folderId: "9000000002014",
    ccAddress: "Not Provided",
    threadId: "1709883095364100001",
    hasAttachment: "0",
    size: "1190",
    sender: "sender",
    receivedTime: "1709887053409",
    fromAddress: "sender@example.com",
    status: "1",
    content: "<div>Hello, this is a sample email content</div>"
  },
  async onEnable(context) {
    // Store the current timestamp to use as a reference point
    await context.store.put('lastPollTimestamp', Date.now());
  },
  async onDisable(context) {
    // Clean up the stored timestamp
    await context.store.delete('lastPollTimestamp');
  },
  async run(context) {
    const lastPollTimestamp = await context.store.get('lastPollTimestamp') as number || Date.now();
    const currentTimestamp = Date.now();

    // Update the last poll timestamp for the next run
    await context.store.put('lastPollTimestamp', currentTimestamp);

    const { accountId: accountIdProp, includeContent, includeAttachmentInfo, limit } = context.propsValue;

    // Use provided account ID or get the default one
    const accountId = accountIdProp || await zohoMailCommon.getAccountId(context.auth);

    // Get the inbox folder ID
    const folders = await zohoMailCommon.fetchFolders(context.auth, accountId);
    const inboxFolder = folders.find((folder: any) => folder.label === 'Inbox');

    if (!inboxFolder) {
      throw new Error('Inbox folder not found');
    }

    // Get new emails since the last poll
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/messages/view`,
      headers: {
        Authorization: `Zoho-oauthtoken ${context.auth.access_token}`,
      },
      queryParams: {
        folderId: inboxFolder.value,
        sortBy: 'receivedTime',
        sortOrder: 'false', // descending
        limit: Math.min(limit as number || 50, 200), // Fetch up to the specified limit (max 200)
      },
    });

    if (response.status !== 200 || !response.body.data) {
      throw new Error('Failed to fetch emails');
    }

    // Filter emails received after the last poll
    const newEmails = response.body.data.filter((email: any) => {
      const receivedTime = parseInt(email.receivedTime);
      return receivedTime > lastPollTimestamp;
    });

    // Process each new email with requested information
    const processedEmails = await Promise.all(
      newEmails.map(async (email: any) => {
        const result = { ...email };

        // Fetch content if requested
        if (includeContent) {
          try {
            const contentResponse = await zohoMailCommon.getEmailContent(
              context.auth,
              accountId,
              inboxFolder.value,
              email.messageId
            );
            result.content = contentResponse.content;
          } catch (error) {
            console.error(`Failed to fetch content for email ${email.messageId}:`, error);
          }
        }

        // Fetch attachment info if requested
        if (includeAttachmentInfo && email.hasAttachment === "1") {
          try {
            const attachmentInfo = await zohoMailCommon.getAttachmentInfo(
              context.auth,
              accountId,
              inboxFolder.value,
              email.messageId
            );
            result.attachments = attachmentInfo;
          } catch (error) {
            console.error(`Failed to fetch attachment info for email ${email.messageId}:`, error);
          }
        }

        return result;
      })
    );

    return processedEmails;
  },
  async test(context) {
    const { accountId: accountIdProp, includeContent, includeAttachmentInfo, limit } = context.propsValue;

    // Use provided account ID or get the default one
    const accountId = accountIdProp || await zohoMailCommon.getAccountId(context.auth);

    // Get the inbox folder ID
    const folders = await zohoMailCommon.fetchFolders(context.auth, accountId);
    const inboxFolder = folders.find((folder: any) => folder.label === 'Inbox');

    if (!inboxFolder) {
      throw new Error('Inbox folder not found');
    }

    // Get the most recent emails
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${zohoMailCommon.baseUrl}/accounts/${accountId}/messages/view`,
      headers: {
        Authorization: `Zoho-oauthtoken ${context.auth.access_token}`,
      },
      queryParams: {
        folderId: inboxFolder.value,
        sortBy: 'receivedTime',
        sortOrder: 'false', // descending
        limit: 5, // Fetch up to 5 emails for testing
      },
    });

    if (response.status !== 200 || !response.body.data) {
      throw new Error('Failed to fetch emails');
    }

    // Process each email with requested information
    const processedEmails = await Promise.all(
      response.body.data.map(async (email: any) => {
        const result = { ...email };

        // Fetch content if requested
        if (includeContent) {
          try {
            const contentResponse = await zohoMailCommon.getEmailContent(
              context.auth,
              accountId,
              inboxFolder.value,
              email.messageId
            );
            result.content = contentResponse.content;
          } catch (error) {
            console.error(`Failed to fetch content for email ${email.messageId}:`, error);
          }
        }

        // Fetch attachment info if requested
        if (includeAttachmentInfo && email.hasAttachment === "1") {
          try {
            const attachmentInfo = await zohoMailCommon.getAttachmentInfo(
              context.auth,
              accountId,
              inboxFolder.value,
              email.messageId
            );
            result.attachments = attachmentInfo;
          } catch (error) {
            console.error(`Failed to fetch attachment info for email ${email.messageId}:`, error);
          }
        }

        return result;
      })
    );

    return processedEmails;
  },
});
