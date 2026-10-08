import { mauticCreateAssetAction } from './assets/create-asset';
import { mauticDeleteAssetAction } from './assets/delete-asset';
import { mauticGetAssetAction } from './assets/get-asset';
import { mauticListAssetsAction } from './assets/list-assets';
import { mauticUpdateAssetAction } from './assets/update-asset';
import { mauticAddContactToCampaignAction } from './campaigns/add-contact-to-campaign';
import { mauticBatchRescheduleContactCampaignEventsAction } from './campaigns/batch-reschedule-contact-campaign-events';
import { mauticCloneCampaignAction } from './campaigns/clone-campaign';
import { mauticCreateCampaignAction } from './campaigns/create-campaign';
import { mauticDeleteCampaignAction } from './campaigns/delete-campaign';
import { mauticExportCampaignAction } from './campaigns/export-campaign';
import { mauticGetCampaignAction } from './campaigns/get-campaign';
import { mauticGetCampaignEventAction } from './campaigns/get-campaign-event';
import { mauticImportCampaignAction } from './campaigns/import-campaign';
import { mauticListCampaignContactEventsAction } from './campaigns/list-campaign-contact-events';
import { mauticListCampaignContactsAction } from './campaigns/list-campaign-contacts';
import { mauticListCampaignEventsAction } from './campaigns/list-campaign-events';
import { mauticListCampaignsAction } from './campaigns/list-campaigns';
import { mauticListContactCampaignEventsAction } from './campaigns/list-contact-campaign-events';
import { mauticRemoveContactFromCampaignAction } from './campaigns/remove-contact-from-campaign';
import { mauticRescheduleContactCampaignEventAction } from './campaigns/reschedule-contact-campaign-event';
import { mauticUpdateCampaignAction } from './campaigns/update-campaign';
import { mauticCreateCategoryAction } from './categories/create-category';
import { mauticDeleteCategoryAction } from './categories/delete-category';
import { mauticGetCategoryAction } from './categories/get-category';
import { mauticListCategoriesAction } from './categories/list-categories';
import { mauticUpdateCategoryAction } from './categories/update-category';
import { mauticAddContactToCompanyAction } from './companies/add-contact-to-company';
import { mauticBatchCreateCompaniesAction } from './companies/batch-create-companies';
import { mauticBatchDeleteCompaniesAction } from './companies/batch-delete-companies';
import { mauticBatchUpdateCompaniesAction } from './companies/batch-update-companies';
import { mauticCreateCompanyAction } from './companies/create-company';
import { mauticDeleteCompanyAction } from './companies/delete-company';
import { mauticGetCompanyAction } from './companies/get-company';
import { mauticListCompaniesAction } from './companies/list-companies';
import { mauticRemoveContactFromCompanyAction } from './companies/remove-contact-from-company';
import { mauticUpdateCompanyAction } from './companies/update-company';
import { mauticAddContactUtmTagsAction } from './contacts/add-contact-utm-tags';
import { mauticAddDoNotContactAction } from './contacts/add-do-not-contact';
import { mauticAdjustContactGroupPointsAction } from './contacts/adjust-contact-group-points';
import { mauticAdjustContactPointsAction } from './contacts/adjust-contact-points';
import { mauticBatchCreateContactsAction } from './contacts/batch-create-contacts';
import { mauticBatchDeleteContactsAction } from './contacts/batch-delete-contacts';
import { mauticBatchUpdateContactsAction } from './contacts/batch-update-contacts';
import { mauticCreateContactAction } from './contacts/create-contact';
import { mauticDeleteContactAction } from './contacts/delete-contact';
import { mauticGetContactAction } from './contacts/get-contact';
import { mauticGetContactPointGroupAction } from './contacts/get-contact-point-group';
import { mauticListActivityAction } from './contacts/list-activity';
import { mauticListAvailableSegmentsAction } from './contacts/list-available-segments';
import { mauticListContactActivityAction } from './contacts/list-contact-activity';
import { mauticListContactCampaignsAction } from './contacts/list-contact-campaigns';
import { mauticListContactCompaniesAction } from './contacts/list-contact-companies';
import { mauticListContactDevicesAction } from './contacts/list-contact-devices';
import { mauticListContactFieldsAction } from './contacts/list-contact-fields';
import { mauticListContactNotesAction } from './contacts/list-contact-notes';
import { mauticListContactOwnersAction } from './contacts/list-contact-owners';
import { mauticListContactPointGroupsAction } from './contacts/list-contact-point-groups';
import { mauticListContactSegmentsAction } from './contacts/list-contact-segments';
import { mauticListContactsAction } from './contacts/list-contacts';
import { mauticRemoveContactUtmTagsAction } from './contacts/remove-contact-utm-tags';
import { mauticRemoveDoNotContactAction } from './contacts/remove-do-not-contact';
import { mauticUpdateContactAction } from './contacts/update-contact';
import { mauticCreateDeviceAction } from './devices/create-device';
import { mauticDeleteDeviceAction } from './devices/delete-device';
import { mauticGetDeviceAction } from './devices/get-device';
import { mauticListDevicesAction } from './devices/list-devices';
import { mauticUpdateDeviceAction } from './devices/update-device';
import { mauticCreateDynamicContentAction } from './dynamic-content/create-dynamic-content';
import { mauticDeleteDynamicContentAction } from './dynamic-content/delete-dynamic-content';
import { mauticGetDynamicContentAction } from './dynamic-content/get-dynamic-content';
import { mauticListDynamicContentsAction } from './dynamic-content/list-dynamic-contents';
import { mauticUpdateDynamicContentAction } from './dynamic-content/update-dynamic-content';
import { mauticCreateEmailAction } from './emails/create-email';
import { mauticDeleteEmailAction } from './emails/delete-email';
import { mauticGetEmailAction } from './emails/get-email';
import { mauticListEmailsAction } from './emails/list-emails';
import { mauticRecordEmailReplyAction } from './emails/record-email-reply';
import { mauticSendEmailToContactAction } from './emails/send-email-to-contact';
import { mauticSendSegmentEmailAction } from './emails/send-segment-email';
import { mauticUpdateEmailAction } from './emails/update-email';
import { mauticCreateFieldAction } from './fields/create-field';
import { mauticDeleteFieldAction } from './fields/delete-field';
import { mauticGetFieldAction } from './fields/get-field';
import { mauticListFieldsAction } from './fields/list-fields';
import { mauticUpdateFieldAction } from './fields/update-field';
import { mauticDeleteFileAction } from './files/delete-file';
import { mauticDeleteThemeAction } from './files/delete-theme';
import { mauticGetThemeAction } from './files/get-theme';
import { mauticListFilesAction } from './files/list-files';
import { mauticListThemesAction } from './files/list-themes';
import { mauticUploadFileAction } from './files/upload-file';
import { mauticUploadThemeAction } from './files/upload-theme';
import { mauticCreateFocusItemAction } from './focus-items/create-focus-item';
import { mauticDeleteFocusItemAction } from './focus-items/delete-focus-item';
import { mauticGenerateFocusItemJsAction } from './focus-items/generate-focus-item-js';
import { mauticGetFocusItemAction } from './focus-items/get-focus-item';
import { mauticListFocusItemsAction } from './focus-items/list-focus-items';
import { mauticUpdateFocusItemAction } from './focus-items/update-focus-item';
import { mauticCreateFormAction } from './forms/create-form';
import { mauticDeleteFormAction } from './forms/delete-form';
import { mauticDeleteFormActionsAction } from './forms/delete-form-actions';
import { mauticDeleteFormFieldsAction } from './forms/delete-form-fields';
import { mauticGetFormAction } from './forms/get-form';
import { mauticGetFormSubmissionAction } from './forms/get-form-submission';
import { mauticListContactFormSubmissionsAction } from './forms/list-contact-form-submissions';
import { mauticListFormSubmissionsAction } from './forms/list-form-submissions';
import { mauticListFormsAction } from './forms/list-forms';
import { mauticUpdateFormAction } from './forms/update-form';
import { mauticCreatePageAction } from './landing-pages/create-page';
import { mauticDeletePageAction } from './landing-pages/delete-page';
import { mauticGetPageAction } from './landing-pages/get-page';
import { mauticListPagesAction } from './landing-pages/list-pages';
import { mauticUpdatePageAction } from './landing-pages/update-page';
import { mauticCreateMarketingMessageAction } from './marketing-messages/create-marketing-message';
import { mauticDeleteMarketingMessageAction } from './marketing-messages/delete-marketing-message';
import { mauticGetMarketingMessageAction } from './marketing-messages/get-marketing-message';
import { mauticListMarketingMessagesAction } from './marketing-messages/list-marketing-messages';
import { mauticUpdateMarketingMessageAction } from './marketing-messages/update-marketing-message';
import { mauticCreateNoteAction } from './notes/create-note';
import { mauticDeleteNoteAction } from './notes/delete-note';
import { mauticGetNoteAction } from './notes/get-note';
import { mauticListNotesAction } from './notes/list-notes';
import { mauticUpdateNoteAction } from './notes/update-note';
import { mauticCreatePointActionAction } from './point-actions/create-point-action';
import { mauticDeletePointActionAction } from './point-actions/delete-point-action';
import { mauticGetPointActionAction } from './point-actions/get-point-action';
import { mauticListPointActionTypesAction } from './point-actions/list-point-action-types';
import { mauticListPointActionsAction } from './point-actions/list-point-actions';
import { mauticUpdatePointActionAction } from './point-actions/update-point-action';
import { mauticCreatePointGroupAction } from './point-groups/create-point-group';
import { mauticDeletePointGroupAction } from './point-groups/delete-point-group';
import { mauticGetPointGroupAction } from './point-groups/get-point-group';
import { mauticListPointGroupsAction } from './point-groups/list-point-groups';
import { mauticUpdatePointGroupAction } from './point-groups/update-point-group';
import { mauticCreatePointInsightAction } from './point-insights/create-point-insight';
import { mauticDeletePointInsightAction } from './point-insights/delete-point-insight';
import { mauticGetPointInsightAction } from './point-insights/get-point-insight';
import { mauticListPointInsightsAction } from './point-insights/list-point-insights';
import { mauticUpdatePointInsightAction } from './point-insights/update-point-insight';
import { mauticCreatePointTriggerAction } from './point-triggers/create-point-trigger';
import { mauticDeletePointTriggerAction } from './point-triggers/delete-point-trigger';
import { mauticDeletePointTriggerEventsAction } from './point-triggers/delete-point-trigger-events';
import { mauticGetPointTriggerAction } from './point-triggers/get-point-trigger';
import { mauticListPointTriggerEventTypesAction } from './point-triggers/list-point-trigger-event-types';
import { mauticListPointTriggersAction } from './point-triggers/list-point-triggers';
import { mauticUpdatePointTriggerAction } from './point-triggers/update-point-trigger';
import { mauticCreatePushNotificationAction } from './push-notifications/create-push-notification';
import { mauticDeletePushNotificationAction } from './push-notifications/delete-push-notification';
import { mauticGetPushNotificationAction } from './push-notifications/get-push-notification';
import { mauticListPushNotificationsAction } from './push-notifications/list-push-notifications';
import { mauticUpdatePushNotificationAction } from './push-notifications/update-push-notification';
import { mauticCreateReportAction } from './reports/create-report';
import { mauticDeleteReportAction } from './reports/delete-report';
import { mauticGetDashboardWidgetDataAction } from './reports/get-dashboard-widget-data';
import { mauticGetReportAction } from './reports/get-report';
import { mauticGetStatsAction } from './reports/get-stats';
import { mauticListDashboardWidgetTypesAction } from './reports/list-dashboard-widget-types';
import { mauticListReportsAction } from './reports/list-reports';
import { mauticUpdateReportAction } from './reports/update-report';
import { mauticAddContactToSegmentAction } from './segments/add-contact-to-segment';
import { mauticAddContactsToSegmentAction } from './segments/add-contacts-to-segment';
import { mauticCreateSegmentAction } from './segments/create-segment';
import { mauticDeleteSegmentAction } from './segments/delete-segment';
import { mauticGetSegmentAction } from './segments/get-segment';
import { mauticListSegmentsAction } from './segments/list-segments';
import { mauticRemoveContactFromSegmentAction } from './segments/remove-contact-from-segment';
import { mauticUpdateSegmentAction } from './segments/update-segment';
import { mauticAddContactToStageAction } from './stages/add-contact-to-stage';
import { mauticCreateStageAction } from './stages/create-stage';
import { mauticDeleteStageAction } from './stages/delete-stage';
import { mauticGetStageAction } from './stages/get-stage';
import { mauticListStagesAction } from './stages/list-stages';
import { mauticRemoveContactFromStageAction } from './stages/remove-contact-from-stage';
import { mauticUpdateStageAction } from './stages/update-stage';
import { mauticCreateTagAction } from './tags/create-tag';
import { mauticDeleteTagAction } from './tags/delete-tag';
import { mauticGetTagAction } from './tags/get-tag';
import { mauticListTagsAction } from './tags/list-tags';
import { mauticUpdateTagAction } from './tags/update-tag';
import { mauticCreateSmsAction } from './text-messages/create-sms';
import { mauticDeleteSmsAction } from './text-messages/delete-sms';
import { mauticGetSmsAction } from './text-messages/get-sms';
import { mauticListSmsesAction } from './text-messages/list-smses';
import { mauticSendSmsToContactAction } from './text-messages/send-sms-to-contact';
import { mauticUpdateSmsAction } from './text-messages/update-sms';
import { mauticCreateTweetAction } from './tweets/create-tweet';
import { mauticDeleteTweetAction } from './tweets/delete-tweet';
import { mauticGetTweetAction } from './tweets/get-tweet';
import { mauticListTweetsAction } from './tweets/list-tweets';
import { mauticUpdateTweetAction } from './tweets/update-tweet';
import { mauticCheckUserPermissionsAction } from './users/check-user-permissions';
import { mauticCreateRoleAction } from './users/create-role';
import { mauticCreateUserAction } from './users/create-user';
import { mauticDeleteRoleAction } from './users/delete-role';
import { mauticDeleteUserAction } from './users/delete-user';
import { mauticGetCurrentUserAction } from './users/get-current-user';
import { mauticGetRoleAction } from './users/get-role';
import { mauticGetUserAction } from './users/get-user';
import { mauticListAssignableRolesAction } from './users/list-assignable-roles';
import { mauticListRolesAction } from './users/list-roles';
import { mauticListUsersAction } from './users/list-users';
import { mauticUpdateRoleAction } from './users/update-role';
import { mauticUpdateUserAction } from './users/update-user';

export const mauticAiActions = [
	mauticListContactsAction,
	mauticGetContactAction,
	mauticCreateContactAction,
	mauticUpdateContactAction,
	mauticDeleteContactAction,
	mauticListActivityAction,
	mauticListContactActivityAction,
	mauticListContactFieldsAction,
	mauticListContactOwnersAction,
	mauticListAvailableSegmentsAction,
	mauticListContactCampaignsAction,
	mauticListContactCompaniesAction,
	mauticListContactNotesAction,
	mauticListContactSegmentsAction,
	mauticListContactDevicesAction,
	mauticAddDoNotContactAction,
	mauticRemoveDoNotContactAction,
	mauticAddContactUtmTagsAction,
	mauticRemoveContactUtmTagsAction,
	mauticAdjustContactPointsAction,
	mauticListContactPointGroupsAction,
	mauticGetContactPointGroupAction,
	mauticAdjustContactGroupPointsAction,
	mauticBatchCreateContactsAction,
	mauticBatchUpdateContactsAction,
	mauticBatchDeleteContactsAction,
	mauticListCompaniesAction,
	mauticGetCompanyAction,
	mauticCreateCompanyAction,
	mauticUpdateCompanyAction,
	mauticDeleteCompanyAction,
	mauticAddContactToCompanyAction,
	mauticRemoveContactFromCompanyAction,
	mauticBatchCreateCompaniesAction,
	mauticBatchUpdateCompaniesAction,
	mauticBatchDeleteCompaniesAction,
	mauticListSegmentsAction,
	mauticGetSegmentAction,
	mauticCreateSegmentAction,
	mauticUpdateSegmentAction,
	mauticDeleteSegmentAction,
	mauticAddContactToSegmentAction,
	mauticRemoveContactFromSegmentAction,
	mauticAddContactsToSegmentAction,
	mauticListCampaignsAction,
	mauticGetCampaignAction,
	mauticCreateCampaignAction,
	mauticUpdateCampaignAction,
	mauticDeleteCampaignAction,
	mauticCloneCampaignAction,
	mauticAddContactToCampaignAction,
	mauticRemoveContactFromCampaignAction,
	mauticListCampaignContactsAction,
	mauticListCampaignEventsAction,
	mauticGetCampaignEventAction,
	mauticListContactCampaignEventsAction,
	mauticListCampaignContactEventsAction,
	mauticRescheduleContactCampaignEventAction,
	mauticBatchRescheduleContactCampaignEventsAction,
	mauticExportCampaignAction,
	mauticImportCampaignAction,
	mauticListEmailsAction,
	mauticGetEmailAction,
	mauticCreateEmailAction,
	mauticUpdateEmailAction,
	mauticDeleteEmailAction,
	mauticSendEmailToContactAction,
	mauticSendSegmentEmailAction,
	mauticRecordEmailReplyAction,
	mauticListSmsesAction,
	mauticGetSmsAction,
	mauticCreateSmsAction,
	mauticUpdateSmsAction,
	mauticDeleteSmsAction,
	mauticSendSmsToContactAction,
	mauticListNotesAction,
	mauticGetNoteAction,
	mauticCreateNoteAction,
	mauticUpdateNoteAction,
	mauticDeleteNoteAction,
	mauticListTagsAction,
	mauticGetTagAction,
	mauticCreateTagAction,
	mauticUpdateTagAction,
	mauticDeleteTagAction,
	mauticListStagesAction,
	mauticGetStageAction,
	mauticCreateStageAction,
	mauticUpdateStageAction,
	mauticDeleteStageAction,
	mauticAddContactToStageAction,
	mauticRemoveContactFromStageAction,
	mauticListCategoriesAction,
	mauticGetCategoryAction,
	mauticCreateCategoryAction,
	mauticUpdateCategoryAction,
	mauticDeleteCategoryAction,
	mauticListFieldsAction,
	mauticGetFieldAction,
	mauticCreateFieldAction,
	mauticUpdateFieldAction,
	mauticDeleteFieldAction,
	mauticListFormsAction,
	mauticGetFormAction,
	mauticCreateFormAction,
	mauticUpdateFormAction,
	mauticDeleteFormAction,
	mauticListFormSubmissionsAction,
	mauticGetFormSubmissionAction,
	mauticListContactFormSubmissionsAction,
	mauticDeleteFormActionsAction,
	mauticDeleteFormFieldsAction,
	mauticListAssetsAction,
	mauticGetAssetAction,
	mauticCreateAssetAction,
	mauticUpdateAssetAction,
	mauticDeleteAssetAction,
	mauticListPagesAction,
	mauticGetPageAction,
	mauticCreatePageAction,
	mauticUpdatePageAction,
	mauticDeletePageAction,
	mauticListUsersAction,
	mauticGetUserAction,
	mauticCreateUserAction,
	mauticUpdateUserAction,
	mauticDeleteUserAction,
	mauticGetCurrentUserAction,
	mauticListAssignableRolesAction,
	mauticCheckUserPermissionsAction,
	mauticListRolesAction,
	mauticGetRoleAction,
	mauticCreateRoleAction,
	mauticUpdateRoleAction,
	mauticDeleteRoleAction,
	mauticListPointGroupsAction,
	mauticGetPointGroupAction,
	mauticCreatePointGroupAction,
	mauticUpdatePointGroupAction,
	mauticDeletePointGroupAction,
	mauticListReportsAction,
	mauticGetReportAction,
	mauticCreateReportAction,
	mauticUpdateReportAction,
	mauticDeleteReportAction,
	mauticGetStatsAction,
	mauticListDashboardWidgetTypesAction,
	mauticGetDashboardWidgetDataAction,
	mauticListDevicesAction,
	mauticGetDeviceAction,
	mauticCreateDeviceAction,
	mauticUpdateDeviceAction,
	mauticDeleteDeviceAction,
	mauticListDynamicContentsAction,
	mauticGetDynamicContentAction,
	mauticCreateDynamicContentAction,
	mauticUpdateDynamicContentAction,
	mauticDeleteDynamicContentAction,
	mauticListFocusItemsAction,
	mauticGetFocusItemAction,
	mauticCreateFocusItemAction,
	mauticUpdateFocusItemAction,
	mauticDeleteFocusItemAction,
	mauticGenerateFocusItemJsAction,
	mauticListMarketingMessagesAction,
	mauticGetMarketingMessageAction,
	mauticCreateMarketingMessageAction,
	mauticUpdateMarketingMessageAction,
	mauticDeleteMarketingMessageAction,
	mauticListPushNotificationsAction,
	mauticGetPushNotificationAction,
	mauticCreatePushNotificationAction,
	mauticUpdatePushNotificationAction,
	mauticDeletePushNotificationAction,
	mauticListTweetsAction,
	mauticGetTweetAction,
	mauticCreateTweetAction,
	mauticUpdateTweetAction,
	mauticDeleteTweetAction,
	mauticListPointActionsAction,
	mauticGetPointActionAction,
	mauticCreatePointActionAction,
	mauticUpdatePointActionAction,
	mauticDeletePointActionAction,
	mauticListPointActionTypesAction,
	mauticListPointTriggersAction,
	mauticGetPointTriggerAction,
	mauticCreatePointTriggerAction,
	mauticUpdatePointTriggerAction,
	mauticDeletePointTriggerAction,
	mauticListPointTriggerEventTypesAction,
	mauticDeletePointTriggerEventsAction,
	mauticListPointInsightsAction,
	mauticGetPointInsightAction,
	mauticCreatePointInsightAction,
	mauticUpdatePointInsightAction,
	mauticDeletePointInsightAction,
	mauticListFilesAction,
	mauticUploadFileAction,
	mauticDeleteFileAction,
	mauticListThemesAction,
	mauticGetThemeAction,
	mauticUploadThemeAction,
	mauticDeleteThemeAction,
];
