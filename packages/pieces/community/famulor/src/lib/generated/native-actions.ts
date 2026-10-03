import { actOnLoopRecall } from '../actions/native/act-on-loop-recall';
import { addCustomDomain } from '../actions/native/add-custom-domain';
import { addKnowledgeDocument } from '../actions/native/add-knowledge-document';
import { addLeads } from '../actions/native/add-leads';
import { addSuppressionEntry } from '../actions/native/add-suppression-entry';
import { archiveTool } from '../actions/native/archive-tool';
import { askMilian } from '../actions/native/ask-milian';
import { assignLeadsToCampaign } from '../actions/native/assign-leads-to-campaign';
import { buyPhoneNumber } from '../actions/native/buy-phone-number';
import { callTranslationSpeaker } from '../actions/native/call-translation-speaker';
import { cancelBooking } from '../actions/native/cancel-booking';
import { cancelScheduledCallback } from '../actions/native/cancel-scheduled-callback';
import { completeMessengerFacebookLogin } from '../actions/native/complete-messenger-facebook-login';
import { completeWhatsAppEmbeddedSignup } from '../actions/native/complete-whats-app-embedded-signup';
import { confirmSubscriptionPaymentChange } from '../actions/native/confirm-subscription-payment-change';
import { createAcuityOauthUrl } from '../actions/native/create-acuity-oauth-url';
import { createApiKey } from '../actions/native/create-api-key';
import { createAssistant } from '../actions/native/create-assistant';
import { createAssistantAutomation } from '../actions/native/create-assistant-automation';
import { createAssistantTest } from '../actions/native/create-assistant-test';
import { createAssistantTestFromCall } from '../actions/native/create-assistant-test-from-call';
import { createAudienceContact } from '../actions/native/create-audience-contact';
import { createAutomation } from '../actions/native/create-automation';
import { createAutomationConnection } from '../actions/native/create-automation-connection';
import { createBillingPortalLink } from '../actions/native/create-billing-portal-link';
import { createBooking } from '../actions/native/create-booking';
import { createBookingEventType } from '../actions/native/create-booking-event-type';
import { createCalendlyOauthUrl } from '../actions/native/create-calendly-oauth-url';
import { makePhoneCall } from '../actions/native/create-call';
import { createCallerId } from '../actions/native/create-caller-id';
import { createCampaign } from '../actions/native/create-campaign';
import { createCarrierConnection } from '../actions/native/create-carrier-connection';
import { createCrawlSource } from '../actions/native/create-crawl-source';
import { createCrmSync } from '../actions/native/create-crm-sync';
import { createDashboard } from '../actions/native/create-dashboard';
import { createDashboardWidget } from '../actions/native/create-dashboard-widget';
import { createDriveSource } from '../actions/native/create-drive-source';
import { createEmailAddress } from '../actions/native/create-email-address';
import { createEmailDomain } from '../actions/native/create-email-domain';
import { createIntegration } from '../actions/native/create-integration';
import { createInvoicePaymentLink } from '../actions/native/create-invoice-payment-link';
import { createKnowledgeBase } from '../actions/native/create-knowledge-base';
import { createKnowledgeBaseFaq } from '../actions/native/create-knowledge-base-faq';
import { createLoopQueue } from '../actions/native/create-loop-queue';
import { createLoopRingGroup } from '../actions/native/create-loop-ring-group';
import { createLoopRoutingRule } from '../actions/native/create-loop-routing-rule';
import { createMessagingConnector } from '../actions/native/create-messaging-connector';
import { createMilianVoiceSession } from '../actions/native/create-milian-voice-session';
import { createPlatformCustomPayment } from '../actions/native/create-platform-custom-payment';
import { createPlatformUserToken } from '../actions/native/create-platform-user-token';
import { createQaRun } from '../actions/native/create-qa-run';
import { createResellerTaxRegistration } from '../actions/native/create-reseller-tax-registration';
import { createRoutine } from '../actions/native/create-routine';
import { createRoutineVersionDraft } from '../actions/native/create-routine-version-draft';
import { createSegment } from '../actions/native/create-segment';
import { createSipTrunk } from '../actions/native/create-sip-trunk';
import { createSupportRequest } from '../actions/native/create-support-request';
import { createTool } from '../actions/native/create-tool';
import { createTranslationSession } from '../actions/native/create-translation-session';
import { createVoiceCloneUpload } from '../actions/native/create-voice-clone-upload';
import { createWidgetConnector } from '../actions/native/create-widget-connector';
import { createWorkspace } from '../actions/native/create-workspace';
import { createWorkspaceApiKey } from '../actions/native/create-workspace-api-key';
import { deleteAssistant } from '../actions/native/delete-assistant';
import { deleteAssistantAvatar } from '../actions/native/delete-assistant-avatar';
import { deleteAssistantGreetingAudio } from '../actions/native/delete-assistant-greeting-audio';
import { deleteAssistantTest } from '../actions/native/delete-assistant-test';
import { deleteAssistantVersion } from '../actions/native/delete-assistant-version';
import { deleteAutomation } from '../actions/native/delete-automation';
import { deleteAutomationConnection } from '../actions/native/delete-automation-connection';
import { deleteBookingEventType } from '../actions/native/delete-booking-event-type';
import { deleteCallerId } from '../actions/native/delete-caller-id';
import { deleteCampaign } from '../actions/native/delete-campaign';
import { deleteCarrierConnection } from '../actions/native/delete-carrier-connection';
import { deleteCrawlSource } from '../actions/native/delete-crawl-source';
import { deleteCrmSync } from '../actions/native/delete-crm-sync';
import { deleteDashboard } from '../actions/native/delete-dashboard';
import { deleteDriveSource } from '../actions/native/delete-drive-source';
import { deleteEmailAddress } from '../actions/native/delete-email-address';
import { deleteEmailDomain } from '../actions/native/delete-email-domain';
import { deleteIntegration } from '../actions/native/delete-integration';
import { deleteKnowledgeBase } from '../actions/native/delete-knowledge-base';
import { deleteKnowledgeBaseDocument } from '../actions/native/delete-knowledge-base-document';
import { deleteKnowledgeBaseDocuments } from '../actions/native/delete-knowledge-base-documents';
import { deleteKnowledgeBaseFaq } from '../actions/native/delete-knowledge-base-faq';
import { deleteLead } from '../actions/native/delete-lead';
import { deleteLoopNumberRoute } from '../actions/native/delete-loop-number-route';
import { deleteLoopQueue } from '../actions/native/delete-loop-queue';
import { deleteLoopRingGroup } from '../actions/native/delete-loop-ring-group';
import { deleteLoopRoutingRule } from '../actions/native/delete-loop-routing-rule';
import { deleteMessagingConnector } from '../actions/native/delete-messaging-connector';
import { deletePasskey } from '../actions/native/delete-passkey';
import { deletePhoneNumberVerification } from '../actions/native/delete-phone-number-verification';
import { deleteRoutine } from '../actions/native/delete-routine';
import { deleteSegment } from '../actions/native/delete-segment';
import { deleteSipTrunk } from '../actions/native/delete-sip-trunk';
import { deleteVoiceClone } from '../actions/native/delete-voice-clone';
import { deleteWhatsAppConnectorAsset } from '../actions/native/delete-whats-app-connector-asset';
import { deleteWidgetConnector } from '../actions/native/delete-widget-connector';
import { deleteWidgetConnectorLogo } from '../actions/native/delete-widget-connector-logo';
import { disconnectAssistantAutomation } from '../actions/native/disconnect-assistant-automation';
import { discoverCrawlSourcePaths } from '../actions/native/discover-crawl-source-paths';
import { discoverCrmSyncMetadata } from '../actions/native/discover-crm-sync-metadata';
import { discoverTool } from '../actions/native/discover-tool';
import { dismissInboxLabel } from '../actions/native/dismiss-inbox-label';
import { endTranslationSession } from '../actions/native/end-translation-session';
import { eraseCustomerMemory } from '../actions/native/erase-customer-memory';
import { executeMeetergoCalendarAction } from '../actions/native/execute-meetergo-calendar-action';
import { getAiInferenceSettings } from '../actions/native/get-ai-inference-settings';
import { getApiKey } from '../actions/native/get-api-key';
import { getAssistant } from '../actions/native/get-assistant';
import { getAssistantAnnouncementAudio } from '../actions/native/get-assistant-announcement-audio';
import { getAssistantAnnouncements } from '../actions/native/get-assistant-announcements';
import { getAssistantComplianceReview } from '../actions/native/get-assistant-compliance-review';
import { getAssistantIntegrations } from '../actions/native/get-assistant-integrations';
import { getAssistantTools } from '../actions/native/get-assistant-tools';
import { getAssistantVariables } from '../actions/native/get-assistant-variables';
import { getAssistantVersion } from '../actions/native/get-assistant-version';
import { getAutomation } from '../actions/native/get-automation';
import { getAutomationConnection } from '../actions/native/get-automation-connection';
import { getAutomationTriggerTestData } from '../actions/native/get-automation-trigger-test-data';
import { getBalance } from '../actions/native/get-balance';
import { getBooking } from '../actions/native/get-booking';
import { getBookingEmailTemplates } from '../actions/native/get-booking-email-templates';
import { getBookingEventType } from '../actions/native/get-booking-event-type';
import { getCall } from '../actions/native/get-call';
import { getCallRecording } from '../actions/native/get-call-recording';
import { getCampaign } from '../actions/native/get-campaign';
import { getCampaignStats } from '../actions/native/get-campaign-stats';
import { getCarrierConnection } from '../actions/native/get-carrier-connection';
import { getConsentComplianceSettings } from '../actions/native/get-consent-compliance-settings';
import { getCrawlSource } from '../actions/native/get-crawl-source';
import { getCreditNotificationPreferences } from '../actions/native/get-credit-notification-preferences';
import { getCrmSync } from '../actions/native/get-crm-sync';
import { getCustomDomainStatus } from '../actions/native/get-custom-domain-status';
import { getCustomerMemory } from '../actions/native/get-customer-memory';
import { getDarkWindowSettings } from '../actions/native/get-dark-window-settings';
import { getDashboard } from '../actions/native/get-dashboard';
import { getDashboardAnalytics } from '../actions/native/get-dashboard-analytics';
import { getDriveSource } from '../actions/native/get-drive-source';
import { getEmailDomain } from '../actions/native/get-email-domain';
import { getEmailHistoryItem } from '../actions/native/get-email-history-item';
import { getEmailSettings } from '../actions/native/get-email-settings';
import { getInboxLabelSettings } from '../actions/native/get-inbox-label-settings';
import { getIntegration } from '../actions/native/get-integration';
import { getKnowledgeBase } from '../actions/native/get-knowledge-base';
import { getKnowledgeBaseFaq } from '../actions/native/get-knowledge-base-faq';
import { getLead } from '../actions/native/get-lead';
import { getLoop } from '../actions/native/get-loop';
import { getLoopAvailability } from '../actions/native/get-loop-availability';
import { getLoopCall } from '../actions/native/get-loop-call';
import { getLoopDialingPreferences } from '../actions/native/get-loop-dialing-preferences';
import { getLoopNumberRoute } from '../actions/native/get-loop-number-route';
import { getLoopPresence } from '../actions/native/get-loop-presence';
import { getLoopQueue } from '../actions/native/get-loop-queue';
import { getLoopRecording } from '../actions/native/get-loop-recording';
import { getLoopRingGroup } from '../actions/native/get-loop-ring-group';
import { getLoopRoutingRule } from '../actions/native/get-loop-routing-rule';
import { getMarketingIntegrations } from '../actions/native/get-marketing-integrations';
import { getCurrentUser } from '../actions/native/get-me';
import { getMemorySettings } from '../actions/native/get-memory-settings';
import { getMessagingHistoryItem } from '../actions/native/get-messaging-history-item';
import { getMessengerFacebookLoginConfig } from '../actions/native/get-messenger-facebook-login-config';
import { getOutboundLimits } from '../actions/native/get-outbound-limits';
import { getPaymentStatus } from '../actions/native/get-payment-status';
import { getPhoneNumber } from '../actions/native/get-phone-number';
import { getPhoneNumberVerification } from '../actions/native/get-phone-number-verification';
import { getPhoneNumberVerificationRequirements } from '../actions/native/get-phone-number-verification-requirements';
import { getPhoneNumberVerificationSubmission } from '../actions/native/get-phone-number-verification-submission';
import { getPlatformCustomPayment } from '../actions/native/get-platform-custom-payment';
import { getPlatformDefaultLimits } from '../actions/native/get-platform-default-limits';
import { getPlatformUser } from '../actions/native/get-platform-user';
import { getPlatformUserPasswordAccess } from '../actions/native/get-platform-user-password-access';
import { getPlatformWelcomeCredits } from '../actions/native/get-platform-welcome-credits';
import { getQaRun } from '../actions/native/get-qa-run';
import { getReferrals } from '../actions/native/get-referrals';
import { getResellerBilling } from '../actions/native/get-reseller-billing';
import { getResellerTaxSettings } from '../actions/native/get-reseller-tax-settings';
import { getRetentionSettings } from '../actions/native/get-retention-settings';
import { getRoutine } from '../actions/native/get-routine';
import { getRoutineWebhook } from '../actions/native/get-routine-webhook';
import { getSegment } from '../actions/native/get-segment';
import { getSipTrunk } from '../actions/native/get-sip-trunk';
import { getSlackOauthConfig } from '../actions/native/get-slack-oauth-config';
import { getSmsRegistration } from '../actions/native/get-sms-registration';
import { getSmsRegistrationBilling } from '../actions/native/get-sms-registration-billing';
import { getSupportRequest } from '../actions/native/get-support-request';
import { getTelephonyUsageRates } from '../actions/native/get-telephony-usage-rates';
import { getTool } from '../actions/native/get-tool';
import { getToolUsage } from '../actions/native/get-tool-usage';
import { getTranslationSession } from '../actions/native/get-translation-session';
import { getVoiceClone } from '../actions/native/get-voice-clone';
import { getVoiceCloneCapability } from '../actions/native/get-voice-clone-capability';
import { getVoiceCloneJob } from '../actions/native/get-voice-clone-job';
import { getVoicePreview } from '../actions/native/get-voice-preview';
import { getWhatsAppCallingReadiness } from '../actions/native/get-whats-app-calling-readiness';
import { getWhatsAppEmbeddedSignupConfig } from '../actions/native/get-whats-app-embedded-signup-config';
import { getWhatsAppSenderProfile } from '../actions/native/get-whats-app-sender-profile';
import { getWidgetConnector } from '../actions/native/get-widget-connector';
import { getWorkspaceCountry } from '../actions/native/get-workspace-country';
import { getWorkspaceUsageRates } from '../actions/native/get-workspace-usage-rates';
import { importCarrierNumbers } from '../actions/native/import-carrier-numbers';
import { inviteTranslationGuest } from '../actions/native/invite-translation-guest';
import { linkLoopCallContact } from '../actions/native/link-loop-call-contact';
import { listAccountSessions } from '../actions/native/list-account-sessions';
import { listAcuityAppointmentTypes } from '../actions/native/list-acuity-appointment-types';
import { listAcuityCalendars } from '../actions/native/list-acuity-calendars';
import { listAcuityConnections } from '../actions/native/list-acuity-connections';
import { listApiKeys } from '../actions/native/list-api-keys';
import { listAssistantAutomations } from '../actions/native/list-assistant-automations';
import { listAssistants } from '../actions/native/list-assistants';
import { listAssistantTests } from '../actions/native/list-assistant-tests';
import { listAssistantVersions } from '../actions/native/list-assistant-versions';
import { listAudienceContactChannels } from '../actions/native/list-audience-contact-channels';
import { listAudienceContacts } from '../actions/native/list-audience-contacts';
import { listAutomationAiActions } from '../actions/native/list-automation-ai-actions';
import { listAutomationConnections } from '../actions/native/list-automation-connections';
import { listAutomations } from '../actions/native/list-automations';
import { listBookingEventTypes } from '../actions/native/list-booking-event-types';
import { listBookings } from '../actions/native/list-bookings';
import { listBookingSlots } from '../actions/native/list-booking-slots';
import { listCalendlyConnections } from '../actions/native/list-calendly-connections';
import { listCalendlyEventTypes } from '../actions/native/list-calendly-event-types';
import { listCallerIds } from '../actions/native/list-caller-ids';
import { listCalls } from '../actions/native/list-calls';
import { listCampaignDeliveries } from '../actions/native/list-campaign-deliveries';
import { listCampaigns } from '../actions/native/list-campaigns';
import { listCarrierAvailableNumbers } from '../actions/native/list-carrier-available-numbers';
import { listCarrierConnections } from '../actions/native/list-carrier-connections';
import { listCrawlSourcePages } from '../actions/native/list-crawl-source-pages';
import { listCrawlSources } from '../actions/native/list-crawl-sources';
import { listCrmSyncRuns } from '../actions/native/list-crm-sync-runs';
import { listCrmSyncs } from '../actions/native/list-crm-syncs';
import { listCustomerMemories } from '../actions/native/list-customer-memories';
import { listDashboards } from '../actions/native/list-dashboards';
import { listDashboardWidgets } from '../actions/native/list-dashboard-widgets';
import { listDriveSources } from '../actions/native/list-drive-sources';
import { listEmailAddresses } from '../actions/native/list-email-addresses';
import { listEmailDomains } from '../actions/native/list-email-domains';
import { listEmailSenders } from '../actions/native/list-email-senders';
import { listHistory } from '../actions/native/list-history';
import { listIntegrations } from '../actions/native/list-integrations';
import { listKnowledgeBaseDocuments } from '../actions/native/list-knowledge-base-documents';
import { listKnowledgeBaseFaqs } from '../actions/native/list-knowledge-base-faqs';
import { listKnowledgeBases } from '../actions/native/list-knowledge-bases';
import { listKnowledgeDocumentChunks } from '../actions/native/list-knowledge-document-chunks';
import { listLanguages } from '../actions/native/list-languages';
import { listLeads } from '../actions/native/list-leads';
import { listLoopCalls } from '../actions/native/list-loop-calls';
import { listLoopDevices } from '../actions/native/list-loop-devices';
import { listLoopDirectory } from '../actions/native/list-loop-directory';
import { listLoopNumberRoutes } from '../actions/native/list-loop-number-routes';
import { listLoopQueues } from '../actions/native/list-loop-queues';
import { listLoopRecalls } from '../actions/native/list-loop-recalls';
import { listLoopRingGroups } from '../actions/native/list-loop-ring-groups';
import { listLoopRoutingRules } from '../actions/native/list-loop-routing-rules';
import { listMeetergoMeetingTypes } from '../actions/native/list-meetergo-meeting-types';
import { listMessagingConnectors } from '../actions/native/list-messaging-connectors';
import { listMessagingConnectorWatchOptions } from '../actions/native/list-messaging-connector-watch-options';
import { listMessengerFacebookPages } from '../actions/native/list-messenger-facebook-pages';
import { listModels } from '../actions/native/list-models';
import { listPasskeys } from '../actions/native/list-passkeys';
import { listPerplexityModels } from '../actions/native/list-perplexity-models';
import { listPhoneNumbers } from '../actions/native/list-phone-numbers';
import { listPhoneNumberVerificationCatalog } from '../actions/native/list-phone-number-verification-catalog';
import { listPhoneNumberVerifications } from '../actions/native/list-phone-number-verifications';
import { listPlatformCustomPayments } from '../actions/native/list-platform-custom-payments';
import { listPlatformUserCustomPayments } from '../actions/native/list-platform-user-custom-payments';
import { listPlatformUsers } from '../actions/native/list-platform-users';
import { listPromptTemplates } from '../actions/native/list-prompt-templates';
import { listQaRuns } from '../actions/native/list-qa-runs';
import { listResellerPlans } from '../actions/native/list-reseller-plans';
import { listRoutineRuns } from '../actions/native/list-routine-runs';
import { listRoutines } from '../actions/native/list-routines';
import { listRoutineVersions } from '../actions/native/list-routine-versions';
import { listScheduledCallbacks } from '../actions/native/list-scheduled-callbacks';
import { listSegmentLeads } from '../actions/native/list-segment-leads';
import { listSegments } from '../actions/native/list-segments';
import { listSipTrunks } from '../actions/native/list-sip-trunks';
import { listSupportRequests } from '../actions/native/list-support-requests';
import { listSuppressionEntries } from '../actions/native/list-suppression-entries';
import { listTeamMembers } from '../actions/native/list-team-members';
import { listToolRuns } from '../actions/native/list-tool-runs';
import { listTools } from '../actions/native/list-tools';
import { listToolVersions } from '../actions/native/list-tool-versions';
import { listTransactions } from '../actions/native/list-transactions';
import { listTranslationSessions } from '../actions/native/list-translation-sessions';
import { listVariableSources } from '../actions/native/list-variable-sources';
import { listVoiceClones } from '../actions/native/list-voice-clones';
import { listVoices } from '../actions/native/list-voices';
import { listWhatsAppTemplates } from '../actions/native/list-whats-app-templates';
import { listWidgetConnectors } from '../actions/native/list-widget-connectors';
import { listWorkspaces } from '../actions/native/list-workspaces';
import { liveCallControl } from '../actions/native/live-call-control';
import { loginPlatformUser } from '../actions/native/login-platform-user';
import { logoutPlatformUser } from '../actions/native/logout-platform-user';
import { lookupBookings } from '../actions/native/lookup-bookings';
import { managePlatformUserPassword } from '../actions/native/manage-platform-user-password';
import { manageSmsRegistration } from '../actions/native/manage-sms-registration';
import { manageSmsRegistrationBilling } from '../actions/native/manage-sms-registration-billing';
import { mergeAudienceContacts } from '../actions/native/merge-audience-contacts';
import { migrateFamulor1 } from '../actions/native/migrate-famulor1';
import { migrateProviderAssistants } from '../actions/native/migrate-provider-assistants';
import { pauseRoutine } from '../actions/native/pause-routine';
import { prepareAssistantAnnouncements } from '../actions/native/prepare-assistant-announcements';
import { previewNaturalLanguageDashboard } from '../actions/native/preview-natural-language-dashboard';
import { publishRoutineVersion } from '../actions/native/publish-routine-version';
import { reauthorizeTool } from '../actions/native/reauthorize-tool';
import { registerPlatformUser } from '../actions/native/register-platform-user';
import { releasePhoneNumber } from '../actions/native/release-phone-number';
import { removeCarrierNumber } from '../actions/native/remove-carrier-number';
import { removeCustomDomain } from '../actions/native/remove-custom-domain';
import { removeDashboardWidget } from '../actions/native/remove-dashboard-widget';
import { removeSuppressionEntry } from '../actions/native/remove-suppression-entry';
import { renameAssistantVersion } from '../actions/native/rename-assistant-version';
import { renameLoopDevice } from '../actions/native/rename-loop-device';
import { replaceAssistant } from '../actions/native/replace-assistant';
import { replaceAudienceContactChannels } from '../actions/native/replace-audience-contact-channels';
import { replyToSupportRequest } from '../actions/native/reply-to-support-request';
import { requestAssistantComplianceReview } from '../actions/native/request-assistant-compliance-review';
import { requestOutboundLimitIncrease } from '../actions/native/request-outbound-limit-increase';
import { rescheduleBooking } from '../actions/native/reschedule-booking';
import { restoreAssistantVersion } from '../actions/native/restore-assistant-version';
import { restoreToolVersion } from '../actions/native/restore-tool-version';
import { retryRoutineRun } from '../actions/native/retry-routine-run';
import { reviewSubscriptionPaymentChange } from '../actions/native/review-subscription-payment-change';
import { revokeApiKey } from '../actions/native/revoke-api-key';
import { revokeLoopDevice } from '../actions/native/revoke-loop-device';
import { runAssistantTest } from '../actions/native/run-assistant-test';
import { runAutomationAiAction } from '../actions/native/run-automation-ai-action';
import { runCallActions } from '../actions/native/run-call-actions';
import { runCrawlSource } from '../actions/native/run-crawl-source';
import { runCrmSync } from '../actions/native/run-crm-sync';
import { runDriveSource } from '../actions/native/run-drive-source';
import { runHistoryActions } from '../actions/native/run-history-actions';
import { runPlatformCustomPaymentAction } from '../actions/native/run-platform-custom-payment-action';
import { runRoutine } from '../actions/native/run-routine';
import { runWhatsAppCallingAction } from '../actions/native/run-whats-app-calling-action';
import { saveNaturalLanguageDashboard } from '../actions/native/save-natural-language-dashboard';
import { searchAvailablePhoneNumbers } from '../actions/native/search-available-phone-numbers';
import { searchKnowledgeBase } from '../actions/native/search-knowledge-base';
import { sendSms } from '../actions/native/send-sms';
import { setAssistantAvatar } from '../actions/native/set-assistant-avatar';
import { setAssistantGreetingAudio } from '../actions/native/set-assistant-greeting-audio';
import { setAssistantIntegrations } from '../actions/native/set-assistant-integrations';
import { setAssistantTools } from '../actions/native/set-assistant-tools';
import { setLoopNumberRoute } from '../actions/native/set-loop-number-route';
import { setLoopPresence } from '../actions/native/set-loop-presence';
import { setLoopRecording } from '../actions/native/set-loop-recording';
import { setRoutineWebhookSecret } from '../actions/native/set-routine-webhook-secret';
import { signOutAccountSession } from '../actions/native/sign-out-account-session';
import { startCampaign } from '../actions/native/start-campaign';
import { startSlackOauth } from '../actions/native/start-slack-oauth';
import { startTranslationSession } from '../actions/native/start-translation-session';
import { startWhatsAppOutboundCall } from '../actions/native/start-whats-app-outbound-call';
import { stopCampaign } from '../actions/native/stop-campaign';
import { submitPhoneNumberVerification } from '../actions/native/submit-phone-number-verification';
import { submitVoiceCloneJob } from '../actions/native/submit-voice-clone-job';
import { testMessagingConnectorEndedWebhook } from '../actions/native/test-messaging-connector-ended-webhook';
import { testTool } from '../actions/native/test-tool';
import { tidyAssistantFlow } from '../actions/native/tidy-assistant-flow';
import { transferPlatformUserBalance } from '../actions/native/transfer-platform-user-balance';
import { transferWorkspaceOwnership } from '../actions/native/transfer-workspace-ownership';
import { triggerAutomation } from '../actions/native/trigger-automation';
import { troubleshootCarrierConnection } from '../actions/native/troubleshoot-carrier-connection';
import { updateAiInferenceSettings } from '../actions/native/update-ai-inference-settings';
import { updateAssistant } from '../actions/native/update-assistant';
import { updateAssistantTest } from '../actions/native/update-assistant-test';
import { updateAssistantVariables } from '../actions/native/update-assistant-variables';
import { updateAutomation } from '../actions/native/update-automation';
import { updateAutomationConnection } from '../actions/native/update-automation-connection';
import { updateBookingEventType } from '../actions/native/update-booking-event-type';
import { updateCallerId } from '../actions/native/update-caller-id';
import { updateCampaign } from '../actions/native/update-campaign';
import { updateCarrierConnection } from '../actions/native/update-carrier-connection';
import { updateConsentComplianceSettings } from '../actions/native/update-consent-compliance-settings';
import { updateCrawlSource } from '../actions/native/update-crawl-source';
import { updateCreditNotificationPreferences } from '../actions/native/update-credit-notification-preferences';
import { updateCrmSync } from '../actions/native/update-crm-sync';
import { updateCustomerMemory } from '../actions/native/update-customer-memory';
import { updateDarkWindowSettings } from '../actions/native/update-dark-window-settings';
import { updateDashboard } from '../actions/native/update-dashboard';
import { updateDashboardWidget } from '../actions/native/update-dashboard-widget';
import { updateDriveSource } from '../actions/native/update-drive-source';
import { updateEmailAddress } from '../actions/native/update-email-address';
import { updateEmailSettings } from '../actions/native/update-email-settings';
import { updateInboxLabelSettings } from '../actions/native/update-inbox-label-settings';
import { updateIntegration } from '../actions/native/update-integration';
import { updateKnowledgeBaseFaq } from '../actions/native/update-knowledge-base-faq';
import { updateLead } from '../actions/native/update-lead';
import { updateLoopAvailability } from '../actions/native/update-loop-availability';
import { updateLoopDialingPreferences } from '../actions/native/update-loop-dialing-preferences';
import { updateLoopQueue } from '../actions/native/update-loop-queue';
import { updateLoopRingGroup } from '../actions/native/update-loop-ring-group';
import { updateLoopRoutingRule } from '../actions/native/update-loop-routing-rule';
import { updateLoopSettings } from '../actions/native/update-loop-settings';
import { updateMarketingIntegrations } from '../actions/native/update-marketing-integrations';
import { updateMemorySettings } from '../actions/native/update-memory-settings';
import { updateMessagingConnector } from '../actions/native/update-messaging-connector';
import { updatePhoneNumber } from '../actions/native/update-phone-number';
import { updatePlatformDefaultLimits } from '../actions/native/update-platform-default-limits';
import { updatePlatformWelcomeCredits } from '../actions/native/update-platform-welcome-credits';
import { updateResellerPlanInclusions } from '../actions/native/update-reseller-plan-inclusions';
import { updateResellerPlanKnowledgeSources } from '../actions/native/update-reseller-plan-knowledge-sources';
import { updateResellerTaxRegistration } from '../actions/native/update-reseller-tax-registration';
import { updateResellerTaxSettings } from '../actions/native/update-reseller-tax-settings';
import { updateRetentionSettings } from '../actions/native/update-retention-settings';
import { updateRoutine } from '../actions/native/update-routine';
import { updateSegment } from '../actions/native/update-segment';
import { updateSipTrunkIdentity } from '../actions/native/update-sip-trunk-identity';
import { updateTeamMemberRole } from '../actions/native/update-team-member-role';
import { updateTool } from '../actions/native/update-tool';
import { updateWhatsAppSenderProfile } from '../actions/native/update-whats-app-sender-profile';
import { updateWidgetConnector } from '../actions/native/update-widget-connector';
import { updateWorkspaceCountry } from '../actions/native/update-workspace-country';
import { uploadWhatsAppConnectorAsset } from '../actions/native/upload-whats-app-connector-asset';
import { uploadWhatsAppTemplateReviewSample } from '../actions/native/upload-whats-app-template-review-sample';
import { uploadWidgetConnectorLogo } from '../actions/native/upload-widget-connector-logo';
import { verifyCallInputs } from '../actions/native/verify-call-inputs';
import { verifyCustomDomain } from '../actions/native/verify-custom-domain';
import { verifyEmailDomain } from '../actions/native/verify-email-domain';
import { whatsAppSenderProfileAction } from '../actions/native/whats-app-sender-profile-action';
import { whatsAppTemplatesAction } from '../actions/native/whats-app-templates-action';

export const nativeActions = [
  actOnLoopRecall,
  addCustomDomain,
  addKnowledgeDocument,
  addLeads,
  addSuppressionEntry,
  archiveTool,
  askMilian,
  assignLeadsToCampaign,
  buyPhoneNumber,
  callTranslationSpeaker,
  cancelBooking,
  cancelScheduledCallback,
  completeMessengerFacebookLogin,
  completeWhatsAppEmbeddedSignup,
  confirmSubscriptionPaymentChange,
  createAcuityOauthUrl,
  createApiKey,
  createAssistant,
  createAssistantAutomation,
  createAssistantTest,
  createAssistantTestFromCall,
  createAudienceContact,
  createAutomation,
  createAutomationConnection,
  createBillingPortalLink,
  createBooking,
  createBookingEventType,
  createCalendlyOauthUrl,
  makePhoneCall,
  createCallerId,
  createCampaign,
  createCarrierConnection,
  createCrawlSource,
  createCrmSync,
  createDashboard,
  createDashboardWidget,
  createDriveSource,
  createEmailAddress,
  createEmailDomain,
  createIntegration,
  createInvoicePaymentLink,
  createKnowledgeBase,
  createKnowledgeBaseFaq,
  createLoopQueue,
  createLoopRingGroup,
  createLoopRoutingRule,
  createMessagingConnector,
  createMilianVoiceSession,
  createPlatformCustomPayment,
  createPlatformUserToken,
  createQaRun,
  createResellerTaxRegistration,
  createRoutine,
  createRoutineVersionDraft,
  createSegment,
  createSipTrunk,
  createSupportRequest,
  createTool,
  createTranslationSession,
  createVoiceCloneUpload,
  createWidgetConnector,
  createWorkspace,
  createWorkspaceApiKey,
  deleteAssistant,
  deleteAssistantAvatar,
  deleteAssistantGreetingAudio,
  deleteAssistantTest,
  deleteAssistantVersion,
  deleteAutomation,
  deleteAutomationConnection,
  deleteBookingEventType,
  deleteCallerId,
  deleteCampaign,
  deleteCarrierConnection,
  deleteCrawlSource,
  deleteCrmSync,
  deleteDashboard,
  deleteDriveSource,
  deleteEmailAddress,
  deleteEmailDomain,
  deleteIntegration,
  deleteKnowledgeBase,
  deleteKnowledgeBaseDocument,
  deleteKnowledgeBaseDocuments,
  deleteKnowledgeBaseFaq,
  deleteLead,
  deleteLoopNumberRoute,
  deleteLoopQueue,
  deleteLoopRingGroup,
  deleteLoopRoutingRule,
  deleteMessagingConnector,
  deletePasskey,
  deletePhoneNumberVerification,
  deleteRoutine,
  deleteSegment,
  deleteSipTrunk,
  deleteVoiceClone,
  deleteWhatsAppConnectorAsset,
  deleteWidgetConnector,
  deleteWidgetConnectorLogo,
  disconnectAssistantAutomation,
  discoverCrawlSourcePaths,
  discoverCrmSyncMetadata,
  discoverTool,
  dismissInboxLabel,
  endTranslationSession,
  eraseCustomerMemory,
  executeMeetergoCalendarAction,
  getAiInferenceSettings,
  getApiKey,
  getAssistant,
  getAssistantAnnouncementAudio,
  getAssistantAnnouncements,
  getAssistantComplianceReview,
  getAssistantIntegrations,
  getAssistantTools,
  getAssistantVariables,
  getAssistantVersion,
  getAutomation,
  getAutomationConnection,
  getAutomationTriggerTestData,
  getBalance,
  getBooking,
  getBookingEmailTemplates,
  getBookingEventType,
  getCall,
  getCallRecording,
  getCampaign,
  getCampaignStats,
  getCarrierConnection,
  getConsentComplianceSettings,
  getCrawlSource,
  getCreditNotificationPreferences,
  getCrmSync,
  getCustomDomainStatus,
  getCustomerMemory,
  getDarkWindowSettings,
  getDashboard,
  getDashboardAnalytics,
  getDriveSource,
  getEmailDomain,
  getEmailHistoryItem,
  getEmailSettings,
  getInboxLabelSettings,
  getIntegration,
  getKnowledgeBase,
  getKnowledgeBaseFaq,
  getLead,
  getLoop,
  getLoopAvailability,
  getLoopCall,
  getLoopDialingPreferences,
  getLoopNumberRoute,
  getLoopPresence,
  getLoopQueue,
  getLoopRecording,
  getLoopRingGroup,
  getLoopRoutingRule,
  getMarketingIntegrations,
  getCurrentUser,
  getMemorySettings,
  getMessagingHistoryItem,
  getMessengerFacebookLoginConfig,
  getOutboundLimits,
  getPaymentStatus,
  getPhoneNumber,
  getPhoneNumberVerification,
  getPhoneNumberVerificationRequirements,
  getPhoneNumberVerificationSubmission,
  getPlatformCustomPayment,
  getPlatformDefaultLimits,
  getPlatformUser,
  getPlatformUserPasswordAccess,
  getPlatformWelcomeCredits,
  getQaRun,
  getReferrals,
  getResellerBilling,
  getResellerTaxSettings,
  getRetentionSettings,
  getRoutine,
  getRoutineWebhook,
  getSegment,
  getSipTrunk,
  getSlackOauthConfig,
  getSmsRegistration,
  getSmsRegistrationBilling,
  getSupportRequest,
  getTelephonyUsageRates,
  getTool,
  getToolUsage,
  getTranslationSession,
  getVoiceClone,
  getVoiceCloneCapability,
  getVoiceCloneJob,
  getVoicePreview,
  getWhatsAppCallingReadiness,
  getWhatsAppEmbeddedSignupConfig,
  getWhatsAppSenderProfile,
  getWidgetConnector,
  getWorkspaceCountry,
  getWorkspaceUsageRates,
  importCarrierNumbers,
  inviteTranslationGuest,
  linkLoopCallContact,
  listAccountSessions,
  listAcuityAppointmentTypes,
  listAcuityCalendars,
  listAcuityConnections,
  listApiKeys,
  listAssistantAutomations,
  listAssistants,
  listAssistantTests,
  listAssistantVersions,
  listAudienceContactChannels,
  listAudienceContacts,
  listAutomationAiActions,
  listAutomationConnections,
  listAutomations,
  listBookingEventTypes,
  listBookings,
  listBookingSlots,
  listCalendlyConnections,
  listCalendlyEventTypes,
  listCallerIds,
  listCalls,
  listCampaignDeliveries,
  listCampaigns,
  listCarrierAvailableNumbers,
  listCarrierConnections,
  listCrawlSourcePages,
  listCrawlSources,
  listCrmSyncRuns,
  listCrmSyncs,
  listCustomerMemories,
  listDashboards,
  listDashboardWidgets,
  listDriveSources,
  listEmailAddresses,
  listEmailDomains,
  listEmailSenders,
  listHistory,
  listIntegrations,
  listKnowledgeBaseDocuments,
  listKnowledgeBaseFaqs,
  listKnowledgeBases,
  listKnowledgeDocumentChunks,
  listLanguages,
  listLeads,
  listLoopCalls,
  listLoopDevices,
  listLoopDirectory,
  listLoopNumberRoutes,
  listLoopQueues,
  listLoopRecalls,
  listLoopRingGroups,
  listLoopRoutingRules,
  listMeetergoMeetingTypes,
  listMessagingConnectors,
  listMessagingConnectorWatchOptions,
  listMessengerFacebookPages,
  listModels,
  listPasskeys,
  listPerplexityModels,
  listPhoneNumbers,
  listPhoneNumberVerificationCatalog,
  listPhoneNumberVerifications,
  listPlatformCustomPayments,
  listPlatformUserCustomPayments,
  listPlatformUsers,
  listPromptTemplates,
  listQaRuns,
  listResellerPlans,
  listRoutineRuns,
  listRoutines,
  listRoutineVersions,
  listScheduledCallbacks,
  listSegmentLeads,
  listSegments,
  listSipTrunks,
  listSupportRequests,
  listSuppressionEntries,
  listTeamMembers,
  listToolRuns,
  listTools,
  listToolVersions,
  listTransactions,
  listTranslationSessions,
  listVariableSources,
  listVoiceClones,
  listVoices,
  listWhatsAppTemplates,
  listWidgetConnectors,
  listWorkspaces,
  liveCallControl,
  loginPlatformUser,
  logoutPlatformUser,
  lookupBookings,
  managePlatformUserPassword,
  manageSmsRegistration,
  manageSmsRegistrationBilling,
  mergeAudienceContacts,
  migrateFamulor1,
  migrateProviderAssistants,
  pauseRoutine,
  prepareAssistantAnnouncements,
  previewNaturalLanguageDashboard,
  publishRoutineVersion,
  reauthorizeTool,
  registerPlatformUser,
  releasePhoneNumber,
  removeCarrierNumber,
  removeCustomDomain,
  removeDashboardWidget,
  removeSuppressionEntry,
  renameAssistantVersion,
  renameLoopDevice,
  replaceAssistant,
  replaceAudienceContactChannels,
  replyToSupportRequest,
  requestAssistantComplianceReview,
  requestOutboundLimitIncrease,
  rescheduleBooking,
  restoreAssistantVersion,
  restoreToolVersion,
  retryRoutineRun,
  reviewSubscriptionPaymentChange,
  revokeApiKey,
  revokeLoopDevice,
  runAssistantTest,
  runAutomationAiAction,
  runCallActions,
  runCrawlSource,
  runCrmSync,
  runDriveSource,
  runHistoryActions,
  runPlatformCustomPaymentAction,
  runRoutine,
  runWhatsAppCallingAction,
  saveNaturalLanguageDashboard,
  searchAvailablePhoneNumbers,
  searchKnowledgeBase,
  sendSms,
  setAssistantAvatar,
  setAssistantGreetingAudio,
  setAssistantIntegrations,
  setAssistantTools,
  setLoopNumberRoute,
  setLoopPresence,
  setLoopRecording,
  setRoutineWebhookSecret,
  signOutAccountSession,
  startCampaign,
  startSlackOauth,
  startTranslationSession,
  startWhatsAppOutboundCall,
  stopCampaign,
  submitPhoneNumberVerification,
  submitVoiceCloneJob,
  testMessagingConnectorEndedWebhook,
  testTool,
  tidyAssistantFlow,
  transferPlatformUserBalance,
  transferWorkspaceOwnership,
  triggerAutomation,
  troubleshootCarrierConnection,
  updateAiInferenceSettings,
  updateAssistant,
  updateAssistantTest,
  updateAssistantVariables,
  updateAutomation,
  updateAutomationConnection,
  updateBookingEventType,
  updateCallerId,
  updateCampaign,
  updateCarrierConnection,
  updateConsentComplianceSettings,
  updateCrawlSource,
  updateCreditNotificationPreferences,
  updateCrmSync,
  updateCustomerMemory,
  updateDarkWindowSettings,
  updateDashboard,
  updateDashboardWidget,
  updateDriveSource,
  updateEmailAddress,
  updateEmailSettings,
  updateInboxLabelSettings,
  updateIntegration,
  updateKnowledgeBaseFaq,
  updateLead,
  updateLoopAvailability,
  updateLoopDialingPreferences,
  updateLoopQueue,
  updateLoopRingGroup,
  updateLoopRoutingRule,
  updateLoopSettings,
  updateMarketingIntegrations,
  updateMemorySettings,
  updateMessagingConnector,
  updatePhoneNumber,
  updatePlatformDefaultLimits,
  updatePlatformWelcomeCredits,
  updateResellerPlanInclusions,
  updateResellerPlanKnowledgeSources,
  updateResellerTaxRegistration,
  updateResellerTaxSettings,
  updateRetentionSettings,
  updateRoutine,
  updateSegment,
  updateSipTrunkIdentity,
  updateTeamMemberRole,
  updateTool,
  updateWhatsAppSenderProfile,
  updateWidgetConnector,
  updateWorkspaceCountry,
  uploadWhatsAppConnectorAsset,
  uploadWhatsAppTemplateReviewSample,
  uploadWidgetConnectorLogo,
  verifyCallInputs,
  verifyCustomDomain,
  verifyEmailDomain,
  whatsAppSenderProfileAction,
  whatsAppTemplatesAction,
];
