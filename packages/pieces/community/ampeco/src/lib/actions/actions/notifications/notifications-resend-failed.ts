import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/notifications/v1.0/{notification}/resend

export const notificationsResendFailedAction = createAction({
  auth: ampecoAuth,
  name: 'notificationsResendFailed',
  displayName: 'Actions - Notifications - Resend Failed',
  description: 'Resend failed webhook notifications. - Resend for a specific notification ID can be requested once every 15 minutes. - Notifications that are disabled cannot be resent.',
  props: {
        
  notification: Property.Number({
    displayName: 'Notification',
    required: true,
  }),

  notifications: Property.StaticMultiSelectDropdown({
    displayName: 'Notifications',
    required: true,
    options: {
      options: [
      { label: 'AuthorizationNotification', value: 'AuthorizationNotification' },
      { label: 'authorization.changed', value: 'authorization.changed' },
      { label: 'BootNotification', value: 'BootNotification' },
      { label: 'ChargePointChangedNotification', value: 'ChargePointChangedNotification' },
      { label: 'chargePoint.changed', value: 'chargePoint.changed' },
      { label: 'evse.changed', value: 'evse.changed' },
      { label: 'ChargePointSyncConfigurationNotification', value: 'ChargePointSyncConfigurationNotification' },
      { label: 'CircuitConsumptionNotification', value: 'CircuitConsumptionNotification' },
      { label: 'circuit.changed', value: 'circuit.changed' },
      { label: 'DiagnosticsStatusNotification', value: 'DiagnosticsStatusNotification' },
      { label: 'HardwareStatusNotification', value: 'HardwareStatusNotification' },
      { label: 'LocationChangedNotification', value: 'LocationChangedNotification' },
      { label: 'NetworkStatusNotification', value: 'NetworkStatusNotification' },
      { label: 'SecurityEventNotification', value: 'SecurityEventNotification' },
      { label: 'SessionMeterValuesNotification', value: 'SessionMeterValuesNotification' },
      { label: 'SessionStartStopNotification', value: 'SessionStartStopNotification' },
      { label: 'session.start.stop.notification', value: 'session.start.stop.notification' },
      { label: 'SessionUpdateNotification', value: 'SessionUpdateNotification' },
      { label: 'UserChangedNotification', value: 'UserChangedNotification' },
      { label: 'SubOperatorChangedNotification', value: 'SubOperatorChangedNotification' },
      { label: 'TariffChangedNotification', value: 'TariffChangedNotification' },
      { label: 'user.subscriptionChanged', value: 'user.subscriptionChanged' },
      { label: 'user.subscription.changed', value: 'user.subscription.changed' },
      { label: 'ReservationChangedNotification', value: 'ReservationChangedNotification' },
      { label: 'PaymentMethodChangedNotification', value: 'PaymentMethodChangedNotification' },
      { label: 'PartnerInviteChangedNotification', value: 'PartnerInviteChangedNotification' },
      { label: 'reservation.changed', value: 'reservation.changed' },
      { label: 'user.paymentMethod.changed', value: 'user.paymentMethod.changed' },
      { label: 'userBalance.changed', value: 'userBalance.changed' },
      { label: 'partnerInvite.changed', value: 'partnerInvite.changed' },
      { label: 'roamingPlatform.changed', value: 'roamingPlatform.changed' },
      { label: 'parkingSpace.occupancyStatus.changed', value: 'parkingSpace.occupancyStatus.changed' },
      { label: 'partner.changed', value: 'partner.changed' },
      { label: 'transaction.changed', value: 'transaction.changed' },
      { label: 'settlementReport.created', value: 'settlementReport.created' },
      { label: 'idTag.changed', value: 'idTag.changed' },
      { label: 'chargePoint.dataTransferReceived', value: 'chargePoint.dataTransferReceived' },
      { label: 'subscriptionPlan.changed', value: 'subscriptionPlan.changed' },
      { label: 'user.invoiceDetails.changed', value: 'user.invoiceDetails.changed' },
      { label: 'cdr.received', value: 'cdr.received' },
      { label: 'chargingProfile.applied', value: 'chargingProfile.applied' },
      { label: 'installerJob.changed', value: 'installerJob.changed' }
      ],
    },
  }),

  startTime: Property.ShortText({
    displayName: 'Start Time',
    description: 'Resend all failed notifications from this date onwards.',
    required: false,
  }),

  endTime: Property.ShortText({
    displayName: 'End Time',
    description: 'Resend all failed notifications up to this date.',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/notifications/v1.0/{notification}/resend', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['notifications', 'startTime', 'endTime']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
