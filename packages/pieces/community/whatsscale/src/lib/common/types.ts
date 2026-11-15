/**
 * Chat type for Manual Entry / agent-facing actions.
 *
 * Used by the "Send To" dropdown to determine how the raw recipient
 * value gets turned into a request body:
 *   - CONTACT     → appends @c.us if missing
 *   - GROUP       → appends @g.us if missing
 *   - CHANNEL     → appends @newsletter if missing
 *   - CRM_CONTACT → not a chatId at all, sent as contact_type + crm_contact_id
 *
 * See recipients.ts for the full resolution logic.
 */
export enum ChatType {
  CONTACT = 'contact',
  GROUP = 'group',
  CHANNEL = 'channel',
  CRM_CONTACT = 'crm_contact',
}
