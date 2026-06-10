import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { ampecoAuth } from './lib/common/auth';

// Import actions
import { chargePointChangeAvailabilityAction } from './lib/actions/actions/charge-point/charge-point-change-availability';
import { chargePointChangeOwnerAction } from './lib/actions/actions/charge-point/charge-point-change-owner';
import { chargePointClearChargingProfileAction } from './lib/actions/actions/charge-point/charge-point-clear-charging-profile';
import { chargePointGetDiagnosticsAction } from './lib/actions/actions/charge-point/charge-point-get-diagnostics';
import { chargePointGetSecurityLogAction } from './lib/actions/actions/charge-point/charge-point-get-security-log';
import { chargePointMoveEvsesToSatelliteAction } from './lib/actions/actions/charge-point/charge-point-move-evses-to-satellite';
import { chargePointReserveAction } from './lib/actions/actions/charge-point/charge-point-reserve';
import { chargePointResetSecurityProfileAction } from './lib/actions/actions/charge-point/charge-point-reset-security-profile';
import { chargePointResetAction } from './lib/actions/actions/charge-point/charge-point-reset';
import { chargePointSendDataTransferAction } from './lib/actions/actions/charge-point/charge-point-send-data-transfer';
import { chargePointSetChargingProfileAction } from './lib/actions/actions/charge-point/charge-point-set-charging-profile';
import { chargePointStartChargingSessionWithoutEvseAction } from './lib/actions/actions/charge-point/charge-point-start-charging-session-without-evse';
import { chargePointStartChargingSessionAction } from './lib/actions/actions/charge-point/charge-point-start-charging-session';
import { chargePointStopChargingSessionAction } from './lib/actions/actions/charge-point/charge-point-stop-charging-session';
import { chargePointSyncConfigurationAction } from './lib/actions/actions/charge-point/charge-point-sync-configuration';
import { chargePointTriggerMessageChargePointAction } from './lib/actions/actions/charge-point/charge-point-trigger-message-charge-point';
import { chargePointEvseUnlockAction } from './lib/actions/actions/charge-point/charge-point-evse-unlock';
import { chargePointChangeSharingCodeAction } from './lib/actions/actions/charge-point/charge-point-change-sharing-code';
import { chargePointDeleteCertificateAction } from './lib/actions/actions/charge-point/charge-point-delete-certificate';
import { chargePointInstallCertificateAction } from './lib/actions/actions/charge-point/charge-point-install-certificate';
import { chargePointSetConfigurationAction } from './lib/actions/actions/charge-point/charge-point-set-configuration';
import { chargePointGetInstalledCertificateIdsAction } from './lib/actions/actions/charge-point/charge-point-get-installed-certificate-ids';
import { chargePointUpdateFirmwareAction } from './lib/actions/actions/charge-point/charge-point-update-firmware';
import { circuitAttachChargePointAction } from './lib/actions/actions/circuit/circuit-attach-charge-point';
import { circuitDetachChargePointAction } from './lib/actions/actions/circuit/circuit-detach-charge-point';
import { circuitSetChargePointPriorityAction } from './lib/actions/actions/circuit/circuit-set-charge-point-priority';
import { circuitSetChargePointEvsePriorityAction } from './lib/actions/actions/circuit/circuit-set-charge-point-evse-priority';
import { circuitSetCircuitSocPriorityAction } from './lib/actions/actions/circuit/circuit-set-circuit-soc-priority';
import { circuitSetSessionPriorityAction } from './lib/actions/actions/circuit/circuit-set-session-priority';
import { configurationTemplateApplyToChargePointsAction } from './lib/actions/actions/configuration-template/configuration-template-apply-to-charge-points';
import { configurationTemplateBulkCreateVariablesAction } from './lib/actions/actions/configuration-template/configuration-template-bulk-create-variables';
import { electricityMeterReportConsumptionAction } from './lib/actions/actions/electricity-meter/electricity-meter-report-consumption';
import { evseStartChargingWithEvseIdAction } from './lib/actions/actions/evse/evse-start-charging-with-evse-id';
import { evseTriggerMessageAction } from './lib/actions/actions/evse/evse-trigger-message';
import { changeFlexibilityAssetStatusAction } from './lib/actions/actions/flexibility-asset/change-flexibility-asset-status';
import { flexibilityAssetCreateActivationRequestAction } from './lib/actions/actions/flexibility-asset/flexibility-asset-create-activation-request';
import { certificateReissueAnEmaidAction } from './lib/actions/actions/id-tag/certificate-reissue-an-emaid';
import { locationCheckBookingAvailabilityAction } from './lib/actions/actions/locations/location-check-booking-availability';
import { notificationsResendFailedAction } from './lib/actions/actions/notifications/notifications-resend-failed';
import { parkingSpaceUpdateOccupancyStatusAction } from './lib/actions/actions/parking-spaces/parking-space-update-occupancy-status';
import { certificateIssueAnEmaidAction } from './lib/actions/actions/provisioning-certificate/certificate-issue-an-emaid';
import { reservationCancelAction } from './lib/actions/actions/reservation/reservation-cancel';
import { updateCustomTariffFilterTariffAction } from './lib/actions/actions/roaming-operator/update-custom-tariff-filter-tariff';
import { sessionAssignToUserAction } from './lib/actions/actions/session/session-assign-to-user';
import { sessionRetryPaymentAction } from './lib/actions/actions/session/session-retry-payment';
import { subscriptionPlanReplaceAction } from './lib/actions/actions/subscription-plans/subscription-plan-replace';
import { tariffSetDisplayInformationAction } from './lib/actions/actions/tariffs/tariff-set-display-information';
import { transactionIssueInvoiceAction } from './lib/actions/actions/transactions/transaction-issue-invoice';
import { transactionResendInvoiceAction } from './lib/actions/actions/transactions/transaction-resend-invoice';
import { transactionUpdatePaymentReferenceAction } from './lib/actions/actions/transactions/transaction-update-payment-reference';
import { userActivateSubscriptionAction } from './lib/actions/actions/users/user-activate-subscription';
import { userAddBalanceAction } from './lib/actions/actions/users/user-add-balance';
import { userApplyCustomFeeAction } from './lib/actions/actions/users/user-apply-custom-fee';
import { userCancelSubscriptionAction } from './lib/actions/actions/users/user-cancel-subscription';
import { userChangeStatusAction } from './lib/actions/actions/users/user-change-status';
import { userClearSubscriptionAmountDueAction } from './lib/actions/actions/users/user-clear-subscription-amount-due';
import { userExportAllPrivateDataAction } from './lib/actions/actions/users/user-export-all-private-data';
import { userRedeemVoucherAction } from './lib/actions/actions/users/user-redeem-voucher';
import { notificationsSubscribeAction } from './lib/actions/notifications/notifications/notifications-subscribe';
import { notificationsListingAction } from './lib/actions/notifications/notifications/notifications-listing';
import { notificationReadAction } from './lib/actions/notifications/notifications/notification-read';
import { notificationsCreateAction } from './lib/actions/notifications/notifications/notifications-create';
import { notificationsUnsubscribeAction } from './lib/actions/notifications/notifications/notifications-unsubscribe';
import { authorizationsListingAction } from './lib/actions/resources/authorizations/authorizations-listing';
import { authorizationReadAction } from './lib/actions/resources/authorizations/authorization-read';
import { bookingRequestsListingAction } from './lib/actions/resources/booking-requests/booking-requests-listing';
import { bookingRequestCreateAction } from './lib/actions/resources/booking-requests/booking-request-create';
import { bookingRequestReadAction } from './lib/actions/resources/booking-requests/booking-request-read';
import { bookingsListingAction } from './lib/actions/resources/bookings/bookings-listing';
import { bookingReadAction } from './lib/actions/resources/bookings/booking-read';
import { cdrsListingAction } from './lib/actions/resources/cdrs/cdrs-listing';
import { cdrReadAction } from './lib/actions/resources/cdrs/cdr-read';
import { chargePointDowntimePeriodsListingAction } from './lib/actions/resources/charge-point-downtime-periods/charge-point-downtime-periods-listing';
import { chargePointDowntimePeriodCreateAction } from './lib/actions/resources/charge-point-downtime-periods/charge-point-downtime-period-create';
import { chargePointDowntimePeriodReadAction } from './lib/actions/resources/charge-point-downtime-periods/charge-point-downtime-period-read';
import { chargePointDowntimePeriodUpdateAction } from './lib/actions/resources/charge-point-downtime-periods/charge-point-downtime-period-update';
import { chargePointDowntimePeriodDeleteAction } from './lib/actions/resources/charge-point-downtime-periods/charge-point-downtime-period-delete';
import { chargePointModelsListingAction } from './lib/actions/resources/charge-point-models/charge-point-models-listing';
import { chargePointModelCreateAction } from './lib/actions/resources/charge-point-models/charge-point-model-create';
import { chargePointModelReadAction } from './lib/actions/resources/charge-point-models/charge-point-model-read';
import { chargePointModelUpdateAction } from './lib/actions/resources/charge-point-models/charge-point-model-update';
import { chargePointModelDeleteAction } from './lib/actions/resources/charge-point-models/charge-point-model-delete';
import { chargePointVendorsListingAction } from './lib/actions/resources/charge-point-vendors/charge-point-vendors-listing';
import { chargePointVendorCreateAction } from './lib/actions/resources/charge-point-vendors/charge-point-vendor-create';
import { chargePointVendorReadAction } from './lib/actions/resources/charge-point-vendors/charge-point-vendor-read';
import { chargePointVendorUpdateAction } from './lib/actions/resources/charge-point-vendors/charge-point-vendor-update';
import { chargePointVendorDeleteAction } from './lib/actions/resources/charge-point-vendors/charge-point-vendor-delete';
import { chargePointStatusReadAction } from './lib/actions/resources/charge-points/charge-point-status-read';
import { chargePointCreateAction } from './lib/actions/resources/charge-points/charge-point-create';
import { chargePointsListingAction } from './lib/actions/resources/charge-points/charge-points-listing';
import { chargePointUpdateAction } from './lib/actions/resources/charge-points/charge-point-update';
import { chargePointReadAction } from './lib/actions/resources/charge-points/charge-point-read';
import { chargePointDeleteAction } from './lib/actions/resources/charge-points/charge-point-delete';
import { chargePointAvailablePersonalSmartChargingModesListingAction } from './lib/actions/resources/charge-points/charge-point-available-personal-smart-charging-modes-listing';
import { chargePointConfigurationsListingAction } from './lib/actions/resources/charge-points/charge-point-configurations-listing';
import { chargePointConfigurationReadAction } from './lib/actions/resources/charge-points/charge-point-configuration-read';
import { chargePointConfigurationUpdateAction } from './lib/actions/resources/charge-points/charge-point-configuration-update';
import { chargePointEvseCreateAction } from './lib/actions/resources/charge-points/charge-point-evse-create';
import { chargePointEvsesListingAction } from './lib/actions/resources/charge-points/charge-point-evses-listing';
import { chargePointEvseUpdateAction } from './lib/actions/resources/charge-points/charge-point-evse-update';
import { chargePointEvseReadAction } from './lib/actions/resources/charge-points/charge-point-evse-read';
import { chargePointEvseDeleteAction } from './lib/actions/resources/charge-points/charge-point-evse-delete';
import { chargePointEvseConnectorsListingAction } from './lib/actions/resources/charge-points/charge-point-evse-connectors-listing';
import { chargePointEvseConnectorCreateAction } from './lib/actions/resources/charge-points/charge-point-evse-connector-create';
import { chargePointEvseConnectorReadAction } from './lib/actions/resources/charge-points/charge-point-evse-connector-read';
import { chargePointEvseConnectorUpdateAction } from './lib/actions/resources/charge-points/charge-point-evse-connector-update';
import { chargePointEvseConnectorDeleteAction } from './lib/actions/resources/charge-points/charge-point-evse-connector-delete';
import { listChargePointHardwareStatusLogsAction } from './lib/actions/resources/charge-points/list-charge-point-hardware-status-logs';
import { getChargePointLatestHardwareStatusLogAction } from './lib/actions/resources/charge-points/get-charge-point-latest-hardware-status-log';
import { getChargePointLatestNetworkStatusLogAction } from './lib/actions/resources/charge-points/get-charge-point-latest-network-status-log';
import { listChargePointNetworkStatusLogsAction } from './lib/actions/resources/charge-points/list-charge-point-network-status-logs';
import { chargePointPersonalSmartChargingPreferencesReadAction } from './lib/actions/resources/charge-points/charge-point-personal-smart-charging-preferences-read';
import { personalSmartChargingPreferencesUpdateAction } from './lib/actions/resources/charge-points/personal-smart-charging-preferences-update';
import { chargePointSharedPartnersListingAction } from './lib/actions/resources/charge-points/charge-point-shared-partners-listing';
import { chargePointSharedPartnersSyncAction } from './lib/actions/resources/charge-points/charge-point-shared-partners-sync';
import { chargePointShareCreateAction } from './lib/actions/resources/charge-points/charge-point-share-create';
import { chargePointSharesListingAction } from './lib/actions/resources/charge-points/charge-point-shares-listing';
import { chargePointShareReadAction } from './lib/actions/resources/charge-points/charge-point-share-read';
import { charegPointShareDeleteAction } from './lib/actions/resources/charge-points/chareg-point-share-delete';
import { chargePointSmartChargingUpdateAction } from './lib/actions/resources/charge-points/charge-point-smart-charging-update';
import { circuitsListingAction } from './lib/actions/resources/circuits/circuits-listing';
import { circuitCreateAction } from './lib/actions/resources/circuits/circuit-create';
import { circuitReadAction } from './lib/actions/resources/circuits/circuit-read';
import { circuitUpdateAction } from './lib/actions/resources/circuits/circuit-update';
import { circuitDeleteAction } from './lib/actions/resources/circuits/circuit-delete';
import { circuitChargePointPrioritiesListingAction } from './lib/actions/resources/circuits/circuit-charge-point-priorities-listing';
import { circuitConsumptionAction } from './lib/actions/resources/circuits/circuit-consumption';
import { circuitSocPrioritiesListingAction } from './lib/actions/resources/circuits/circuit-soc-priorities-listing';
import { circuitUnmanagedLoadReadAction } from './lib/actions/resources/circuits/circuit-unmanaged-load-read';
import { circuitUserPrioritiesListingAction } from './lib/actions/resources/circuits/circuit-user-priorities-listing';
import { circuitUserPriorityCreateAction } from './lib/actions/resources/circuits/circuit-user-priority-create';
import { circuitUserPriorityReadAction } from './lib/actions/resources/circuits/circuit-user-priority-read';
import { circuitUserPriorityUpdateAction } from './lib/actions/resources/circuits/circuit-user-priority-update';
import { circuitUserPriorityDeleteAction } from './lib/actions/resources/circuits/circuit-user-priority-delete';
import { listConfigurationTemplatesAction } from './lib/actions/resources/configuration-templates/list-configuration-templates';
import { createConfigurationTemplateAction } from './lib/actions/resources/configuration-templates/create-configuration-template';
import { updateConfigurationTemplateAction } from './lib/actions/resources/configuration-templates/update-configuration-template';
import { getConfigurationTemplateAction } from './lib/actions/resources/configuration-templates/get-configuration-template';
import { deleteConfigurationTemplateAction } from './lib/actions/resources/configuration-templates/delete-configuration-template';
import { configurationTemplateVariableListingAction } from './lib/actions/resources/configuration-templates/configuration-template-variable-listing';
import { configurationTemplateVariableCreateAction } from './lib/actions/resources/configuration-templates/configuration-template-variable-create';
import { configurationTemplateVariableUpdateAction } from './lib/actions/resources/configuration-templates/configuration-template-variable-update';
import { configurationTemplateVariableDeleteAction } from './lib/actions/resources/configuration-templates/configuration-template-variable-delete';
import { contactDetailsReadAction } from './lib/actions/resources/contact-details/contact-details-read';
import { contactDetailsUpdateAction } from './lib/actions/resources/contact-details/contact-details-update';
import { contactDetailsDeleteAction } from './lib/actions/resources/contact-details/contact-details-delete';
import { currenciesListingAction } from './lib/actions/resources/currencies/currencies-listing';
import { currencyCreateAction } from './lib/actions/resources/currencies/currency-create';
import { currencyReadAction } from './lib/actions/resources/currencies/currency-read';
import { currencyUpdateAction } from './lib/actions/resources/currencies/currency-update';
import { createCurrencyRateAction } from './lib/actions/resources/currency-rates/create-currency-rate';
import { listCurrencyRatesAction } from './lib/actions/resources/currency-rates/list-currency-rates';
import { updateCurrencyRateAction } from './lib/actions/resources/currency-rates/update-currency-rate';
import { getCurrencyRateAction } from './lib/actions/resources/currency-rates/get-currency-rate';
import { deleteCurrencyRateAction } from './lib/actions/resources/currency-rates/delete-currency-rate';
import { customFeesListingAction } from './lib/actions/resources/custom-fees/custom-fees-listing';
import { customFeeReadAction } from './lib/actions/resources/custom-fees/custom-fee-read';
import { getDowntimePeriodNoticesAction } from './lib/actions/resources/downtime-period-notices/get-downtime-period-notices';
import { postDowntimePeriodNoticeAction } from './lib/actions/resources/downtime-period-notices/post-downtime-period-notice';
import { getDowntimePeriodNoticeAction } from './lib/actions/resources/downtime-period-notices/get-downtime-period-notice';
import { patchDowntimePeriodNoticeAction } from './lib/actions/resources/downtime-period-notices/patch-downtime-period-notice';
import { deleteDowntimePeriodNoticeAction } from './lib/actions/resources/downtime-period-notices/delete-downtime-period-notice';
import { electricityMetersLisingAction } from './lib/actions/resources/electricity-meters/electricity-meters-lising';
import { electricityMeterCreateAction } from './lib/actions/resources/electricity-meters/electricity-meter-create';
import { electricityMeterReadAction } from './lib/actions/resources/electricity-meters/electricity-meter-read';
import { electricityMeterUpdateAction } from './lib/actions/resources/electricity-meters/electricity-meter-update';
import { electricityMeterDeleteAction } from './lib/actions/resources/electricity-meters/electricity-meter-delete';
import { electricityRatesListingAction } from './lib/actions/resources/electricity-rates/electricity-rates-listing';
import { electricityRateCreateAction } from './lib/actions/resources/electricity-rates/electricity-rate-create';
import { electricityRateReadAction } from './lib/actions/resources/electricity-rates/electricity-rate-read';
import { electricityRateUpdateAction } from './lib/actions/resources/electricity-rates/electricity-rate-update';
import { electricityRateDeleteAction } from './lib/actions/resources/electricity-rates/electricity-rate-delete';
import { electricityRateEnergyMixReadAction } from './lib/actions/resources/electricity-rates/electricity-rate-energy-mix-read';
import { electricityRateEnergyMixUpdateAction } from './lib/actions/resources/electricity-rates/electricity-rate-energy-mix-update';
import { electricityRatePricePeriodsListingAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-listing';
import { electricityRatePricePeriodsDateListingAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-date-listing';
import { electricityRatePricePeriodsDateReadAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-date-read';
import { electricityRatePricePeriodsDateCreateOrUpdateAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-date-create-or-update';
import { electricityRatePricePeriodsDateDeleteAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-date-delete';
import { electricityRatePricePeriodsWeekDayListingAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-week-day-listing';
import { electricityRatePricePeriodsWeekDayReadAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-week-day-read';
import { electricityRatePricePeriodsWeekDayCreateaOrUpdateAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-week-day-createa-or-update';
import { electricityRatePricePeriodsWeekDayDeleteAction } from './lib/actions/resources/electricity-rates/electricity-rate-price-periods-week-day-delete';
import { evseDowntimePeriodsListingAction } from './lib/actions/resources/evse-downtime-periods/evse-downtime-periods-listing';
import { evseDowntimePeriodCreateAction } from './lib/actions/resources/evse-downtime-periods/evse-downtime-period-create';
import { evseDowntimePeriodReadAction } from './lib/actions/resources/evse-downtime-periods/evse-downtime-period-read';
import { evseDowntimePeriodUpdateAction } from './lib/actions/resources/evse-downtime-periods/evse-downtime-period-update';
import { evseDowntimePeriodDeleteAction } from './lib/actions/resources/evse-downtime-periods/evse-downtime-period-delete';
import { listEvseHardwareStatusLogsAction } from './lib/actions/resources/evses/list-evse-hardware-status-logs';
import { getEvseLatestHardwareStatusLogAction } from './lib/actions/resources/evses/get-evse-latest-hardware-status-log';
import { evseCreateAction } from './lib/actions/resources/evses/evse-create';
import { evsesListingAction } from './lib/actions/resources/evses/evses-listing';
import { evseUpdateAction } from './lib/actions/resources/evses/evse-update';
import { evseReadAction } from './lib/actions/resources/evses/evse-read';
import { evseDeleteAction } from './lib/actions/resources/evses/evse-delete';
import { faqsListingAction } from './lib/actions/resources/faqs/faqs-listing';
import { faqCreateAction } from './lib/actions/resources/faqs/faq-create';
import { faqReadAction } from './lib/actions/resources/faqs/faq-read';
import { faqUpdateAction } from './lib/actions/resources/faqs/faq-update';
import { faqDeleteAction } from './lib/actions/resources/faqs/faq-delete';
import { firmwareVersionsListingAction } from './lib/actions/resources/firmware-versions/firmware-versions-listing';
import { firmwareVersionReadAction } from './lib/actions/resources/firmware-versions/firmware-version-read';
import { firmwareVersionAttachedModelsAction } from './lib/actions/resources/firmware-versions/firmware-version-attached-models';
import { listFlexibilityActivationRequestsAction } from './lib/actions/resources/flexibility-activation-requests/list-flexibility-activation-requests';
import { getFlexibilityActivationRequestAction } from './lib/actions/resources/flexibility-activation-requests/get-flexibility-activation-request';
import { createFlexibilityAssetAction } from './lib/actions/resources/flexibility-assets/create-flexibility-asset';
import { listFlexibilityAssetsAction } from './lib/actions/resources/flexibility-assets/list-flexibility-assets';
import { updateFlexibilityAssetAction } from './lib/actions/resources/flexibility-assets/update-flexibility-asset';
import { getFlexibilityAssetAction } from './lib/actions/resources/flexibility-assets/get-flexibility-asset';
import { deleteFlexibilityAssetAction } from './lib/actions/resources/flexibility-assets/delete-flexibility-asset';
import { getHistoricalTimeSeriesAction } from './lib/actions/resources/flexibility-assets/get-historical-time-series';
import { getTimeSeriesForecastAction } from './lib/actions/resources/flexibility-assets/get-time-series-forecast';
import { idTagsListingAction } from './lib/actions/resources/id-tags/id-tags-listing';
import { idTagCreateAction } from './lib/actions/resources/id-tags/id-tag-create';
import { idTagReadAction } from './lib/actions/resources/id-tags/id-tag-read';
import { idTagUpdateAction } from './lib/actions/resources/id-tags/id-tag-update';
import { idTagDeleteAction } from './lib/actions/resources/id-tags/id-tag-delete';
import { getInstallerJobsListAction } from './lib/actions/resources/installer-jobs/get-installer-jobs-list';
import { createInstallerJobAction } from './lib/actions/resources/installer-jobs/create-installer-job';
import { getInstallerJobAction } from './lib/actions/resources/installer-jobs/get-installer-job';
import { updateInstallerJobAction } from './lib/actions/resources/installer-jobs/update-installer-job';
import { deleteInstallerJobAction } from './lib/actions/resources/installer-jobs/delete-installer-job';
import { invoicesListingAction } from './lib/actions/resources/invoices/invoices-listing';
import { invoiceReadAction } from './lib/actions/resources/invoices/invoice-read';
import { locationCreateAction } from './lib/actions/resources/locations/location-create';
import { locationsListingAction } from './lib/actions/resources/locations/locations-listing';
import { locationUpdateAction } from './lib/actions/resources/locations/location-update';
import { locationReadAction } from './lib/actions/resources/locations/location-read';
import { locationDeleteAction } from './lib/actions/resources/locations/location-delete';
import { locationChargingZonesListingAction } from './lib/actions/resources/locations/location-charging-zones-listing';
import { locationChargingZoneCreateAction } from './lib/actions/resources/locations/location-charging-zone-create';
import { locationChargingZoneReadAction } from './lib/actions/resources/locations/location-charging-zone-read';
import { locationChargingZoneUpdateAction } from './lib/actions/resources/locations/location-charging-zone-update';
import { locationChargingZoneDeleteAction } from './lib/actions/resources/locations/location-charging-zone-delete';
import { createParkingSpaceAction } from './lib/actions/resources/parking-spaces/create-parking-space';
import { listParkingSpaceAction } from './lib/actions/resources/parking-spaces/list-parking-space';
import { updateParkingSpaceAction } from './lib/actions/resources/parking-spaces/update-parking-space';
import { getParkingSpaceAction } from './lib/actions/resources/parking-spaces/get-parking-space';
import { deleteParkingSpaceAction } from './lib/actions/resources/parking-spaces/delete-parking-space';
import { partnerContractsListingAction } from './lib/actions/resources/partner-contracts/partner-contracts-listing';
import { partnerContractCreateAction } from './lib/actions/resources/partner-contracts/partner-contract-create';
import { partnerContractReadAction } from './lib/actions/resources/partner-contracts/partner-contract-read';
import { partnerContractUpdateAction } from './lib/actions/resources/partner-contracts/partner-contract-update';
import { partnerContractDeleteAction } from './lib/actions/resources/partner-contracts/partner-contract-delete';
import { expensesListingAction } from './lib/actions/resources/partner-expenses/expenses-listing';
import { partnerInvitesListingAction } from './lib/actions/resources/partner-invites/partner-invites-listing';
import { partnerInviteCreateAction } from './lib/actions/resources/partner-invites/partner-invite-create';
import { partnerInviteReadAction } from './lib/actions/resources/partner-invites/partner-invite-read';
import { partnerInviteUpdateAction } from './lib/actions/resources/partner-invites/partner-invite-update';
import { partnerInviteDeleteAction } from './lib/actions/resources/partner-invites/partner-invite-delete';
import { revenuesListingAction } from './lib/actions/resources/partner-revenues/revenues-listing';
import { partnerSettlementReportsListingAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-reports-listing';
import { partnerSettlementReportReadAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-report-read';
import { partnerSettlementReportPartnerSettlementRecordsListingAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-report-partner-settlement-records-listing';
import { partnerSettlementReportPartnerSettlementRecordCreateAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-report-partner-settlement-record-create';
import { partnertSettlementReportPartnerSettlementRecordReadAction } from './lib/actions/resources/partner-settlement-reports/partnert-settlement-report-partner-settlement-record-read';
import { partnerSettlementReportPartnerSettlementRecordUpdateAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-report-partner-settlement-record-update';
import { partnerSettlementReportPartnerSettlementRecordDeleteAction } from './lib/actions/resources/partner-settlement-reports/partner-settlement-report-partner-settlement-record-delete';
import { partnersListingAction } from './lib/actions/resources/partners/partners-listing';
import { partnerCreateAction } from './lib/actions/resources/partners/partner-create';
import { partnerReadAction } from './lib/actions/resources/partners/partner-read';
import { partnerUpdateAction } from './lib/actions/resources/partners/partner-update';
import { partnerDeleteAction } from './lib/actions/resources/partners/partner-delete';
import { getPaymentTerminalsAction } from './lib/actions/resources/payment-terminals/get-payment-terminals';
import { createPaymentTerminalAction } from './lib/actions/resources/payment-terminals/create-payment-terminal';
import { getPaymentTerminalAction } from './lib/actions/resources/payment-terminals/get-payment-terminal';
import { updatePaymentTerminalAction } from './lib/actions/resources/payment-terminals/update-payment-terminal';
import { deletePaymentTerminalAction } from './lib/actions/resources/payment-terminals/delete-payment-terminal';
import { createPcIdAction } from './lib/actions/resources/provisioning-certificates/create-pc-id';
import { listPcIdsAction } from './lib/actions/resources/provisioning-certificates/list-pc-ids';
import { updatePcIdAction } from './lib/actions/resources/provisioning-certificates/update-pc-id';
import { getPcIdAction } from './lib/actions/resources/provisioning-certificates/get-pc-id';
import { deletePcIdAction } from './lib/actions/resources/provisioning-certificates/delete-pc-id';
import { receiptsListingAction } from './lib/actions/resources/receipts/receipts-listing';
import { receiptReadAction } from './lib/actions/resources/receipts/receipt-read';
import { reservationsListingAction } from './lib/actions/resources/reservations/reservations-listing';
import { reservationReadAction } from './lib/actions/resources/reservations/reservation-read';
import { listRoamingConnectionsAction } from './lib/actions/resources/roaming-connections/list-roaming-connections';
import { getRoamingConnectionAction } from './lib/actions/resources/roaming-connections/get-roaming-connection';
import { roamingOperatorsListingAction } from './lib/actions/resources/roaming-operators/roaming-operators-listing';
import { roamingOperatorReadAction } from './lib/actions/resources/roaming-operators/roaming-operator-read';
import { roamingOperatorUpdateAction } from './lib/actions/resources/roaming-operators/roaming-operator-update';
import { listRoamingCustomTariffFiltersAction } from './lib/actions/resources/roaming-operators/list-roaming-custom-tariff-filters';
import { createRoamingCustomTariffFilterAction } from './lib/actions/resources/roaming-operators/create-roaming-custom-tariff-filter';
import { reorderRoamingCustomTariffFiltersAction } from './lib/actions/resources/roaming-operators/reorder-roaming-custom-tariff-filters';
import { getRoamingCustomTariffFilterAction } from './lib/actions/resources/roaming-operators/get-roaming-custom-tariff-filter';
import { updateRoamingCustomTariffFilterAction } from './lib/actions/resources/roaming-operators/update-roaming-custom-tariff-filter';
import { deleteRoamingCustomTariffFilterAction } from './lib/actions/resources/roaming-operators/delete-roaming-custom-tariff-filter';
import { roamingProvidersListingAction } from './lib/actions/resources/roaming-providers/roaming-providers-listing';
import { roamingProviderCreateAction } from './lib/actions/resources/roaming-providers/roaming-provider-create';
import { roamingProviderReadAction } from './lib/actions/resources/roaming-providers/roaming-provider-read';
import { roamingProviderUpdateAction } from './lib/actions/resources/roaming-providers/roaming-provider-update';
import { roamingProviderDeleteAction } from './lib/actions/resources/roaming-providers/roaming-provider-delete';
import { roamingTariffsListingAction } from './lib/actions/resources/roaming-tariffs/roaming-tariffs-listing';
import { roamingTariffReadAction } from './lib/actions/resources/roaming-tariffs/roaming-tariff-read';
import { roamingTariffUpdateAction } from './lib/actions/resources/roaming-tariffs/roaming-tariff-update';
import { securityEventsListingAction } from './lib/actions/resources/security-events/security-events-listing';
import { securityEventReadAction } from './lib/actions/resources/security-events/security-event-read';
import { sessionsListingAction } from './lib/actions/resources/sessions/sessions-listing';
import { sessionReadAction } from './lib/actions/resources/sessions/session-read';
import { sessionsConsumptionStatsReadAction } from './lib/actions/resources/sessions/sessions-consumption-stats-read';
import { settingsListingAction } from './lib/actions/resources/settings/settings-listing';
import { subOperatorsListingAction } from './lib/actions/resources/sub-operators/sub-operators-listing';
import { subOperatorReadAction } from './lib/actions/resources/sub-operators/sub-operator-read';
import { subscriptionPlansListingAction } from './lib/actions/resources/subscription-plans/subscription-plans-listing';
import { subscriptionPlanCreateAction } from './lib/actions/resources/subscription-plans/subscription-plan-create';
import { subscriptionPlanReadAction } from './lib/actions/resources/subscription-plans/subscription-plan-read';
import { subscriptionPlanUpdateAction } from './lib/actions/resources/subscription-plans/subscription-plan-update';
import { subscriptionPlanDeleteAction } from './lib/actions/resources/subscription-plans/subscription-plan-delete';
import { subscriptionsListingAction } from './lib/actions/resources/subscriptions/subscriptions-listing';
import { subscriptionReadAction } from './lib/actions/resources/subscriptions/subscription-read';
import { tariffGroupsListingAction } from './lib/actions/resources/tariff-groups/tariff-groups-listing';
import { tariffGroupCreateAction } from './lib/actions/resources/tariff-groups/tariff-group-create';
import { tariffGroupReadAction } from './lib/actions/resources/tariff-groups/tariff-group-read';
import { tariffGroupUpdateAction } from './lib/actions/resources/tariff-groups/tariff-group-update';
import { tariffGroupDeleteAction } from './lib/actions/resources/tariff-groups/tariff-group-delete';
import { tariffSnapshotReadAction } from './lib/actions/resources/tariff-snapshots/tariff-snapshot-read';
import { tariffsListingAction } from './lib/actions/resources/tariffs/tariffs-listing';
import { tariffCreateAction } from './lib/actions/resources/tariffs/tariff-create';
import { tariffReadAction } from './lib/actions/resources/tariffs/tariff-read';
import { tariffUpdateAction } from './lib/actions/resources/tariffs/tariff-update';
import { tariffDeleteAction } from './lib/actions/resources/tariffs/tariff-delete';
import { taxIdentificationNumbersListingAction } from './lib/actions/resources/tax-identification-numbers/tax-identification-numbers-listing';
import { taxIdentificationNumberCreateAction } from './lib/actions/resources/tax-identification-numbers/tax-identification-number-create';
import { taxIdentificationNumberReadAction } from './lib/actions/resources/tax-identification-numbers/tax-identification-number-read';
import { taxIdentificationNumberUpdateAction } from './lib/actions/resources/tax-identification-numbers/tax-identification-number-update';
import { taxIdentificationNumberDeleteAction } from './lib/actions/resources/tax-identification-numbers/tax-identification-number-delete';
import { taxesListingAction } from './lib/actions/resources/taxes/taxes-listing';
import { taxCreateAction } from './lib/actions/resources/taxes/tax-create';
import { taxReadAction } from './lib/actions/resources/taxes/tax-read';
import { taxUpdateAction } from './lib/actions/resources/taxes/tax-update';
import { taxDeleteAction } from './lib/actions/resources/taxes/tax-delete';
import { templatesListingAction } from './lib/actions/resources/templates/templates-listing';
import { termsAndPoliciesListingAction } from './lib/actions/resources/terms-and-policies/terms-and-policies-listing';
import { termsAndPoliciesReadAction } from './lib/actions/resources/terms-and-policies/terms-and-policies-read';
import { topUpPackagesListingAction } from './lib/actions/resources/top-up-packages/top-up-packages-listing';
import { topUpPackagCreateAction } from './lib/actions/resources/top-up-packages/top-up-packag-create';
import { topUpPackageReadAction } from './lib/actions/resources/top-up-packages/top-up-package-read';
import { topUpPackageUpdateAction } from './lib/actions/resources/top-up-packages/top-up-package-update';
import { topUpPackageDeleteAction } from './lib/actions/resources/top-up-packages/top-up-package-delete';
import { transactionsListingAction } from './lib/actions/resources/transactions/transactions-listing';
import { transactionsCreateAction } from './lib/actions/resources/transactions/transactions-create';
import { transactionReadAction } from './lib/actions/resources/transactions/transaction-read';
import { transactionUpdateAction } from './lib/actions/resources/transactions/transaction-update';
import { userGroupsListingAction } from './lib/actions/resources/user-groups/user-groups-listing';
import { userGroupCreateAction } from './lib/actions/resources/user-groups/user-group-create';
import { userGroupReadAction } from './lib/actions/resources/user-groups/user-group-read';
import { userGroupUpdateAction } from './lib/actions/resources/user-groups/user-group-update';
import { userGroupDeleteAction } from './lib/actions/resources/user-groups/user-group-delete';
import { usersListingAction } from './lib/actions/resources/users/users-listing';
import { userCreateAction } from './lib/actions/resources/users/user-create';
import { userReadAction } from './lib/actions/resources/users/user-read';
import { userUpdateAction } from './lib/actions/resources/users/user-update';
import { userDeleteAction } from './lib/actions/resources/users/user-delete';
import { invoiceDetailsReadAction } from './lib/actions/resources/users/invoice-details-read';
import { invoiceDetailsCreateOrUpdateAction } from './lib/actions/resources/users/invoice-details-create-or-update';
import { paymentMethodsListingAction } from './lib/actions/resources/users/payment-methods-listing';
import { paymentMethodCreateAction } from './lib/actions/resources/users/payment-method-create';
import { paymentMethodReadAction } from './lib/actions/resources/users/payment-method-read';
import { paymentMethodUpdateAction } from './lib/actions/resources/users/payment-method-update';
import { paymentMethodDeleteAction } from './lib/actions/resources/users/payment-method-delete';
import { listUtilitiesAction } from './lib/actions/resources/utilities/list-utilities';
import { createUtilityAction } from './lib/actions/resources/utilities/create-utility';
import { getUtilityAction } from './lib/actions/resources/utilities/get-utility';
import { updateUtilityAction } from './lib/actions/resources/utilities/update-utility';
import { deleteUtilityAction } from './lib/actions/resources/utilities/delete-utility';
import { vendorErrorCodesListingAction } from './lib/actions/resources/vendor-error-codes/vendor-error-codes-listing';
import { vendorErrorCodeCreateAction } from './lib/actions/resources/vendor-error-codes/vendor-error-code-create';
import { vendorErrorCodeReadAction } from './lib/actions/resources/vendor-error-codes/vendor-error-code-read';
import { vendorErrorCodeUpdateAction } from './lib/actions/resources/vendor-error-codes/vendor-error-code-update';
import { vendorErrorCodeDeleteAction } from './lib/actions/resources/vendor-error-codes/vendor-error-code-delete';
import { vouchersListingAction } from './lib/actions/resources/vouchers/vouchers-listing';
import { voucherCreateAction } from './lib/actions/resources/vouchers/voucher-create';
import { voucherReadAction } from './lib/actions/resources/vouchers/voucher-read';
import { voucherUpdateAction } from './lib/actions/resources/vouchers/voucher-update';
import { voucherDeleteAction } from './lib/actions/resources/vouchers/voucher-delete';

// Import triggers
import { webhookTrigger } from './lib/triggers/webhook';

/**
 * Ampeco API Integration
 * Generated from API version: 3.96.4
 * AMPECO.CHARGE Public API
 */
export const ampeco = createPiece({
  displayName: 'AMPECO',
  description: 'AMPECO piece provides integrations of APIs and webhook notifications of the AMPECO platform for managing EV charging infrastructure and operations.',
  minimumSupportedRelease: '0.60.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/ampeco.png',
  authors: ["Ampeco"],
  auth: ampecoAuth,
  actions: [
    createCustomApiCallAction({
        baseUrl: (auth) => {
            return `${auth?.props.baseApiUrl}`;
        },
        auth: ampecoAuth,
        authMapping: async (auth) => ({
            Authorization: `Bearer ${auth.props.token}`,
        }),
    }),
        // Charge actions
    chargePointChangeAvailabilityAction,
    chargePointChangeOwnerAction,
    chargePointClearChargingProfileAction,
    chargePointGetDiagnosticsAction,
    chargePointGetSecurityLogAction,
    chargePointMoveEvsesToSatelliteAction,
    chargePointReserveAction,
    chargePointResetSecurityProfileAction,
    chargePointResetAction,
    chargePointSendDataTransferAction,
    chargePointSetChargingProfileAction,
    chargePointStartChargingSessionWithoutEvseAction,
    chargePointStartChargingSessionAction,
    chargePointStopChargingSessionAction,
    chargePointSyncConfigurationAction,
    chargePointTriggerMessageChargePointAction,
    chargePointEvseUnlockAction,
    chargePointChangeSharingCodeAction,
    chargePointDeleteCertificateAction,
    chargePointInstallCertificateAction,
    chargePointSetConfigurationAction,
    chargePointGetInstalledCertificateIdsAction,
    chargePointUpdateFirmwareAction,
    chargePointDowntimePeriodsListingAction,
    chargePointDowntimePeriodCreateAction,
    chargePointDowntimePeriodReadAction,
    chargePointDowntimePeriodUpdateAction,
    chargePointDowntimePeriodDeleteAction,
    chargePointModelsListingAction,
    chargePointModelCreateAction,
    chargePointModelReadAction,
    chargePointModelUpdateAction,
    chargePointModelDeleteAction,
    chargePointVendorsListingAction,
    chargePointVendorCreateAction,
    chargePointVendorReadAction,
    chargePointVendorUpdateAction,
    chargePointVendorDeleteAction,
    chargePointStatusReadAction,
    chargePointCreateAction,
    chargePointsListingAction,
    chargePointUpdateAction,
    chargePointReadAction,
    chargePointDeleteAction,
    chargePointAvailablePersonalSmartChargingModesListingAction,
    chargePointConfigurationsListingAction,
    chargePointConfigurationReadAction,
    chargePointConfigurationUpdateAction,
    chargePointEvseCreateAction,
    chargePointEvsesListingAction,
    chargePointEvseUpdateAction,
    chargePointEvseReadAction,
    chargePointEvseDeleteAction,
    chargePointEvseConnectorsListingAction,
    chargePointEvseConnectorCreateAction,
    chargePointEvseConnectorReadAction,
    chargePointEvseConnectorUpdateAction,
    chargePointEvseConnectorDeleteAction,
    listChargePointHardwareStatusLogsAction,
    getChargePointLatestHardwareStatusLogAction,
    getChargePointLatestNetworkStatusLogAction,
    listChargePointNetworkStatusLogsAction,
    chargePointPersonalSmartChargingPreferencesReadAction,
    personalSmartChargingPreferencesUpdateAction,
    chargePointSharedPartnersListingAction,
    chargePointSharedPartnersSyncAction,
    chargePointShareCreateAction,
    chargePointSharesListingAction,
    chargePointShareReadAction,
    charegPointShareDeleteAction,
    chargePointSmartChargingUpdateAction,

    // Circuit actions
    circuitAttachChargePointAction,
    circuitDetachChargePointAction,
    circuitSetChargePointPriorityAction,
    circuitSetChargePointEvsePriorityAction,
    circuitSetCircuitSocPriorityAction,
    circuitSetSessionPriorityAction,

    // Configuration actions
    configurationTemplateApplyToChargePointsAction,
    configurationTemplateBulkCreateVariablesAction,
    listConfigurationTemplatesAction,
    createConfigurationTemplateAction,
    updateConfigurationTemplateAction,
    getConfigurationTemplateAction,
    deleteConfigurationTemplateAction,
    configurationTemplateVariableListingAction,
    configurationTemplateVariableCreateAction,
    configurationTemplateVariableUpdateAction,
    configurationTemplateVariableDeleteAction,

    // Electricity actions
    electricityMeterReportConsumptionAction,
    electricityMetersLisingAction,
    electricityMeterCreateAction,
    electricityMeterReadAction,
    electricityMeterUpdateAction,
    electricityMeterDeleteAction,
    electricityRatesListingAction,
    electricityRateCreateAction,
    electricityRateReadAction,
    electricityRateUpdateAction,
    electricityRateDeleteAction,
    electricityRateEnergyMixReadAction,
    electricityRateEnergyMixUpdateAction,
    electricityRatePricePeriodsListingAction,
    electricityRatePricePeriodsDateListingAction,
    electricityRatePricePeriodsDateReadAction,
    electricityRatePricePeriodsDateCreateOrUpdateAction,
    electricityRatePricePeriodsDateDeleteAction,
    electricityRatePricePeriodsWeekDayListingAction,
    electricityRatePricePeriodsWeekDayReadAction,
    electricityRatePricePeriodsWeekDayCreateaOrUpdateAction,
    electricityRatePricePeriodsWeekDayDeleteAction,

    // Evse actions
    evseStartChargingWithEvseIdAction,
    evseTriggerMessageAction,
    evseDowntimePeriodsListingAction,
    evseDowntimePeriodCreateAction,
    evseDowntimePeriodReadAction,
    evseDowntimePeriodUpdateAction,
    evseDowntimePeriodDeleteAction,

    // Flexibility actions
    changeFlexibilityAssetStatusAction,
    flexibilityAssetCreateActivationRequestAction,
    listFlexibilityActivationRequestsAction,
    getFlexibilityActivationRequestAction,
    createFlexibilityAssetAction,
    listFlexibilityAssetsAction,
    updateFlexibilityAssetAction,
    getFlexibilityAssetAction,
    deleteFlexibilityAssetAction,
    getHistoricalTimeSeriesAction,
    getTimeSeriesForecastAction,

    // Id actions
    certificateReissueAnEmaidAction,
    idTagsListingAction,
    idTagCreateAction,
    idTagReadAction,
    idTagUpdateAction,
    idTagDeleteAction,

    // Locations actions
    locationCheckBookingAvailabilityAction,
    locationCreateAction,
    locationsListingAction,
    locationUpdateAction,
    locationReadAction,
    locationDeleteAction,
    locationChargingZonesListingAction,
    locationChargingZoneCreateAction,
    locationChargingZoneReadAction,
    locationChargingZoneUpdateAction,
    locationChargingZoneDeleteAction,

    // Notifications actions
    notificationsResendFailedAction,

    // Parking actions
    parkingSpaceUpdateOccupancyStatusAction,
    createParkingSpaceAction,
    listParkingSpaceAction,
    updateParkingSpaceAction,
    getParkingSpaceAction,
    deleteParkingSpaceAction,

    // Provisioning actions
    certificateIssueAnEmaidAction,
    createPcIdAction,
    listPcIdsAction,
    updatePcIdAction,
    getPcIdAction,
    deletePcIdAction,

    // Reservation actions
    reservationCancelAction,

    // Roaming actions
    updateCustomTariffFilterTariffAction,
    listRoamingConnectionsAction,
    getRoamingConnectionAction,
    roamingOperatorsListingAction,
    roamingOperatorReadAction,
    roamingOperatorUpdateAction,
    listRoamingCustomTariffFiltersAction,
    createRoamingCustomTariffFilterAction,
    reorderRoamingCustomTariffFiltersAction,
    getRoamingCustomTariffFilterAction,
    updateRoamingCustomTariffFilterAction,
    deleteRoamingCustomTariffFilterAction,
    roamingProvidersListingAction,
    roamingProviderCreateAction,
    roamingProviderReadAction,
    roamingProviderUpdateAction,
    roamingProviderDeleteAction,
    roamingTariffsListingAction,
    roamingTariffReadAction,
    roamingTariffUpdateAction,

    // Session actions
    sessionAssignToUserAction,
    sessionRetryPaymentAction,

    // Subscription actions
    subscriptionPlanReplaceAction,
    subscriptionPlansListingAction,
    subscriptionPlanCreateAction,
    subscriptionPlanReadAction,
    subscriptionPlanUpdateAction,
    subscriptionPlanDeleteAction,

    // Tariffs actions
    tariffSetDisplayInformationAction,
    tariffsListingAction,
    tariffCreateAction,
    tariffReadAction,
    tariffUpdateAction,
    tariffDeleteAction,

    // Transactions actions
    transactionIssueInvoiceAction,
    transactionResendInvoiceAction,
    transactionUpdatePaymentReferenceAction,
    transactionsListingAction,
    transactionsCreateAction,
    transactionReadAction,
    transactionUpdateAction,

    // Users actions
    userActivateSubscriptionAction,
    userAddBalanceAction,
    userApplyCustomFeeAction,
    userCancelSubscriptionAction,
    userChangeStatusAction,
    userClearSubscriptionAmountDueAction,
    userExportAllPrivateDataAction,
    userRedeemVoucherAction,
    usersListingAction,
    userCreateAction,
    userReadAction,
    userUpdateAction,
    userDeleteAction,
    invoiceDetailsReadAction,
    invoiceDetailsCreateOrUpdateAction,
    paymentMethodsListingAction,
    paymentMethodCreateAction,
    paymentMethodReadAction,
    paymentMethodUpdateAction,
    paymentMethodDeleteAction,

    // V2.0 actions
    notificationsSubscribeAction,
    notificationsListingAction,
    notificationReadAction,
    notificationsCreateAction,
    notificationsUnsubscribeAction,

    // Authorizations actions
    authorizationsListingAction,
    authorizationReadAction,

    // Booking actions
    bookingRequestsListingAction,
    bookingRequestCreateAction,
    bookingRequestReadAction,

    // Bookings actions
    bookingsListingAction,
    bookingReadAction,

    // Cdrs actions
    cdrsListingAction,
    cdrReadAction,

    // Circuits actions
    circuitsListingAction,
    circuitCreateAction,
    circuitReadAction,
    circuitUpdateAction,
    circuitDeleteAction,
    circuitChargePointPrioritiesListingAction,
    circuitConsumptionAction,
    circuitSocPrioritiesListingAction,
    circuitUnmanagedLoadReadAction,
    circuitUserPrioritiesListingAction,
    circuitUserPriorityCreateAction,
    circuitUserPriorityReadAction,
    circuitUserPriorityUpdateAction,
    circuitUserPriorityDeleteAction,

    // Contact actions
    contactDetailsReadAction,
    contactDetailsUpdateAction,
    contactDetailsDeleteAction,

    // Currencies actions
    currenciesListingAction,
    currencyCreateAction,
    currencyReadAction,
    currencyUpdateAction,

    // Currency actions
    createCurrencyRateAction,
    listCurrencyRatesAction,
    updateCurrencyRateAction,
    getCurrencyRateAction,
    deleteCurrencyRateAction,

    // Custom actions
    customFeesListingAction,
    customFeeReadAction,

    // Downtime actions
    getDowntimePeriodNoticesAction,
    postDowntimePeriodNoticeAction,
    getDowntimePeriodNoticeAction,
    patchDowntimePeriodNoticeAction,
    deleteDowntimePeriodNoticeAction,

    // Evses actions
    listEvseHardwareStatusLogsAction,
    getEvseLatestHardwareStatusLogAction,
    evseCreateAction,
    evsesListingAction,
    evseUpdateAction,
    evseReadAction,
    evseDeleteAction,

    // Faqs actions
    faqsListingAction,
    faqCreateAction,
    faqReadAction,
    faqUpdateAction,
    faqDeleteAction,

    // Firmware actions
    firmwareVersionsListingAction,
    firmwareVersionReadAction,
    firmwareVersionAttachedModelsAction,

    // Installer actions
    getInstallerJobsListAction,
    createInstallerJobAction,
    getInstallerJobAction,
    updateInstallerJobAction,
    deleteInstallerJobAction,

    // Invoices actions
    invoicesListingAction,
    invoiceReadAction,

    // Partner actions
    partnerContractsListingAction,
    partnerContractCreateAction,
    partnerContractReadAction,
    partnerContractUpdateAction,
    partnerContractDeleteAction,
    expensesListingAction,
    partnerInvitesListingAction,
    partnerInviteCreateAction,
    partnerInviteReadAction,
    partnerInviteUpdateAction,
    partnerInviteDeleteAction,
    revenuesListingAction,
    partnerSettlementReportsListingAction,
    partnerSettlementReportReadAction,
    partnerSettlementReportPartnerSettlementRecordsListingAction,
    partnerSettlementReportPartnerSettlementRecordCreateAction,
    partnertSettlementReportPartnerSettlementRecordReadAction,
    partnerSettlementReportPartnerSettlementRecordUpdateAction,
    partnerSettlementReportPartnerSettlementRecordDeleteAction,

    // Partners actions
    partnersListingAction,
    partnerCreateAction,
    partnerReadAction,
    partnerUpdateAction,
    partnerDeleteAction,

    // Payment actions
    getPaymentTerminalsAction,
    createPaymentTerminalAction,
    getPaymentTerminalAction,
    updatePaymentTerminalAction,
    deletePaymentTerminalAction,

    // Receipts actions
    receiptsListingAction,
    receiptReadAction,

    // Reservations actions
    reservationsListingAction,
    reservationReadAction,

    // Security actions
    securityEventsListingAction,
    securityEventReadAction,

    // Sessions actions
    sessionsListingAction,
    sessionReadAction,
    sessionsConsumptionStatsReadAction,

    // Settings actions
    settingsListingAction,

    // Sub actions
    subOperatorsListingAction,
    subOperatorReadAction,

    // Subscriptions actions
    subscriptionsListingAction,
    subscriptionReadAction,

    // Tariff actions
    tariffGroupsListingAction,
    tariffGroupCreateAction,
    tariffGroupReadAction,
    tariffGroupUpdateAction,
    tariffGroupDeleteAction,
    tariffSnapshotReadAction,

    // Tax actions
    taxIdentificationNumbersListingAction,
    taxIdentificationNumberCreateAction,
    taxIdentificationNumberReadAction,
    taxIdentificationNumberUpdateAction,
    taxIdentificationNumberDeleteAction,

    // Taxes actions
    taxesListingAction,
    taxCreateAction,
    taxReadAction,
    taxUpdateAction,
    taxDeleteAction,

    // Templates actions
    templatesListingAction,

    // Terms actions
    termsAndPoliciesListingAction,
    termsAndPoliciesReadAction,

    // Top actions
    topUpPackagesListingAction,
    topUpPackagCreateAction,
    topUpPackageReadAction,
    topUpPackageUpdateAction,
    topUpPackageDeleteAction,

    // User actions
    userGroupsListingAction,
    userGroupCreateAction,
    userGroupReadAction,
    userGroupUpdateAction,
    userGroupDeleteAction,

    // Utilities actions
    listUtilitiesAction,
    createUtilityAction,
    getUtilityAction,
    updateUtilityAction,
    deleteUtilityAction,

    // Vendor actions
    vendorErrorCodesListingAction,
    vendorErrorCodeCreateAction,
    vendorErrorCodeReadAction,
    vendorErrorCodeUpdateAction,
    vendorErrorCodeDeleteAction,

    // Vouchers actions
    vouchersListingAction,
    voucherCreateAction,
    voucherReadAction,
    voucherUpdateAction,
    voucherDeleteAction

  ],
  triggers: [
    webhookTrigger
  ],
});
