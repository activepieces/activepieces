import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { ampecoAuth } from '../common/auth';
import { makeAmpecoApiCall } from '../common/utils';

const liveMarkdown = `**Live URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
generate sample data & triggers published flow.

`;

export const webhookTrigger = createTrigger({
  auth: ampecoAuth,
  name: 'new_notification',
  displayName: 'New notification',
  description: 'Triggers when a webhook notification event is received from Ampeco',
  type: TriggerStrategy.WEBHOOK,
  props: {
    liveMarkdown: Property.MarkDown({
      value: liveMarkdown,
      variant: MarkdownVariant.BORDERLESS,
    }),
    notifications: Property.StaticMultiSelectDropdown({
      displayName: 'Notification events',
      description: 'Select the notification events to listen for',
      required: true,
      options: {
        options: [
            { label: 'Authorization Notification', value: 'AuthorizationNotification' },
            { label: 'Authorization.changed', value: 'authorization.changed' },
            { label: 'Boot Notification', value: 'BootNotification' },
            { label: 'Charge Point Changed Notification', value: 'ChargePointChangedNotification' },
            { label: 'Charge Point.changed', value: 'chargePoint.changed' },
            { label: 'Evse.changed', value: 'evse.changed' },
            { label: 'Charge Point Sync Configuration Notification', value: 'ChargePointSyncConfigurationNotification' },
            { label: 'Circuit Consumption Notification', value: 'CircuitConsumptionNotification' },
            { label: 'Circuit.changed', value: 'circuit.changed' },
            { label: 'Diagnostics Status Notification', value: 'DiagnosticsStatusNotification' },
            { label: 'Hardware Status Notification', value: 'HardwareStatusNotification' },
            { label: 'Location Changed Notification', value: 'LocationChangedNotification' },
            { label: 'Network Status Notification', value: 'NetworkStatusNotification' },
            { label: 'Security Event Notification', value: 'SecurityEventNotification' },
            { label: 'Session Meter Values Notification', value: 'SessionMeterValuesNotification' },
            { label: 'Session Start Stop Notification', value: 'SessionStartStopNotification' },
            { label: 'Session.start.stop.notification', value: 'session.start.stop.notification' },
            { label: 'Session Update Notification', value: 'SessionUpdateNotification' },
            { label: 'User Changed Notification', value: 'UserChangedNotification' },
            { label: 'Sub Operator Changed Notification', value: 'SubOperatorChangedNotification' },
            { label: 'Tariff Changed Notification', value: 'TariffChangedNotification' },
            { label: 'User.subscription Changed', value: 'user.subscriptionChanged' },
            { label: 'User.subscription.changed', value: 'user.subscription.changed' },
            { label: 'Reservation Changed Notification', value: 'ReservationChangedNotification' },
            { label: 'Payment Method Changed Notification', value: 'PaymentMethodChangedNotification' },
            { label: 'Partner Invite Changed Notification', value: 'PartnerInviteChangedNotification' },
            { label: 'Reservation.changed', value: 'reservation.changed' },
            { label: 'User.payment Method.changed', value: 'user.paymentMethod.changed' },
            { label: 'User Balance.changed', value: 'userBalance.changed' },
            { label: 'Partner Invite.changed', value: 'partnerInvite.changed' },
            { label: 'Roaming Platform.changed', value: 'roamingPlatform.changed' },
            { label: 'Parking Space.occupancy Status.changed', value: 'parkingSpace.occupancyStatus.changed' },
            { label: 'Partner.changed', value: 'partner.changed' },
            { label: 'Transaction.changed', value: 'transaction.changed' },
            { label: 'Settlement Report.created', value: 'settlementReport.created' },
            { label: 'Id Tag.changed', value: 'idTag.changed' },
            { label: 'Charge Point.data Transfer Received', value: 'chargePoint.dataTransferReceived' },
            { label: 'Subscription Plan.changed', value: 'subscriptionPlan.changed' },
            { label: 'User.invoice Details.changed', value: 'user.invoiceDetails.changed' },
            { label: 'Cdr.received', value: 'cdr.received' },
            { label: 'Charging Profile.applied', value: 'chargingProfile.applied' },
            { label: 'Installer Job.changed', value: 'installerJob.changed' }
        ]
      }
    })
  },
  async onEnable(context) {
    const response = await makeAmpecoApiCall(
        context.auth,
        '/public-api/notifications/v2.0',
        HttpMethod.POST,
        {
          via: 'webhook',
          notifications: context.propsValue.notifications,
          webhook: {
            callbackUrl: context.webhookUrl,
          }
        }
    ) as CreateWebhookResponse;

    await context.store.put('_new_notification_trigger_id', response.data?.id || null);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_new_notification_trigger_id');
      
    if (webhookId) {
      await makeAmpecoApiCall(
        context.auth,
        `/public-api/notifications/v2.0/${webhookId}`,
        HttpMethod.DELETE
      );
      
      await context.store.delete('_new_notification_trigger_id');
    }
  },
  async run(context): Promise<any[]> {
    return [context.payload.body];
  },
  sampleData: {
    data: {
        notification: 'SessionStartStopNotification',
    }
  }
});

type CreateWebhookResponse = {
    data: {
        id: string;
        via: string,
        notifications: [],
        webhook: {
            callbackUrl: string,
        },
    };
};