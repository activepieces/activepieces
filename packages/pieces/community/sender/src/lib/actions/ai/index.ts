import { senderAddSubscribersToGroupAction } from './add-subscribers-to-group';
import { senderCancelCampaignFollowupAction } from './cancel-campaign-followup';
import { senderCancelScheduledCampaignAction } from './cancel-scheduled-campaign';
import { senderCopyCampaignAction } from './copy-campaign';
import { senderCreateCampaignAction } from './create-campaign';
import { senderCreateCustomEventAction } from './create-custom-event';
import { senderCreateFieldAction } from './create-field';
import { senderCreateGroupAction } from './create-group';
import { senderCreateOrUpdateSubscriberAction } from './create-or-update-subscriber';
import { senderCreateTransactionalCampaignAction } from './create-transactional-campaign';
import { senderDeleteCampaignsAction } from './delete-campaigns';
import { senderDeleteFieldAction } from './delete-field';
import { senderDeleteGroupAction } from './delete-group';
import { senderDeleteSubscribersAction } from './delete-subscribers';
import { senderDeleteTransactionalCampaignsAction } from './delete-transactional-campaigns';
import { senderGetCampaignAction } from './get-campaign';
import { senderGetGroupAction } from './get-group';
import { senderGetSegmentAction } from './get-segment';
import { senderGetSubscriberAction } from './get-subscriber';
import { senderGetTransactionalCampaignAction } from './get-transactional-campaign';
import { senderGetTransactionalCampaignReportAction } from './get-transactional-campaign-report';
import { senderGetWorkflowAction } from './get-workflow';
import { senderGetWorkflowStatisticsAction } from './get-workflow-statistics';
import { senderListCampaignClicksAction } from './list-campaign-clicks';
import { senderListCampaignComplaintsAction } from './list-campaign-complaints';
import { senderListCampaignErrorsAction } from './list-campaign-errors';
import { senderListCampaignHardBouncesAction } from './list-campaign-hard-bounces';
import { senderListCampaignOpensAction } from './list-campaign-opens';
import { senderListCampaignSentEmailsAction } from './list-campaign-sent-emails';
import { senderListCampaignSoftBouncesAction } from './list-campaign-soft-bounces';
import { senderListCampaignUnsubscribesAction } from './list-campaign-unsubscribes';
import { senderListCampaignsAction } from './list-campaigns';
import { senderListFieldsAction } from './list-fields';
import { senderListGroupSubscribersAction } from './list-group-subscribers';
import { senderListGroupsAction } from './list-groups';
import { senderListSegmentSubscribersAction } from './list-segment-subscribers';
import { senderListSegmentsAction } from './list-segments';
import { senderListSubscriberEventsAction } from './list-subscriber-events';
import { senderListSubscribersAction } from './list-subscribers';
import { senderListTransactionalBouncesAction } from './list-transactional-bounces';
import { senderListTransactionalCampaignsAction } from './list-transactional-campaigns';
import { senderListTransactionalClicksAction } from './list-transactional-clicks';
import { senderListTransactionalComplaintsAction } from './list-transactional-complaints';
import { senderListTransactionalOpensAction } from './list-transactional-opens';
import { senderListTransactionalSentEmailsAction } from './list-transactional-sent-emails';
import { senderListWorkflowStepsAction } from './list-workflow-steps';
import { senderListWorkflowsAction } from './list-workflows';
import { senderRemoveSubscribersFromGroupAction } from './remove-subscribers-from-group';
import { senderRenameGroupAction } from './rename-group';
import { senderUpdateFieldAction } from './update-field';
import { senderUpdateSubscriberAction } from './update-subscriber';
import { senderUpdateTransactionalCampaignAction } from './update-transactional-campaign';

export const senderAiActions = [
	senderListSubscribersAction,
	senderGetSubscriberAction,
	senderCreateOrUpdateSubscriberAction,
	senderUpdateSubscriberAction,
	senderDeleteSubscribersAction,
	senderListSubscriberEventsAction,
	senderAddSubscribersToGroupAction,
	senderRemoveSubscribersFromGroupAction,
	senderCreateCustomEventAction,
	senderListGroupsAction,
	senderGetGroupAction,
	senderCreateGroupAction,
	senderRenameGroupAction,
	senderDeleteGroupAction,
	senderListGroupSubscribersAction,
	senderListFieldsAction,
	senderCreateFieldAction,
	senderUpdateFieldAction,
	senderDeleteFieldAction,
	senderListSegmentsAction,
	senderGetSegmentAction,
	senderListSegmentSubscribersAction,
	senderListCampaignsAction,
	senderGetCampaignAction,
	senderCreateCampaignAction,
	senderDeleteCampaignsAction,
	senderCopyCampaignAction,
	senderCancelScheduledCampaignAction,
	senderCancelCampaignFollowupAction,
	senderListCampaignErrorsAction,
	senderListCampaignOpensAction,
	senderListCampaignClicksAction,
	senderListCampaignUnsubscribesAction,
	senderListCampaignHardBouncesAction,
	senderListCampaignSoftBouncesAction,
	senderListCampaignComplaintsAction,
	senderListCampaignSentEmailsAction,
	senderListTransactionalCampaignsAction,
	senderGetTransactionalCampaignAction,
	senderCreateTransactionalCampaignAction,
	senderUpdateTransactionalCampaignAction,
	senderDeleteTransactionalCampaignsAction,
	senderGetTransactionalCampaignReportAction,
	senderListTransactionalSentEmailsAction,
	senderListTransactionalOpensAction,
	senderListTransactionalClicksAction,
	senderListTransactionalBouncesAction,
	senderListTransactionalComplaintsAction,
	senderListWorkflowsAction,
	senderGetWorkflowAction,
	senderListWorkflowStepsAction,
	senderGetWorkflowStatisticsAction,
];
