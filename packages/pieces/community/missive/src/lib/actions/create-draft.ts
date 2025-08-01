import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const createDraftAction = createAction({
  auth: missiveAuth,
  name: 'create_draft',
  displayName: 'Create Draft/Post',
  description: 'Create a draft message or post in Missive, with option to send',
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject of the message',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body content of the message (HTML or text)',
      required: true,
    }),
    quotePreviousMessage: Property.Checkbox({
      displayName: 'Quote Previous Message',
      description: 'Include a quoted version of the last message in the conversation',
      required: false,
    }),
    // From field
    fromName: Property.ShortText({
      displayName: 'From Name',
      description: 'The name of the sender',
      required: false,
    }),
    fromAddress: Property.ShortText({
      displayName: 'From Email Address',
      description: 'The email address of the sender (must match your email aliases)',
      required: false,
    }),
    fromPhoneNumber: Property.ShortText({
      displayName: 'From Phone Number',
      description: 'The phone number for SMS/WhatsApp (format: +1234567890)',
      required: false,
    }),
    fromPhoneType: Property.StaticDropdown({
      displayName: 'From Phone Type',
      description: 'The type of phone service',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'SignalWire', value: 'signalwire' },
          { label: 'Twilio', value: 'twilio' },
          { label: 'Twilio WhatsApp', value: 'twilio_whatsapp' },
          { label: 'WhatsApp', value: 'whatsapp' },
        ],
      },
    }),
    // To fields
    toEmails: Property.Array({
      displayName: 'To Email Addresses',
      description: 'Email addresses to send to (array of strings)',
      required: false,
    }),
    toNames: Property.Array({
      displayName: 'To Names',
      description: 'Names for the recipients (array of strings)',
      required: false,
    }),
    toPhoneNumbers: Property.Array({
      displayName: 'To Phone Numbers',
      description: 'Phone numbers for SMS/WhatsApp (array of strings, format: +1234567890)',
      required: false,
    }),
    // CC fields
    ccEmails: Property.Array({
      displayName: 'CC Email Addresses',
      description: 'Email addresses to CC (array of strings)',
      required: false,
    }),
    ccNames: Property.Array({
      displayName: 'CC Names',
      description: 'Names for CC recipients (array of strings)',
      required: false,
    }),
    // BCC fields
    bccEmails: Property.Array({
      displayName: 'BCC Email Addresses',
      description: 'Email addresses to BCC (array of strings)',
      required: false,
    }),
    bccNames: Property.Array({
      displayName: 'BCC Names',
      description: 'Names for BCC recipients (array of strings)',
      required: false,
    }),
    // Conversation and references
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to append to',
      required: false,
    }),
    references: Property.Array({
      displayName: 'References',
      description: 'Message IDs to reference for conversation threading (array of strings)',
      required: false,
    }),
    // Team and organization
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'The ID of the team to link the conversation to',
      required: false,
    }),
    forceTeam: Property.Checkbox({
      displayName: 'Force Team',
      description: 'Force a new team even if conversation is already in another team',
      required: false,
    }),
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The ID of the organization to scope the conversation to',
      required: false,
    }),
    // Users and assignees
    addUsers: Property.Array({
      displayName: 'Add Users',
      description: 'User IDs to give access to the conversation (array of strings)',
      required: false,
    }),
    addAssignees: Property.Array({
      displayName: 'Add Assignees',
      description: 'User IDs to assign to the conversation (array of strings)',
      required: false,
    }),
    // Labels
    addSharedLabels: Property.Array({
      displayName: 'Add Shared Labels',
      description: 'Shared label IDs to add to the conversation (array of strings)',
      required: false,
    }),
    removeSharedLabels: Property.Array({
      displayName: 'Remove Shared Labels',
      description: 'Shared label IDs to remove from the conversation (array of strings)',
      required: false,
    }),
    // Conversation settings
    conversationSubject: Property.ShortText({
      displayName: 'Conversation Subject',
      description: 'Subject for the conversation',
      required: false,
    }),
    conversationColor: Property.ShortText({
      displayName: 'Conversation Color',
      description: 'HEX color code or "good", "warning", "danger"',
      required: false,
    }),
    addToInbox: Property.Checkbox({
      displayName: 'Add to Inbox',
      description: 'Move conversation to Inbox for everyone with access',
      required: false,
    }),
    addToTeamInbox: Property.Checkbox({
      displayName: 'Add to Team Inbox',
      description: 'Move conversation to team inbox',
      required: false,
    }),
    close: Property.Checkbox({
      displayName: 'Close Conversation',
      description: 'Close the conversation for everyone with access',
      required: false,
    }),
    // Send settings
    send: Property.Checkbox({
      displayName: 'Send Immediately',
      description: 'Whether to send the message immediately or save as draft',
      required: false,
      defaultValue: false,
    }),
    sendAt: Property.Number({
      displayName: 'Send At (Unix Timestamp)',
      description: 'Schedule draft to be sent at a later time (Unix timestamp)',
      required: false,
    }),
    autoFollowup: Property.Checkbox({
      displayName: 'Auto Followup',
      description: 'Discard scheduled draft when there is a reply in the conversation',
      required: false,
    }),
    // WhatsApp template settings
    externalResponseId: Property.ShortText({
      displayName: 'External Response ID (WhatsApp)',
      description: 'Twilio or Meta ID of the WhatsApp template',
      required: false,
    }),
    externalResponseVariables: Property.Json({
      displayName: 'External Response Variables (WhatsApp)',
      description: 'Variables for WhatsApp template (JSON object)',
      required: false,
    }),
    // Account for custom channels
    accountId: Property.ShortText({
      displayName: 'Account ID',
      description: 'Account ID for custom channels, Missive Live Chat, Messenger & Instagram',
      required: false,
    }),
  },
  async run(context) {
    const {
      subject,
      body,
      quotePreviousMessage,
      fromName,
      fromAddress,
      fromPhoneNumber,
      fromPhoneType,
      toEmails,
      toNames,
      toPhoneNumbers,
      ccEmails,
      ccNames,
      bccEmails,
      bccNames,
      conversationId,
      references,
      teamId,
      forceTeam,
      organizationId,
      addUsers,
      addAssignees,
      addSharedLabels,
      removeSharedLabels,
      conversationSubject,
      conversationColor,
      addToInbox,
      addToTeamInbox,
      close,
      send,
      sendAt,
      autoFollowup,
      externalResponseId,
      externalResponseVariables,
      accountId,
    } = context.propsValue;

    const apiToken = context.auth.apiToken;

    // Build from_field
    let fromField: Record<string, unknown> | null = null;
    if (fromAddress || fromName) {
      fromField = {};
      if (fromAddress) fromField.address = fromAddress;
      if (fromName) fromField.name = fromName;
    } else if (fromPhoneNumber) {
      fromField = {
        phone_number: fromPhoneNumber,
      };
      if (fromPhoneType) fromField.type = fromPhoneType;
    }

    // Build to_fields
    const toFields: Record<string, unknown>[] = [];
    
    // Add email recipients
    if (toEmails && toEmails.length > 0) {
      for (let i = 0; i < toEmails.length; i++) {
        const toField: Record<string, unknown> = {
          address: toEmails[i],
        };
        if (toNames && toNames[i]) {
          toField.name = toNames[i];
        }
        toFields.push(toField);
      }
    }
    
    // Add phone recipients (for SMS/WhatsApp)
    if (toPhoneNumbers && toPhoneNumbers.length > 0) {
      for (const phoneNumber of toPhoneNumbers) {
        toFields.push({
          phone_number: phoneNumber,
        });
      }
    }

    // Build cc_fields
    const ccFields: Record<string, unknown>[] = [];
    if (ccEmails && ccEmails.length > 0) {
      for (let i = 0; i < ccEmails.length; i++) {
        const ccField: Record<string, unknown> = {
          address: ccEmails[i],
        };
        if (ccNames && ccNames[i]) {
          ccField.name = ccNames[i];
        }
        ccFields.push(ccField);
      }
    }

    // Build bcc_fields
    const bccFields: Record<string, unknown>[] = [];
    if (bccEmails && bccEmails.length > 0) {
      for (let i = 0; i < bccEmails.length; i++) {
        const bccField: Record<string, unknown> = {
          address: bccEmails[i],
        };
        if (bccNames && bccNames[i]) {
          bccField.name = bccNames[i];
        }
        bccFields.push(bccField);
      }
    }

    // Build draft object
    const draft: Record<string, unknown> = {
      body,
    };

    if (subject) draft.subject = subject;
    if (quotePreviousMessage !== undefined) draft.quote_previous_message = quotePreviousMessage;
    if (fromField) draft.from_field = fromField;
    if (toFields.length > 0) draft.to_fields = toFields;
    if (ccFields.length > 0) draft.cc_fields = ccFields;
    if (bccFields.length > 0) draft.bcc_fields = bccFields;
    if (conversationId) draft.conversation = conversationId;
    if (references && references.length > 0) draft.references = references;
    if (teamId) draft.team = teamId;
    if (forceTeam !== undefined) draft.force_team = forceTeam;
    if (organizationId) draft.organization = organizationId;
    if (addUsers && addUsers.length > 0) draft.add_users = addUsers;
    if (addAssignees && addAssignees.length > 0) draft.add_assignees = addAssignees;
    if (addSharedLabels && addSharedLabels.length > 0) draft.add_shared_labels = addSharedLabels;
    if (removeSharedLabels && removeSharedLabels.length > 0) draft.remove_shared_labels = removeSharedLabels;
    if (conversationSubject) draft.conversation_subject = conversationSubject;
    if (conversationColor) draft.conversation_color = conversationColor;
    if (addToInbox !== undefined) draft.add_to_inbox = addToInbox;
    if (addToTeamInbox !== undefined) draft.add_to_team_inbox = addToTeamInbox;
    if (close !== undefined) draft.close = close;
    if (send !== undefined) draft.send = send;
    if (sendAt) draft.send_at = sendAt;
    if (autoFollowup !== undefined) draft.auto_followup = autoFollowup;
    if (externalResponseId) draft.external_response_id = externalResponseId;
    if (externalResponseVariables) draft.external_response_variables = externalResponseVariables;
    if (accountId) draft.account = accountId;

    const response = await missiveApiCall(
      apiToken,
      '/drafts',
      HttpMethod.POST,
      { drafts: draft }
    );

    return response;
  },
}); 