import { Property } from '@activepieces/pieces-framework';

import { ACTIVITY_APPLICATIONS } from '../common/activities';
import { createActivityTrigger } from '../common/activity-trigger';

export const newApplicationActivityEvent = createActivityTrigger({
  name: 'newApplicationActivityEvent',
  classification: 'READ',
  displayName: 'New Application Activity Event',
  description:
    'Fires on an audit event of a Google Workspace application (Drive, Login, Calendar, Groups, Mobile, ...), in real time through a push notification',
  aiMetadata: {
    description:
      'Fires when the selected Google Workspace application (Drive, Login, Calendar, Groups, Mobile and others) records an audit event, optionally limited to one event name and parameter filters. Emits one item per audit event.',
  },
  props: {
    application: Property.StaticDropdown<string, true>({
      displayName: 'Application',
      description: 'Which audit log to watch.',
      required: true,
      options: { options: ACTIVITY_APPLICATIONS },
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description:
        'Only this event of the application, e.g. `login_success` (Login), `download` / `create` / `edit` (Drive), `change_calendar_acls` (Calendar), `DEVICE_REGISTER_UNREGISTER_EVENT` (Mobile). Leave empty for every event. Names per application: https://developers.google.com/workspace/admin/reports/v1/appendix',
      required: false,
    }),
    filters: Property.ShortText({
      displayName: 'Filters',
      description:
        'Optional event-parameter conditions, comma-separated, in the Reports API `filters` syntax, e.g. `doc_type==spreadsheet` or `login_type==google_password`.',
      required: false,
    }),
  },
  query: (props) => ({
    application: props.application,
    eventName: props.eventName ?? undefined,
    filters: props.filters ?? undefined,
  }),
});
