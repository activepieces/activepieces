import { Property } from '@activepieces/pieces-framework';

import type { ActivityEvent } from '../common/activities';
import { createActivityTrigger } from '../common/activity-trigger';

export const USER_EVENT_KINDS: { label: string; value: string; events: string[] }[] = [
  { label: 'User created', value: 'created', events: ['CREATE_USER'] },
  { label: 'User deleted', value: 'deleted', events: ['DELETE_USER'] },
  { label: 'User undeleted', value: 'undeleted', events: ['UNDELETE_USER'] },
  { label: 'User suspended', value: 'suspended', events: ['SUSPEND_USER'] },
  { label: 'User unsuspended', value: 'unsuspended', events: ['UNSUSPEND_USER'] },
  {
    label: 'Admin status changed',
    value: 'admin_changed',
    events: ['GRANT_ADMIN_PRIVILEGE', 'REVOKE_ADMIN_PRIVILEGE', 'GRANT_DELEGATED_ADMIN_PRIVILEGES', 'REVOKE_DELEGATED_ADMIN_PRIVILEGES'],
  },
  { label: 'User updated (any other change)', value: 'updated', events: [] },
];

const LIFECYCLE_EVENTS = new Set(USER_EVENT_KINDS.flatMap((k) => k.events));

export function acceptUserEvent({ event, props }: { event: ActivityEvent; props: UserEventFilter }): boolean {
  const eventName = event.eventName;
  if (event.eventType !== 'USER_SETTINGS' || !eventName) return false;

  const wanted = new Set(props.kinds ?? []);
  const kind = USER_EVENT_KINDS.find((k) => k.events.includes(eventName));
  const matchesKind = kind ? wanted.has(kind.value) : wanted.has('updated') && !LIFECYCLE_EVENTS.has(eventName);
  if (!matchesKind) return false;

  const domain = props.domain?.trim().toLowerCase();
  if (!domain) return true;
  const userEmail = String(event.parameters['USER_EMAIL'] ?? '').toLowerCase();
  return userEmail.endsWith(`@${domain}`);
}

export const newUserEvent = createActivityTrigger({
  name: 'newUserEvent',
  classification: 'READ',
  displayName: 'New User Event',
  description:
    'Fires when a user is created, deleted, suspended, undeleted, promoted/demoted as admin or otherwise changed, in real time through a push notification',
  aiMetadata: {
    description:
      'Fires on Google Workspace user lifecycle events from the Admin console audit log: created, deleted, undeleted, suspended, unsuspended, admin status changed, or any other user change, optionally limited to one domain. Emits one item per matching event.',
  },
  props: {
    kinds: Property.StaticMultiSelectDropdown<string, true>({
      displayName: 'User Events',
      description: 'Which lifecycle events to fire on.',
      required: true,
      defaultValue: ['created'],
      options: { options: USER_EVENT_KINDS.map(({ label, value }) => ({ label, value })) },
    }),
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Only users of this domain (e.g. `example.com`). Leave empty for every domain of the account.',
      required: false,
    }),
  },
  query: () => ({ application: 'admin' }),
  accept: ({ event, props }) => acceptUserEvent({ event, props: { kinds: props.kinds, domain: props.domain } }),
});

type UserEventFilter = { kinds: string[]; domain?: string | undefined };
