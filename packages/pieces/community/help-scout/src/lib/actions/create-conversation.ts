import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../auth';
import { helpScoutCommon } from '../common/client';
import { Conversation } from '../common/types';

export const createConversation = createAction({
  auth: helpScoutAuth,
  name: 'create-conversation',
  displayName: 'Create Conversation',
  description: 'Creates a new conversation in Help Scout',
  props: {
    mailboxId: helpScoutCommon.mailboxDropdown,
    type: helpScoutCommon.conversationType,
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Conversation subject',
      required: true,
    }),
    customerEmail: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email of the customer',
      required: true,
    }),
    messageBody: Property.LongText({
      displayName: 'Message Body',
      description: 'Initial message content',
      required: true,
    }),
    status: helpScoutCommon.conversationStatus,
    assignedTo: helpScoutCommon.userDropdown,
    tags: helpScoutCommon.tags,
    customFields: helpScoutCommon.customFields,
    autoReply: Property.Checkbox({
      displayName: 'Auto Reply',
      description: 'Whether to send an auto-reply',
      required: false,
      defaultValue: false,
    }),
    imported: Property.Checkbox({
      displayName: 'Imported',
      description: 'Mark as imported conversation',
      required: false,
      defaultValue: false,
    }),
    closedAt: Property.DateTime({
      displayName: 'Closed At',
      description: 'When the conversation was closed (for imported conversations)',
      required: false,
    }),
    createdAt: Property.DateTime({
      displayName: 'Created At',
      description: 'When the conversation was created (for imported conversations)',
      required: false,
    }),
  },
  async run(context) {
    const {
      mailboxId,
      type,
      subject,
      customerEmail,
      messageBody,
      status,
      assignedTo,
      tags,
      customFields,
      autoReply,
      imported,
      closedAt,
      createdAt,
    } = context.propsValue;

    // First, find or create the customer
    let customer;
    try {
      const customers = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.GET,
        '/customers',
        undefined,
        { email: customerEmail }
      );

      if (customers._embedded.customers.length > 0) {
        customer = customers._embedded.customers[0];
      } else {
        // Create new customer
        customer = await helpScoutCommon.makeRequest(
          context.auth,
          HttpMethod.POST,
          '/customers',
          {
            firstName: customerEmail.split('@')[0],
            email: customerEmail,
          }
        );
      }
    } catch (error) {
      throw new Error(`Failed to find or create customer: ${error}`);
    }

    // Prepare conversation data
    const conversationData: any = {
      type: type || 'email',
      subject,
      mailboxId: parseInt(mailboxId),
      status: status || 'active',
      customer: {
        id: customer.id,
        email: customerEmail,
      },
      threads: [
        {
          type: 'customer',
          customer: {
            id: customer.id,
            email: customerEmail,
          },
          text: messageBody,
        },
      ],
      autoReply: autoReply || false,
      imported: imported || false,
    };

    // Add optional fields
    if (assignedTo) {
      conversationData.assignTo = parseInt(assignedTo);
    }

    if (tags && tags.length > 0) {
      conversationData.tags = tags;
    }

    if (customFields && Object.keys(customFields).length > 0) {
      conversationData.customFields = customFields;
    }

    if (closedAt) {
      conversationData.closedAt = closedAt;
    }

    if (createdAt) {
      conversationData.createdAt = createdAt;
    }

    try {
      const conversation = await helpScoutCommon.makeRequest(
        context.auth,
        HttpMethod.POST,
        '/conversations',
        conversationData
      );

      return {
        success: true,
        conversation,
      };
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error}`);
    }
  },
});