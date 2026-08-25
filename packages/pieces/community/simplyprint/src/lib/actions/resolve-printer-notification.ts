import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const resolvePrinterNotificationAction = createAction({
  auth: simplyprintAuth,
  name: 'resolve_printer_notification',
  displayName: 'Resolve Printer Notification',
  description:
    'Mark a printer notification as resolved (or dismissed). For notifications with multiple actions, pass `action` to pick one or `force: true` to resolve without choosing.',
  audience: 'both',
  aiMetadata: { description: 'Resolve or dismiss one printer notification by its event ID. For multi-action notifications, pick a specific action key, or force-resolve to clear it without choosing; set dismiss to mark it dismissed instead of resolved. Idempotent: resolving an already-handled notification has no further effect.', idempotent: true },
  props: {
    printerId: Property.Number({
      displayName: 'Printer ID',
      description: 'Numeric printer ID the notification belongs to.',
      required: true,
    }),
    notificationId: Property.Number({
      displayName: 'Notification ID',
      description: 'Numeric notification event ID. Use "Get Printer Notifications" to look it up.',
      required: true,
    }),
    action: Property.ShortText({
      displayName: 'Action key (optional)',
      description: 'For multi-action notifications, the action key to invoke. Leave empty for single-action or dismiss-only notifications.',
      required: false,
    }),
    force: Property.Checkbox({
      displayName: 'Force resolve',
      description: 'Resolve immediately even if multiple actions are available (skips picking one).',
      required: false,
      defaultValue: false,
    }),
    dismiss: Property.Checkbox({
      displayName: 'Dismiss',
      description: 'Mark as dismissed rather than resolved.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // RequirePrinter (singular) reads `pid` from $this->GET.
    // POST body needs `notifications: [{id, action?, force?, dismiss?}]`.
    const entry: Record<string, unknown> = { id: context.propsValue.notificationId };
    if (context.propsValue.action) entry['action'] = context.propsValue.action;
    if (context.propsValue.force) entry['force'] = true;
    if (context.propsValue.dismiss) entry['dismiss'] = true;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/notification/Resolve',
      queryParams: { pid: String(context.propsValue.printerId) },
      body: { notifications: [entry] },
    });
  },
});
