import { mailjetGetProfileAction } from './account/get-profile';
import { mailjetGetUserAction } from './account/get-user';
import { mailjetCancelCampaignDraftScheduleAction } from './campaigns/cancel-campaign-draft-schedule';
import { mailjetCreateCampaignDraftAction } from './campaigns/create-campaign-draft';
import { mailjetGetCampaignAction } from './campaigns/get-campaign';
import { mailjetGetCampaignDraftAction } from './campaigns/get-campaign-draft';
import { mailjetGetCampaignDraftContentAction } from './campaigns/get-campaign-draft-content';
import { mailjetGetCampaignDraftScheduleAction } from './campaigns/get-campaign-draft-schedule';
import { mailjetGetCampaignDraftStatusAction } from './campaigns/get-campaign-draft-status';
import { mailjetListCampaignDraftsAction } from './campaigns/list-campaign-drafts';
import { mailjetListCampaignsAction } from './campaigns/list-campaigns';
import { mailjetScheduleCampaignDraftAction } from './campaigns/schedule-campaign-draft';
import { mailjetSendCampaignDraftAction } from './campaigns/send-campaign-draft';
import { mailjetSendCampaignDraftTestAction } from './campaigns/send-campaign-draft-test';
import { mailjetSetCampaignDraftContentAction } from './campaigns/set-campaign-draft-content';
import { mailjetUpdateCampaignAction } from './campaigns/update-campaign';
import { mailjetUpdateCampaignDraftAction } from './campaigns/update-campaign-draft';
import { mailjetUpdateCampaignDraftScheduleAction } from './campaigns/update-campaign-draft-schedule';
import { mailjetBulkManageListContactsAction } from './contact-lists/bulk-manage-list-contacts';
import { mailjetCreateCsvImportAction } from './contact-lists/create-csv-import';
import { mailjetCreateListAction } from './contact-lists/create-list';
import { mailjetDeleteListAction } from './contact-lists/delete-list';
import { mailjetGetBulkManageListContactsJobAction } from './contact-lists/get-bulk-manage-list-contacts-job';
import { mailjetGetCsvImportAction } from './contact-lists/get-csv-import';
import { mailjetGetCsvImportErrorsAction } from './contact-lists/get-csv-import-errors';
import { mailjetGetImportListJobAction } from './contact-lists/get-import-list-job';
import { mailjetGetListAction } from './contact-lists/get-list';
import { mailjetGetSubscriptionAction } from './contact-lists/get-subscription';
import { mailjetGetVerifyListJobAction } from './contact-lists/get-verify-list-job';
import { mailjetImportListAction } from './contact-lists/import-list';
import { mailjetListListsAction } from './contact-lists/list-lists';
import { mailjetListSignupRequestsAction } from './contact-lists/list-signup-requests';
import { mailjetListSubscriptionsAction } from './contact-lists/list-subscriptions';
import { mailjetManageListContactAction } from './contact-lists/manage-list-contact';
import { mailjetUpdateCsvImportAction } from './contact-lists/update-csv-import';
import { mailjetUpdateListAction } from './contact-lists/update-list';
import { mailjetUploadContactsCsvAction } from './contact-lists/upload-contacts-csv';
import { mailjetVerifyListAction } from './contact-lists/verify-list';
import { mailjetCreateContactPropertyAction } from './contact-properties/create-contact-property';
import { mailjetDeleteContactPropertyAction } from './contact-properties/delete-contact-property';
import { mailjetGetContactPropertyAction } from './contact-properties/get-contact-property';
import { mailjetListContactPropertiesAction } from './contact-properties/list-contact-properties';
import { mailjetUpdateContactPropertyAction } from './contact-properties/update-contact-property';
import { mailjetBulkManageContactsAction } from './contacts/bulk-manage-contacts';
import { mailjetCreateContactAction } from './contacts/create-contact';
import { mailjetDeleteContactAction } from './contacts/delete-contact';
import { mailjetDeleteContactDataAction } from './contacts/delete-contact-data';
import { mailjetGetBulkManageContactsJobAction } from './contacts/get-bulk-manage-contacts-job';
import { mailjetGetContactAction } from './contacts/get-contact';
import { mailjetGetContactDataAction } from './contacts/get-contact-data';
import { mailjetListContactDataAction } from './contacts/list-contact-data';
import { mailjetListContactsAction } from './contacts/list-contacts';
import { mailjetListListsForContactAction } from './contacts/list-lists-for-contact';
import { mailjetUpdateContactAction } from './contacts/update-contact';
import { mailjetUpdateContactDataAction } from './contacts/update-contact-data';
import { mailjetUpdateContactListMembershipsAction } from './contacts/update-contact-list-memberships';
import { mailjetDeleteImageAction } from './images/delete-image';
import { mailjetGetImageAction } from './images/get-image';
import { mailjetListImagesAction } from './images/list-images';
import { mailjetReplaceImageAction } from './images/replace-image';
import { mailjetUpdateImageAction } from './images/update-image';
import { mailjetUploadImageAction } from './images/upload-image';
import { mailjetCreateLabelAction } from './labels/create-label';
import { mailjetDeleteLabelAction } from './labels/delete-label';
import { mailjetGetLabelAction } from './labels/get-label';
import { mailjetListLabelsAction } from './labels/list-labels';
import { mailjetUpdateLabelAction } from './labels/update-label';
import { mailjetGetMessageAction } from './messages/get-message';
import { mailjetGetMessageHistoryAction } from './messages/get-message-history';
import { mailjetGetMessageInformationAction } from './messages/get-message-information';
import { mailjetListBouncesAction } from './messages/list-bounces';
import { mailjetListClicksAction } from './messages/list-clicks';
import { mailjetListMessageInformationAction } from './messages/list-message-information';
import { mailjetListMessagesAction } from './messages/list-messages';
import { mailjetListOpensAction } from './messages/list-opens';
import { mailjetCreateSegmentAction } from './segments/create-segment';
import { mailjetDeleteSegmentAction } from './segments/delete-segment';
import { mailjetGetSegmentAction } from './segments/get-segment';
import { mailjetListSegmentsAction } from './segments/list-segments';
import { mailjetUpdateSegmentAction } from './segments/update-segment';
import { mailjetSendEmailAction } from './send/send-email';
import { mailjetCheckDnsAction } from './senders/check-dns';
import { mailjetCreateMetasenderAction } from './senders/create-metasender';
import { mailjetCreateSenderAction } from './senders/create-sender';
import { mailjetDeleteSenderAction } from './senders/delete-sender';
import { mailjetGetDnsAction } from './senders/get-dns';
import { mailjetGetMetasenderAction } from './senders/get-metasender';
import { mailjetGetSenderAction } from './senders/get-sender';
import { mailjetListDnsAction } from './senders/list-dns';
import { mailjetListMetasendersAction } from './senders/list-metasenders';
import { mailjetListSendersAction } from './senders/list-senders';
import { mailjetUpdateMetasenderAction } from './senders/update-metasender';
import { mailjetUpdateSenderAction } from './senders/update-sender';
import { mailjetValidateSenderAction } from './senders/validate-sender';
import { mailjetGetCampaignOverviewAction } from './statistics/get-campaign-overview';
import { mailjetGetContactStatisticsAction } from './statistics/get-contact-statistics';
import { mailjetGetGeoStatisticsAction } from './statistics/get-geo-statistics';
import { mailjetGetLinkClickStatisticsAction } from './statistics/get-link-click-statistics';
import { mailjetGetRecipientEspStatisticsAction } from './statistics/get-recipient-esp-statistics';
import { mailjetGetStatCountersAction } from './statistics/get-stat-counters';
import { mailjetGetSubscriptionStatisticsAction } from './statistics/get-subscription-statistics';
import { mailjetGetUserAgentStatisticsAction } from './statistics/get-user-agent-statistics';
import { mailjetListCampaignOverviewsAction } from './statistics/list-campaign-overviews';
import { mailjetListContactStatisticsAction } from './statistics/list-contact-statistics';
import { mailjetListSubscriptionStatisticsAction } from './statistics/list-subscription-statistics';
import { mailjetListTopLinksAction } from './statistics/list-top-links';
import { mailjetCreateTemplateAction } from './templates/create-template';
import { mailjetCreateTemplateContentAction } from './templates/create-template-content';
import { mailjetDeleteTemplateAction } from './templates/delete-template';
import { mailjetGetTemplateAction } from './templates/get-template';
import { mailjetGetTemplateContentAction } from './templates/get-template-content';
import { mailjetListTemplateContentsAction } from './templates/list-template-contents';
import { mailjetListTemplatesAction } from './templates/list-templates';
import { mailjetLockTemplateContentAction } from './templates/lock-template-content';
import { mailjetPublishTemplateContentAction } from './templates/publish-template-content';
import { mailjetUnlockTemplateContentAction } from './templates/unlock-template-content';
import { mailjetUpdateTemplateAction } from './templates/update-template';
import { mailjetUpdateTemplateContentAction } from './templates/update-template-content';

export const mailjetAiActions = [
	mailjetGetProfileAction,
	mailjetGetUserAction,
	mailjetCancelCampaignDraftScheduleAction,
	mailjetCreateCampaignDraftAction,
	mailjetGetCampaignAction,
	mailjetGetCampaignDraftAction,
	mailjetGetCampaignDraftContentAction,
	mailjetGetCampaignDraftScheduleAction,
	mailjetGetCampaignDraftStatusAction,
	mailjetListCampaignDraftsAction,
	mailjetListCampaignsAction,
	mailjetScheduleCampaignDraftAction,
	mailjetSendCampaignDraftAction,
	mailjetSendCampaignDraftTestAction,
	mailjetSetCampaignDraftContentAction,
	mailjetUpdateCampaignAction,
	mailjetUpdateCampaignDraftAction,
	mailjetUpdateCampaignDraftScheduleAction,
	mailjetBulkManageListContactsAction,
	mailjetCreateCsvImportAction,
	mailjetCreateListAction,
	mailjetDeleteListAction,
	mailjetGetBulkManageListContactsJobAction,
	mailjetGetCsvImportAction,
	mailjetGetCsvImportErrorsAction,
	mailjetGetImportListJobAction,
	mailjetGetListAction,
	mailjetGetSubscriptionAction,
	mailjetGetVerifyListJobAction,
	mailjetImportListAction,
	mailjetListListsAction,
	mailjetListSignupRequestsAction,
	mailjetListSubscriptionsAction,
	mailjetManageListContactAction,
	mailjetUpdateCsvImportAction,
	mailjetUpdateListAction,
	mailjetUploadContactsCsvAction,
	mailjetVerifyListAction,
	mailjetCreateContactPropertyAction,
	mailjetDeleteContactPropertyAction,
	mailjetGetContactPropertyAction,
	mailjetListContactPropertiesAction,
	mailjetUpdateContactPropertyAction,
	mailjetBulkManageContactsAction,
	mailjetCreateContactAction,
	mailjetDeleteContactAction,
	mailjetDeleteContactDataAction,
	mailjetGetBulkManageContactsJobAction,
	mailjetGetContactAction,
	mailjetGetContactDataAction,
	mailjetListContactDataAction,
	mailjetListContactsAction,
	mailjetListListsForContactAction,
	mailjetUpdateContactAction,
	mailjetUpdateContactDataAction,
	mailjetUpdateContactListMembershipsAction,
	mailjetDeleteImageAction,
	mailjetGetImageAction,
	mailjetListImagesAction,
	mailjetReplaceImageAction,
	mailjetUpdateImageAction,
	mailjetUploadImageAction,
	mailjetCreateLabelAction,
	mailjetDeleteLabelAction,
	mailjetGetLabelAction,
	mailjetListLabelsAction,
	mailjetUpdateLabelAction,
	mailjetGetMessageAction,
	mailjetGetMessageHistoryAction,
	mailjetGetMessageInformationAction,
	mailjetListBouncesAction,
	mailjetListClicksAction,
	mailjetListMessageInformationAction,
	mailjetListMessagesAction,
	mailjetListOpensAction,
	mailjetCreateSegmentAction,
	mailjetDeleteSegmentAction,
	mailjetGetSegmentAction,
	mailjetListSegmentsAction,
	mailjetUpdateSegmentAction,
	mailjetSendEmailAction,
	mailjetCheckDnsAction,
	mailjetCreateMetasenderAction,
	mailjetCreateSenderAction,
	mailjetDeleteSenderAction,
	mailjetGetDnsAction,
	mailjetGetMetasenderAction,
	mailjetGetSenderAction,
	mailjetListDnsAction,
	mailjetListMetasendersAction,
	mailjetListSendersAction,
	mailjetUpdateMetasenderAction,
	mailjetUpdateSenderAction,
	mailjetValidateSenderAction,
	mailjetGetCampaignOverviewAction,
	mailjetGetContactStatisticsAction,
	mailjetGetGeoStatisticsAction,
	mailjetGetLinkClickStatisticsAction,
	mailjetGetRecipientEspStatisticsAction,
	mailjetGetStatCountersAction,
	mailjetGetSubscriptionStatisticsAction,
	mailjetGetUserAgentStatisticsAction,
	mailjetListCampaignOverviewsAction,
	mailjetListContactStatisticsAction,
	mailjetListSubscriptionStatisticsAction,
	mailjetListTopLinksAction,
	mailjetCreateTemplateAction,
	mailjetCreateTemplateContentAction,
	mailjetDeleteTemplateAction,
	mailjetGetTemplateAction,
	mailjetGetTemplateContentAction,
	mailjetListTemplateContentsAction,
	mailjetListTemplatesAction,
	mailjetLockTemplateContentAction,
	mailjetPublishTemplateContentAction,
	mailjetUnlockTemplateContentAction,
	mailjetUpdateTemplateAction,
	mailjetUpdateTemplateContentAction,
];
