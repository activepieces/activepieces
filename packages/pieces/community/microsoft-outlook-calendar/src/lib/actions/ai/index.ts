import { outlookCalendarAddEventAttachmentAction } from './attachments/add-event-attachment';
import { outlookCalendarDeleteEventAttachmentAction } from './attachments/delete-event-attachment';
import { outlookCalendarGetEventAttachmentAction } from './attachments/get-event-attachment';
import { outlookCalendarListEventAttachmentsAction } from './attachments/list-event-attachments';
import { outlookCalendarCreateCalendarGroupAction } from './calendar-groups/create-calendar-group';
import { outlookCalendarCreateCalendarInGroupAction } from './calendar-groups/create-calendar-in-group';
import { outlookCalendarDeleteCalendarGroupAction } from './calendar-groups/delete-calendar-group';
import { outlookCalendarGetCalendarGroupAction } from './calendar-groups/get-calendar-group';
import { outlookCalendarListCalendarGroupsAction } from './calendar-groups/list-calendar-groups';
import { outlookCalendarListCalendarsInGroupAction } from './calendar-groups/list-calendars-in-group';
import { outlookCalendarUpdateCalendarGroupAction } from './calendar-groups/update-calendar-group';
import { outlookCalendarCreateCalendarAction } from './calendars/create-calendar';
import { outlookCalendarDeleteCalendarAction } from './calendars/delete-calendar';
import { outlookCalendarGetCalendarAction } from './calendars/get-calendar';
import { outlookCalendarListCalendarsAction } from './calendars/list-calendars';
import { outlookCalendarPermanentlyDeleteCalendarAction } from './calendars/permanently-delete-calendar';
import { outlookCalendarUpdateCalendarAction } from './calendars/update-calendar';
import { outlookCalendarCreateEventAction } from './events/create-event';
import { outlookCalendarDeleteEventAction } from './events/delete-event';
import { outlookCalendarGetCalendarViewAction } from './events/get-calendar-view';
import { outlookCalendarGetCalendarViewDeltaAction } from './events/get-calendar-view-delta';
import { outlookCalendarGetEventAction } from './events/get-event';
import { outlookCalendarGetEventCalendarAction } from './events/get-event-calendar';
import { outlookCalendarListEventInstancesAction } from './events/list-event-instances';
import { outlookCalendarListEventsAction } from './events/list-events';
import { outlookCalendarPermanentlyDeleteEventAction } from './events/permanently-delete-event';
import { outlookCalendarUpdateEventAction } from './events/update-event';
import { outlookCalendarCreateEventExtensionAction } from './extensions/create-event-extension';
import { outlookCalendarDeleteEventExtensionAction } from './extensions/delete-event-extension';
import { outlookCalendarGetEventExtensionAction } from './extensions/get-event-extension';
import { outlookCalendarUpdateEventExtensionAction } from './extensions/update-event-extension';
import { outlookCalendarDismissReminderAction } from './reminders/dismiss-reminder';
import { outlookCalendarListRemindersAction } from './reminders/list-reminders';
import { outlookCalendarSnoozeReminderAction } from './reminders/snooze-reminder';
import { outlookCalendarAcceptEventAction } from './responses/accept-event';
import { outlookCalendarCancelEventAction } from './responses/cancel-event';
import { outlookCalendarDeclineEventAction } from './responses/decline-event';
import { outlookCalendarForwardEventAction } from './responses/forward-event';
import { outlookCalendarTentativelyAcceptEventAction } from './responses/tentatively-accept-event';
import { outlookCalendarGetScheduleAction } from './scheduling/get-schedule';
import { outlookCalendarGetSupportedTimeZonesAction } from './scheduling/get-supported-time-zones';
import { outlookCalendarCreateCalendarPermissionAction } from './sharing/create-calendar-permission';
import { outlookCalendarDeleteCalendarPermissionAction } from './sharing/delete-calendar-permission';
import { outlookCalendarGetAllowedSharingRolesAction } from './sharing/get-allowed-sharing-roles';
import { outlookCalendarGetCalendarPermissionAction } from './sharing/get-calendar-permission';
import { outlookCalendarListCalendarPermissionsAction } from './sharing/list-calendar-permissions';
import { outlookCalendarUpdateCalendarPermissionAction } from './sharing/update-calendar-permission';

export const outlookCalendarAiActions = [
  outlookCalendarAddEventAttachmentAction,
  outlookCalendarDeleteEventAttachmentAction,
  outlookCalendarGetEventAttachmentAction,
  outlookCalendarListEventAttachmentsAction,
  outlookCalendarCreateCalendarGroupAction,
  outlookCalendarCreateCalendarInGroupAction,
  outlookCalendarDeleteCalendarGroupAction,
  outlookCalendarGetCalendarGroupAction,
  outlookCalendarListCalendarGroupsAction,
  outlookCalendarListCalendarsInGroupAction,
  outlookCalendarUpdateCalendarGroupAction,
  outlookCalendarCreateCalendarAction,
  outlookCalendarDeleteCalendarAction,
  outlookCalendarGetCalendarAction,
  outlookCalendarListCalendarsAction,
  outlookCalendarPermanentlyDeleteCalendarAction,
  outlookCalendarUpdateCalendarAction,
  outlookCalendarCreateEventAction,
  outlookCalendarDeleteEventAction,
  outlookCalendarGetCalendarViewDeltaAction,
  outlookCalendarGetCalendarViewAction,
  outlookCalendarGetEventCalendarAction,
  outlookCalendarGetEventAction,
  outlookCalendarListEventInstancesAction,
  outlookCalendarListEventsAction,
  outlookCalendarPermanentlyDeleteEventAction,
  outlookCalendarUpdateEventAction,
  outlookCalendarCreateEventExtensionAction,
  outlookCalendarDeleteEventExtensionAction,
  outlookCalendarGetEventExtensionAction,
  outlookCalendarUpdateEventExtensionAction,
  outlookCalendarDismissReminderAction,
  outlookCalendarListRemindersAction,
  outlookCalendarSnoozeReminderAction,
  outlookCalendarAcceptEventAction,
  outlookCalendarCancelEventAction,
  outlookCalendarDeclineEventAction,
  outlookCalendarForwardEventAction,
  outlookCalendarTentativelyAcceptEventAction,
  outlookCalendarGetScheduleAction,
  outlookCalendarGetSupportedTimeZonesAction,
  outlookCalendarCreateCalendarPermissionAction,
  outlookCalendarDeleteCalendarPermissionAction,
  outlookCalendarGetAllowedSharingRolesAction,
  outlookCalendarGetCalendarPermissionAction,
  outlookCalendarListCalendarPermissionsAction,
  outlookCalendarUpdateCalendarPermissionAction,
];
