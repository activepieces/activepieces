import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { NotificationsSubscribeResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/notifications/v2.0
export const notificationsSubscribeAction = createAction({
  auth: ampecoAuth,
  name: 'notificationsSubscribe',
  displayName: 'Notifications - V2.0 - Notifications Subscribe',
  description: 'Subscribe for a webhook or kafka events. Each notification sent to the webhook/kafka will be retried a number of times and will be rate limited. The rate limits, retries and retry intervals will be configured by Ampeco.',
  props: {
        
  via: Property.StaticDropdown({
    displayName: 'Via',
    required: true,
    options: {
      options: [
      { label: 'webhook', value: 'webhook' },
      { label: 'kafka', value: 'kafka' }
      ],
    },
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

  webhook__callbackUrl: Property.ShortText({
    displayName: 'Webhook - Callback Url',
    required: true,
  }),

  kafka__topic: Property.ShortText({
    displayName: 'Kafka - Topic',
    required: true,
  }),

  kafka__brokers: Property.Array({
    displayName: 'Kafka - Brokers',
    required: true,
  }),

  kafka__compressionCodec: Property.StaticDropdown({
    displayName: 'Kafka - Compression Codec',
    required: false,
    options: {
      options: [
      { label: 'none', value: 'none' },
      { label: 'gzip', value: 'gzip' },
      { label: 'snappy', value: 'snappy' },
      { label: 'lz4', value: 'lz4' }
      ],
    },
  }),

  kafka__securityProtocol: Property.StaticDropdown({
    displayName: 'Kafka - Security Protocol',
    required: false,
    options: {
      options: [
      { label: 'PLAINTEXT', value: 'PLAINTEXT' },
      { label: 'SASL_SSL', value: 'SASL_SSL' }
      ],
    },
  }),

  kafka__saslMechanism: Property.StaticDropdown({
    displayName: 'Kafka - Sasl Mechanism',
    required: false,
    options: {
      options: [
      { label: 'PLAIN', value: 'PLAIN' },
      { label: 'SCRAM-SHA-256', value: 'SCRAM-SHA-256' },
      { label: 'SCRAM-SHA-512', value: 'SCRAM-SHA-512' }
      ],
    },
  }),

  kafka__saslUsername: Property.ShortText({
    displayName: 'Kafka - Sasl Username',
    required: false,
  }),

  kafka__saslPassword: Property.ShortText({
    displayName: 'Kafka - Sasl Password',
    required: false,
  }),
  },
  async run(context): Promise<NotificationsSubscribeResponse> {
    try {
      const url = processPathParameters('/public-api/notifications/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['via', 'notifications', 'webhook', 'kafka']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as NotificationsSubscribeResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
