import { Property } from '@activepieces/pieces-framework';

import { createActivityTrigger } from '../common/activity-trigger';

export const newAdminActivityEvent = createActivityTrigger({
  name: 'newAdminActivityEvent',
  classification: 'READ',
  displayName: 'New Admin Activity Event',
  description:
    'Fires when an administrator performs an action in the Admin console (audit log "admin"), in real time through a push notification',
  aiMetadata: {
    description:
      'Fires when an administrator action is recorded in the Google Workspace Admin console audit log, optionally limited to one event name and parameter filters. Emits one item per audit event; Google may group several events of one activity in a single notification.',
  },
  props: {
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description:
        'Only this admin audit event, e.g. `CREATE_USER`, `DELETE_USER`, `CHANGE_PASSWORD`, `ADD_GROUP_MEMBER`, `CREATE_ORG_UNIT`, `CHANGE_APPLICATION_SETTING`. Leave empty for every admin event. Names: https://developers.google.com/workspace/admin/reports/v1/appendix/activity/admin',
      required: false,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description:
        'Optional event-parameter conditions, comma-separated, in the Reports API `filters` syntax, e.g. `USER_EMAIL==jane@example.com` or `ORG_UNIT_NAME==Sales`.',
      required: false,
    }),
  },
  query: (props) => ({
    application: 'admin',
    eventName: props.eventName ?? undefined,
    filters: props.filters ?? undefined,
  }),
});
