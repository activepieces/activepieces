import { Property } from '@activepieces/pieces-framework';

import { googleWorkspaceActivityTrigger } from '../common/activity-trigger';

export const ACTIVITY_APPLICATIONS: { label: string; value: string }[] = [
  { label: 'Admin console', value: 'admin' },
  { label: 'Login', value: 'login' },
  { label: 'User accounts', value: 'user_accounts' },
  { label: 'Drive', value: 'drive' },
  { label: 'Gmail', value: 'gmail' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Groups', value: 'groups' },
  { label: 'Groups Enterprise', value: 'groups_enterprise' },
  { label: 'Chat', value: 'chat' },
  { label: 'Meet', value: 'meet' },
  { label: 'Meet hardware', value: 'meet_hardware' },
  { label: 'Mobile devices', value: 'mobile' },
  { label: 'Chrome', value: 'chrome' },
  { label: 'Chrome sync', value: 'chrome_sync' },
  { label: 'OAuth tokens', value: 'token' },
  { label: 'SAML', value: 'saml' },
  { label: 'Rules', value: 'rules' },
  { label: 'Context-aware access', value: 'context_aware_access' },
  { label: 'Access transparency', value: 'access_transparency' },
  { label: 'Access evaluation', value: 'access_evaluation' },
  { label: 'Admin data actions', value: 'admin_data_action' },
  { label: 'Google Cloud', value: 'gcp' },
  { label: 'Looker Studio', value: 'data_studio' },
  { label: 'Keep', value: 'keep' },
  { label: 'Vault', value: 'vault' },
  { label: 'Classroom', value: 'classroom' },
  { label: 'Assignments', value: 'assignments' },
  { label: 'Cloud Search', value: 'cloud_search' },
  { label: 'Tasks', value: 'tasks' },
  { label: 'Contacts', value: 'contacts' },
  { label: 'Takeout', value: 'takeout' },
  { label: 'Voice', value: 'voice' },
  { label: 'Data migration', value: 'data_migration' },
  { label: 'Directory Sync', value: 'directory_sync' },
  { label: 'LDAP', value: 'ldap' },
  { label: 'Profile', value: 'profile' },
  { label: 'Graduation', value: 'graduation' },
  { label: 'Gemini in Workspace apps', value: 'gemini_in_workspace_apps' },
  { label: 'Workspace Studio', value: 'workspace_studio' },
  { label: 'Jamboard', value: 'jamboard' },
  { label: 'Google+', value: 'gplus' },
];

export const newApplicationActivityEvent = googleWorkspaceActivityTrigger.create({
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
