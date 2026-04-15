/**
 * Chat type for Manual Entry actions only.
 *
 * Used by the "Send To" static dropdown in manual entry actions
 * to determine the chatId suffix:
 *   - CONTACT → appends @c.us
 *   - GROUP   → appends @g.us
 *
 * Channels (@newsletter) are NOT included here because they are
 * handled by dedicated channel actions with a dropdown that returns
 * pre-formatted values. See recipients.ts (Sprint 2) for the full
 * recipient resolution logic.
 */
export enum ChatType {
  CONTACT = 'contact',
  GROUP = 'group',
}
