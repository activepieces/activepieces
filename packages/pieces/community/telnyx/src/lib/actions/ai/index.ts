import { telnyxCreateNotificationChannelAction } from './account-notifications/create-notification-channel';
import { telnyxCreateNotificationProfileAction } from './account-notifications/create-notification-profile';
import { telnyxCreateNotificationSettingAction } from './account-notifications/create-notification-setting';
import { telnyxDeleteNotificationChannelAction } from './account-notifications/delete-notification-channel';
import { telnyxDeleteNotificationProfileAction } from './account-notifications/delete-notification-profile';
import { telnyxDeleteNotificationSettingAction } from './account-notifications/delete-notification-setting';
import { telnyxGetBalanceAction } from './account-notifications/get-balance';
import { telnyxGetNotificationChannelAction } from './account-notifications/get-notification-channel';
import { telnyxGetNotificationProfileAction } from './account-notifications/get-notification-profile';
import { telnyxGetNotificationSettingAction } from './account-notifications/get-notification-setting';
import { telnyxListAuditLogsAction } from './account-notifications/list-audit-logs';
import { telnyxListNotificationChannelsAction } from './account-notifications/list-notification-channels';
import { telnyxListNotificationEventConditionsAction } from './account-notifications/list-notification-event-conditions';
import { telnyxListNotificationEventsAction } from './account-notifications/list-notification-events';
import { telnyxListNotificationProfilesAction } from './account-notifications/list-notification-profiles';
import { telnyxListNotificationSettingsAction } from './account-notifications/list-notification-settings';
import { telnyxListSsoProvidersAction } from './account-notifications/list-sso-providers';
import { telnyxUpdateNotificationChannelAction } from './account-notifications/update-notification-channel';
import { telnyxUpdateNotificationProfileAction } from './account-notifications/update-notification-profile';
import { telnyxAnswerCallAction } from './calls/answer-call';
import { telnyxBridgeCallsAction } from './calls/bridge-calls';
import { telnyxCreateQueueAction } from './calls/create-queue';
import { telnyxDeleteQueueAction } from './calls/delete-queue';
import { telnyxDialCallAction } from './calls/dial-call';
import { telnyxEnqueueCallAction } from './calls/enqueue-call';
import { telnyxGatherDtmfAction } from './calls/gather-dtmf';
import { telnyxGatherUsingAudioAction } from './calls/gather-using-audio';
import { telnyxGatherUsingSpeakAction } from './calls/gather-using-speak';
import { telnyxGetCallStatusAction } from './calls/get-call-status';
import { telnyxGetQueueAction } from './calls/get-queue';
import { telnyxHangupCallAction } from './calls/hangup-call';
import { telnyxListCallEventsAction } from './calls/list-call-events';
import { telnyxListQueueCallsAction } from './calls/list-queue-calls';
import { telnyxListQueuesAction } from './calls/list-queues';
import { telnyxPauseCallRecordingAction } from './calls/pause-call-recording';
import { telnyxPlayAudioAction } from './calls/play-audio';
import { telnyxRejectCallAction } from './calls/reject-call';
import { telnyxRemoveCallFromQueueAction } from './calls/remove-call-from-queue';
import { telnyxResumeCallRecordingAction } from './calls/resume-call-recording';
import { telnyxSendDtmfAction } from './calls/send-dtmf';
import { telnyxSipReferCallAction } from './calls/sip-refer-call';
import { telnyxSpeakTextAction } from './calls/speak-text';
import { telnyxStartCallRecordingAction } from './calls/start-call-recording';
import { telnyxStartCallTranscriptionAction } from './calls/start-call-transcription';
import { telnyxStopAudioAction } from './calls/stop-audio';
import { telnyxStopCallRecordingAction } from './calls/stop-call-recording';
import { telnyxStopCallTranscriptionAction } from './calls/stop-call-transcription';
import { telnyxStopGatherAction } from './calls/stop-gather';
import { telnyxSwitchSupervisorRoleAction } from './calls/switch-supervisor-role';
import { telnyxTransferCallAction } from './calls/transfer-call';
import { telnyxUpdateCallClientStateAction } from './calls/update-call-client-state';
import { telnyxUpdateQueueAction } from './calls/update-queue';
import { telnyxCreateConferenceAction } from './conferences/create-conference';
import { telnyxEndConferenceAction } from './conferences/end-conference';
import { telnyxGatherConferenceDtmfAction } from './conferences/gather-conference-dtmf';
import { telnyxGetConferenceAction } from './conferences/get-conference';
import { telnyxGetConferenceParticipantAction } from './conferences/get-conference-participant';
import { telnyxHoldConferenceParticipantsAction } from './conferences/hold-conference-participants';
import { telnyxJoinConferenceAction } from './conferences/join-conference';
import { telnyxLeaveConferenceAction } from './conferences/leave-conference';
import { telnyxListConferenceParticipantsAction } from './conferences/list-conference-participants';
import { telnyxListConferencesAction } from './conferences/list-conferences';
import { telnyxMuteConferenceParticipantsAction } from './conferences/mute-conference-participants';
import { telnyxPauseConferenceRecordingAction } from './conferences/pause-conference-recording';
import { telnyxPlayConferenceAudioAction } from './conferences/play-conference-audio';
import { telnyxResumeConferenceRecordingAction } from './conferences/resume-conference-recording';
import { telnyxSendConferenceDtmfAction } from './conferences/send-conference-dtmf';
import { telnyxSpeakToConferenceAction } from './conferences/speak-to-conference';
import { telnyxStartConferenceRecordingAction } from './conferences/start-conference-recording';
import { telnyxStopConferenceAudioAction } from './conferences/stop-conference-audio';
import { telnyxStopConferenceRecordingAction } from './conferences/stop-conference-recording';
import { telnyxUnholdConferenceParticipantsAction } from './conferences/unhold-conference-participants';
import { telnyxUnmuteConferenceParticipantsAction } from './conferences/unmute-conference-participants';
import { telnyxUpdateConferenceParticipantAction } from './conferences/update-conference-participant';
import { telnyxUpdateConferenceSupervisorRoleAction } from './conferences/update-conference-supervisor-role';
import { telnyxCreateCallControlApplicationAction } from './connections/create-call-control-application';
import { telnyxDeleteCallControlApplicationAction } from './connections/delete-call-control-application';
import { telnyxGetCallControlApplicationAction } from './connections/get-call-control-application';
import { telnyxGetConnectionAction } from './connections/get-connection';
import { telnyxListActiveCallsAction } from './connections/list-active-calls';
import { telnyxListCallControlApplicationsAction } from './connections/list-call-control-applications';
import { telnyxListConnectionsAction } from './connections/list-connections';
import { telnyxListFaxApplicationsAction } from './connections/list-fax-applications';
import { telnyxListOutboundVoiceProfilesAction } from './connections/list-outbound-voice-profiles';
import { telnyxUpdateCallControlApplicationAction } from './connections/update-call-control-application';
import { telnyxCancelScheduledMessageAction } from './messaging/cancel-scheduled-message';
import { telnyxGetGroupMmsAction } from './messaging/get-group-mms';
import { telnyxGetMessageAction } from './messaging/get-message';
import { telnyxListMessagingOptoutsAction } from './messaging/list-messaging-optouts';
import { telnyxListMessagingProfileMetricsAction } from './messaging/list-messaging-profile-metrics';
import { telnyxListMessagingUrlDomainsAction } from './messaging/list-messaging-url-domains';
import { telnyxScheduleMessageAction } from './messaging/schedule-message';
import { telnyxSendGroupMmsAction } from './messaging/send-group-mms';
import { telnyxSendMessageAction } from './messaging/send-message';
import { telnyxCreateAutoResponseAction } from './messaging-profiles/create-auto-response';
import { telnyxCreateMessagingProfileAction } from './messaging-profiles/create-messaging-profile';
import { telnyxDeleteAutoResponseAction } from './messaging-profiles/delete-auto-response';
import { telnyxDeleteMessagingProfileAction } from './messaging-profiles/delete-messaging-profile';
import { telnyxGetAutoResponseAction } from './messaging-profiles/get-auto-response';
import { telnyxGetMessagingProfileAction } from './messaging-profiles/get-messaging-profile';
import { telnyxGetMessagingProfileMetricsAction } from './messaging-profiles/get-messaging-profile-metrics';
import { telnyxListAutoResponsesAction } from './messaging-profiles/list-auto-responses';
import { telnyxListMessagingProfileAlphanumericSenderIdsAction } from './messaging-profiles/list-messaging-profile-alphanumeric-sender-ids';
import { telnyxListMessagingProfilePhoneNumbersAction } from './messaging-profiles/list-messaging-profile-phone-numbers';
import { telnyxListMessagingProfileShortCodesAction } from './messaging-profiles/list-messaging-profile-short-codes';
import { telnyxListMessagingProfilesAction } from './messaging-profiles/list-messaging-profiles';
import { telnyxRegenerateMessagingProfileSecretAction } from './messaging-profiles/regenerate-messaging-profile-secret';
import { telnyxUpdateAutoResponseAction } from './messaging-profiles/update-auto-response';
import { telnyxUpdateMessagingProfileAction } from './messaging-profiles/update-messaging-profile';
import { telnyxCreateNetworkAction } from './networking/create-network';
import { telnyxDeleteNetworkAction } from './networking/delete-network';
import { telnyxGetBlackBoxTestResultsAction } from './networking/get-black-box-test-results';
import { telnyxGetDynamicEmergencyEndpointAction } from './networking/get-dynamic-emergency-endpoint';
import { telnyxGetNetworkAction } from './networking/get-network';
import { telnyxListDynamicEmergencyEndpointsAction } from './networking/list-dynamic-emergency-endpoints';
import { telnyxListGlobalIpHealthCheckTypesAction } from './networking/list-global-ip-health-check-types';
import { telnyxListMobileNetworkOperatorsAction } from './networking/list-mobile-network-operators';
import { telnyxListNetworkInterfacesAction } from './networking/list-network-interfaces';
import { telnyxListNetworksAction } from './networking/list-networks';
import { telnyxUpdateNetworkAction } from './networking/update-network';
import { telnyxCreateNumberOrderAction } from './phone-numbers/create-number-order';
import { telnyxCreateVoicemailSettingsAction } from './phone-numbers/create-voicemail-settings';
import { telnyxGetNumberOrderAction } from './phone-numbers/get-number-order';
import { telnyxGetPhoneNumberAction } from './phone-numbers/get-phone-number';
import { telnyxGetPhoneNumberMessagingSettingsAction } from './phone-numbers/get-phone-number-messaging-settings';
import { telnyxGetPhoneNumberVoiceSettingsAction } from './phone-numbers/get-phone-number-voice-settings';
import { telnyxGetVoicemailSettingsAction } from './phone-numbers/get-voicemail-settings';
import { telnyxListNumberOrdersAction } from './phone-numbers/list-number-orders';
import { telnyxListPhoneNumbersAction } from './phone-numbers/list-phone-numbers';
import { telnyxLookupPhoneNumberAction } from './phone-numbers/lookup-phone-number';
import { telnyxReleasePhoneNumberAction } from './phone-numbers/release-phone-number';
import { telnyxSearchAvailablePhoneNumbersAction } from './phone-numbers/search-available-phone-numbers';
import { telnyxUpdateNumberOrderAction } from './phone-numbers/update-number-order';
import { telnyxUpdatePhoneNumberAction } from './phone-numbers/update-phone-number';
import { telnyxUpdatePhoneNumberMessagingSettingsAction } from './phone-numbers/update-phone-number-messaging-settings';
import { telnyxUpdatePhoneNumberVoiceSettingsAction } from './phone-numbers/update-phone-number-voice-settings';
import { telnyxUpdateVoicemailSettingsAction } from './phone-numbers/update-voicemail-settings';
import { telnyxCancelFaxAction } from './recordings-media/cancel-fax';
import { telnyxDeleteFaxAction } from './recordings-media/delete-fax';
import { telnyxDeleteMediaAction } from './recordings-media/delete-media';
import { telnyxDeleteRecordingAction } from './recordings-media/delete-recording';
import { telnyxDeleteRecordingTranscriptionAction } from './recordings-media/delete-recording-transcription';
import { telnyxGetFaxAction } from './recordings-media/get-fax';
import { telnyxGetMediaAction } from './recordings-media/get-media';
import { telnyxGetRecordingAction } from './recordings-media/get-recording';
import { telnyxGetRecordingTranscriptionAction } from './recordings-media/get-recording-transcription';
import { telnyxListFaxesAction } from './recordings-media/list-faxes';
import { telnyxListMediaAction } from './recordings-media/list-media';
import { telnyxListRecordingTranscriptionsAction } from './recordings-media/list-recording-transcriptions';
import { telnyxListRecordingsAction } from './recordings-media/list-recordings';
import { telnyxRefreshFaxAction } from './recordings-media/refresh-fax';
import { telnyxSendFaxAction } from './recordings-media/send-fax';
import { telnyxUpdateMediaAction } from './recordings-media/update-media';
import { telnyxUploadMediaAction } from './recordings-media/upload-media';
import { telnyxCheckVerificationCodeAction } from './verify/check-verification-code';
import { telnyxCheckVerificationCodeByPhoneNumberAction } from './verify/check-verification-code-by-phone-number';
import { telnyxCreateVerifyProfileAction } from './verify/create-verify-profile';
import { telnyxCreateVerifyTemplateAction } from './verify/create-verify-template';
import { telnyxDeleteVerifiedNumberAction } from './verify/delete-verified-number';
import { telnyxDeleteVerifyProfileAction } from './verify/delete-verify-profile';
import { telnyxGetVerificationAction } from './verify/get-verification';
import { telnyxGetVerifiedNumberAction } from './verify/get-verified-number';
import { telnyxGetVerifyProfileAction } from './verify/get-verify-profile';
import { telnyxListVerificationsByPhoneNumberAction } from './verify/list-verifications-by-phone-number';
import { telnyxListVerifiedNumbersAction } from './verify/list-verified-numbers';
import { telnyxListVerifyProfilesAction } from './verify/list-verify-profiles';
import { telnyxListVerifyTemplatesAction } from './verify/list-verify-templates';
import { telnyxRequestNumberVerificationAction } from './verify/request-number-verification';
import { telnyxSendCallVerificationAction } from './verify/send-call-verification';
import { telnyxSendFlashcallVerificationAction } from './verify/send-flashcall-verification';
import { telnyxSendSmsVerificationAction } from './verify/send-sms-verification';
import { telnyxSubmitNumberVerificationCodeAction } from './verify/submit-number-verification-code';
import { telnyxUpdateVerifyProfileAction } from './verify/update-verify-profile';
import { telnyxUpdateVerifyTemplateAction } from './verify/update-verify-template';

export const telnyxAiActions = [
	telnyxSendMessageAction,
	telnyxSendGroupMmsAction,
	telnyxScheduleMessageAction,
	telnyxGetMessageAction,
	telnyxCancelScheduledMessageAction,
	telnyxGetGroupMmsAction,
	telnyxListMessagingOptoutsAction,
	telnyxListMessagingProfileMetricsAction,
	telnyxListMessagingUrlDomainsAction,
	telnyxListMessagingProfilesAction,
	telnyxCreateMessagingProfileAction,
	telnyxGetMessagingProfileAction,
	telnyxUpdateMessagingProfileAction,
	telnyxDeleteMessagingProfileAction,
	telnyxListMessagingProfilePhoneNumbersAction,
	telnyxListMessagingProfileShortCodesAction,
	telnyxListMessagingProfileAlphanumericSenderIdsAction,
	telnyxGetMessagingProfileMetricsAction,
	telnyxRegenerateMessagingProfileSecretAction,
	telnyxListAutoResponsesAction,
	telnyxCreateAutoResponseAction,
	telnyxGetAutoResponseAction,
	telnyxUpdateAutoResponseAction,
	telnyxDeleteAutoResponseAction,
	telnyxListPhoneNumbersAction,
	telnyxGetPhoneNumberAction,
	telnyxUpdatePhoneNumberAction,
	telnyxReleasePhoneNumberAction,
	telnyxGetPhoneNumberMessagingSettingsAction,
	telnyxUpdatePhoneNumberMessagingSettingsAction,
	telnyxGetPhoneNumberVoiceSettingsAction,
	telnyxUpdatePhoneNumberVoiceSettingsAction,
	telnyxGetVoicemailSettingsAction,
	telnyxCreateVoicemailSettingsAction,
	telnyxUpdateVoicemailSettingsAction,
	telnyxSearchAvailablePhoneNumbersAction,
	telnyxListNumberOrdersAction,
	telnyxCreateNumberOrderAction,
	telnyxGetNumberOrderAction,
	telnyxUpdateNumberOrderAction,
	telnyxLookupPhoneNumberAction,
	telnyxDialCallAction,
	telnyxGetCallStatusAction,
	telnyxAnswerCallAction,
	telnyxHangupCallAction,
	telnyxRejectCallAction,
	telnyxSpeakTextAction,
	telnyxPlayAudioAction,
	telnyxStopAudioAction,
	telnyxGatherDtmfAction,
	telnyxGatherUsingSpeakAction,
	telnyxGatherUsingAudioAction,
	telnyxStopGatherAction,
	telnyxSendDtmfAction,
	telnyxTransferCallAction,
	telnyxBridgeCallsAction,
	telnyxSipReferCallAction,
	telnyxStartCallRecordingAction,
	telnyxStopCallRecordingAction,
	telnyxPauseCallRecordingAction,
	telnyxResumeCallRecordingAction,
	telnyxStartCallTranscriptionAction,
	telnyxStopCallTranscriptionAction,
	telnyxEnqueueCallAction,
	telnyxRemoveCallFromQueueAction,
	telnyxUpdateCallClientStateAction,
	telnyxSwitchSupervisorRoleAction,
	telnyxListCallEventsAction,
	telnyxListQueuesAction,
	telnyxCreateQueueAction,
	telnyxGetQueueAction,
	telnyxDeleteQueueAction,
	telnyxListQueueCallsAction,
	telnyxUpdateQueueAction,
	telnyxListConferencesAction,
	telnyxCreateConferenceAction,
	telnyxGetConferenceAction,
	telnyxListConferenceParticipantsAction,
	telnyxGetConferenceParticipantAction,
	telnyxUpdateConferenceParticipantAction,
	telnyxEndConferenceAction,
	telnyxJoinConferenceAction,
	telnyxLeaveConferenceAction,
	telnyxHoldConferenceParticipantsAction,
	telnyxUnholdConferenceParticipantsAction,
	telnyxMuteConferenceParticipantsAction,
	telnyxUnmuteConferenceParticipantsAction,
	telnyxPlayConferenceAudioAction,
	telnyxStopConferenceAudioAction,
	telnyxSpeakToConferenceAction,
	telnyxSendConferenceDtmfAction,
	telnyxGatherConferenceDtmfAction,
	telnyxStartConferenceRecordingAction,
	telnyxStopConferenceRecordingAction,
	telnyxPauseConferenceRecordingAction,
	telnyxResumeConferenceRecordingAction,
	telnyxUpdateConferenceSupervisorRoleAction,
	telnyxListRecordingsAction,
	telnyxGetRecordingAction,
	telnyxDeleteRecordingAction,
	telnyxListRecordingTranscriptionsAction,
	telnyxGetRecordingTranscriptionAction,
	telnyxDeleteRecordingTranscriptionAction,
	telnyxListMediaAction,
	telnyxUploadMediaAction,
	telnyxGetMediaAction,
	telnyxUpdateMediaAction,
	telnyxDeleteMediaAction,
	telnyxListFaxesAction,
	telnyxSendFaxAction,
	telnyxGetFaxAction,
	telnyxDeleteFaxAction,
	telnyxCancelFaxAction,
	telnyxRefreshFaxAction,
	telnyxCheckVerificationCodeByPhoneNumberAction,
	telnyxCheckVerificationCodeAction,
	telnyxCreateVerifyProfileAction,
	telnyxCreateVerifyTemplateAction,
	telnyxDeleteVerifiedNumberAction,
	telnyxDeleteVerifyProfileAction,
	telnyxGetVerificationAction,
	telnyxGetVerifiedNumberAction,
	telnyxGetVerifyProfileAction,
	telnyxListVerificationsByPhoneNumberAction,
	telnyxListVerifiedNumbersAction,
	telnyxListVerifyProfilesAction,
	telnyxListVerifyTemplatesAction,
	telnyxRequestNumberVerificationAction,
	telnyxSendCallVerificationAction,
	telnyxSendFlashcallVerificationAction,
	telnyxSendSmsVerificationAction,
	telnyxSubmitNumberVerificationCodeAction,
	telnyxUpdateVerifyProfileAction,
	telnyxUpdateVerifyTemplateAction,
	telnyxCreateCallControlApplicationAction,
	telnyxDeleteCallControlApplicationAction,
	telnyxGetCallControlApplicationAction,
	telnyxGetConnectionAction,
	telnyxListActiveCallsAction,
	telnyxListCallControlApplicationsAction,
	telnyxListConnectionsAction,
	telnyxListFaxApplicationsAction,
	telnyxListOutboundVoiceProfilesAction,
	telnyxUpdateCallControlApplicationAction,
	telnyxGetBalanceAction,
	telnyxListAuditLogsAction,
	telnyxListSsoProvidersAction,
	telnyxListNotificationChannelsAction,
	telnyxCreateNotificationChannelAction,
	telnyxGetNotificationChannelAction,
	telnyxUpdateNotificationChannelAction,
	telnyxDeleteNotificationChannelAction,
	telnyxListNotificationProfilesAction,
	telnyxCreateNotificationProfileAction,
	telnyxGetNotificationProfileAction,
	telnyxUpdateNotificationProfileAction,
	telnyxDeleteNotificationProfileAction,
	telnyxListNotificationSettingsAction,
	telnyxCreateNotificationSettingAction,
	telnyxGetNotificationSettingAction,
	telnyxDeleteNotificationSettingAction,
	telnyxListNotificationEventsAction,
	telnyxListNotificationEventConditionsAction,
	telnyxListNetworksAction,
	telnyxCreateNetworkAction,
	telnyxGetNetworkAction,
	telnyxUpdateNetworkAction,
	telnyxDeleteNetworkAction,
	telnyxListNetworkInterfacesAction,
	telnyxListDynamicEmergencyEndpointsAction,
	telnyxGetDynamicEmergencyEndpointAction,
	telnyxListMobileNetworkOperatorsAction,
	telnyxListGlobalIpHealthCheckTypesAction,
	telnyxGetBlackBoxTestResultsAction,
];
