import { ChatType } from './types';

/**
 * Recipient types for WhatsScale actions.
 *
 * DROPDOWN recipients (Contact, Group, Channel) return pre-formatted
 * chatId values from the proxy RPC endpoints — no suffix needed.
 *
 * MANUAL recipient appends @c.us or @g.us based on ChatType.
 *
 * CRM_CONTACT uses a different body shape entirely — no chatId,
 * instead sends contact_type + crm_contact_id.
 */
export enum RecipientType {
  CONTACT = 'contact',
  GROUP = 'group',
  CHANNEL = 'channel',
  MANUAL = 'manual',
  CRM_CONTACT = 'crm_contact',
}

/**
 * Build the message body for any recipient type.
 *
 * @param type - The recipient type
 * @param session - WhatsApp session ID
 * @param recipientValue - The dropdown value or manual entry
 * @param chatType - Only used for MANUAL type (ChatType.CONTACT or ChatType.GROUP)
 * @returns Object to spread into the API request body
 */
export function buildRecipientBody(
  type: RecipientType,
  session: string,
  recipientValue: string,
  chatType?: ChatType,
): Record<string, string> {
  const base: Record<string, string> = { session };

  switch (type) {
    case RecipientType.CONTACT:
    case RecipientType.GROUP:
    case RecipientType.CHANNEL:
      // Dropdown values are pre-formatted (e.g., 31649931832@c.us, xxx@newsletter)
      return { ...base, chatId: recipientValue };

    case RecipientType.MANUAL: {
      const suffix = chatType === ChatType.CONTACT ? '@c.us' : '@g.us';
      return { ...base, chatId: recipientValue.includes('@') ? recipientValue : recipientValue + suffix };
    }

    case RecipientType.CRM_CONTACT:
      return {
        ...base,
        contact_type: 'crm_contact',
        crm_contact_id: recipientValue,
      };

    default:
      throw new Error(`Unknown recipient type: ${type}`);
  }
}
