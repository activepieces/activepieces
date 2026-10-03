import { createTrigger, tryCatch, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpError } from '@activepieces/pieces-common';
import { googleWorkspaceAdminAuth } from '../auth';
import { googleAdminClient } from '../common/client';
import { reportsHelpers } from '../common/reports';

const poller = reportsHelpers.createActivityPoller<Record<string, unknown>>({
  getQuery: () => ({ application: 'admin', eventName: 'CREATE_USER' }),
  mapEvents: async ({ auth, events }) =>
    Promise.all(
      events.map(async (event) => {
        const email = event.user_email;
        if (!email) {
          return { ...EMPTY_USER, primary_email: null, created_by: event.actor_email };
        }
        const { data: user, error } = await tryCatch(() => googleAdminClient.getUser({ auth, userKey: email }));
        if (error) {
          if (error instanceof HttpError && error.response.status === 404) {
            return { ...EMPTY_USER, primary_email: email, created_by: event.actor_email };
          }
          throw error;
        }
        return { ...googleAdminClient.flattenUser(user), created_by: event.actor_email };
      }),
    ),
});

export const newUser = createTrigger({
  auth: googleWorkspaceAdminAuth,
  name: 'new_user',
  classification: 'READ',
  displayName: 'New User',
  description: 'Triggers when a new user account is created, with the full user details.',
  aiMetadata: {
    description:
      "Fires once per new Google Workspace user and returns the user's current profile (name, email, org unit, admin status). If the user was already deleted, only the email is returned. Can fire a few minutes after creation.",
  },
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: '101234567890123456789',
    primary_email: 'jane.doe@yourcompany.com',
    first_name: 'Jane',
    last_name: 'Doe',
    full_name: 'Jane Doe',
    is_admin: false,
    is_delegated_admin: false,
    suspended: false,
    suspension_reason: null,
    archived: false,
    org_unit_path: '/Sales',
    change_password_at_next_login: true,
    is_enrolled_in_2sv: false,
    is_enforced_in_2sv: false,
    recovery_email: null,
    recovery_phone: null,
    aliases: '',
    creation_time: '2026-09-30T10:15:00.000Z',
    last_login_time: '1970-01-01T00:00:00.000Z',
    customer_id: 'C01abcdef',
    thumbnail_photo_url: null,
    created_by: 'admin@yourcompany.com',
  },
  async test(context) {
    return poller.test(context);
  },
  async onEnable(context) {
    await poller.onEnable(context);
  },
  async onDisable() {
    return;
  },
  async run(context) {
    return poller.poll(context);
  },
});

const EMPTY_USER = {
  id: null,
  first_name: null,
  last_name: null,
  full_name: null,
  is_admin: null,
  is_delegated_admin: null,
  suspended: null,
  suspension_reason: null,
  archived: null,
  org_unit_path: null,
  change_password_at_next_login: null,
  is_enrolled_in_2sv: null,
  is_enforced_in_2sv: null,
  recovery_email: null,
  recovery_phone: null,
  aliases: null,
  creation_time: null,
  last_login_time: null,
  customer_id: null,
  thumbnail_photo_url: null,
};
