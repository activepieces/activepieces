import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { closeCrmAuth } from '../../index';
import { CLOSE_API_URL } from '../common/constants';
import crypto from 'crypto';

const TRIGGER_DATA_STORE_KEY = 'close_crm_opp_status_trigger_data';

const verifySignature = (signatureKey: string, timestamp: string, rawBody: string, signatureHash: string) => {
  const dataToHmac = timestamp + rawBody;
  const generatedHash = crypto.createHmac('sha256', Buffer.from(signatureKey, 'hex'))
                              .update(dataToHmac)
                              .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(signatureHash));
};

export const opportunityStatusChanged = createTrigger({
  auth: closeCrmAuth,
  name: 'opportunity_status_changed',
  displayName: 'Opportunity Status Changed',
  description: 'Triggers when an opportunity status is updated.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/webhook/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${context.auth.username}:`).toString('base64'),
        'Content-Type': 'application/json',
      },
      body: {
        url: context.webhookUrl,
        events: [{ object_type: 'opportunity', action: 'updated' }],
      },
    };
    const response = await httpClient.sendRequest<{ id: string, signature_key: string }>(request);
    if (response.status === 200 || response.status === 201) {
      await context.store.put(TRIGGER_DATA_STORE_KEY, {
        webhookId: response.body.id,
        signatureKey: response.body.signature_key
      });
    } else {
      console.error('Failed to create webhook for opportunity status change', response);
      throw new Error(`Failed to create webhook: ${response.status} ${JSON.stringify(response.body)}`);
    }
  },
  async onDisable(context) {
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (triggerData && triggerData.webhookId) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${CLOSE_API_URL}/webhook/${triggerData.webhookId}`,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${context.auth.username}:`).toString('base64'),
        },
      };
      await httpClient.sendRequest(request);
    }
    await context.store.delete(TRIGGER_DATA_STORE_KEY);
  },
  async run(context) {
    const triggerData = await context.store.get<{ webhookId: string, signatureKey: string }>(TRIGGER_DATA_STORE_KEY);
    if (!triggerData || !triggerData.signatureKey) {
      return [];
    }
    const signatureHash = context.payload.headers['close-sig-hash'] as string;
    const timestamp = context.payload.headers['close-sig-timestamp'] as string;
    const rawBody = context.payload.rawBody as string;

    if (!signatureHash || !timestamp || rawBody === undefined) {
      return [];
    }
    const isValid = verifySignature(triggerData.signatureKey, timestamp, rawBody, signatureHash);
    if (!isValid) {
      return [];
    }

    const webhookBody = context.payload.body as { event: any, subscription_id: string };
    if (webhookBody && webhookBody.event) {
      const event = webhookBody.event;
      if (event.object_type === 'opportunity' && event.action === 'updated') {
        // Check if status was actually changed
        const changedFields = event.changed_fields || [];
        const statusRelatedFieldsChanged = changedFields.some((field: string) =>
          ['status_id', 'status_label', 'status_type'].includes(field)
        );
        if (statusRelatedFieldsChanged) {
          return [event];
        }
      }
    }
    return [];
  },
  async test(context) {
    return [this.sampleData];
  },
  sampleData: {
    // This is the 'event' object from the webhook documentation for an opportunity status change
    date_created: "2019-01-15T12:48:23.395000",
    meta: {
      request_method: "PUT",
      request_path: "/api/v1/opportunity/oppo_7H4sjNso7FyBFaeR3RXi5PMJbilfo0c6UPCxsJtEhCO/"
    },
    id: "ev_2sYKRjcrA79yKxi3S4Crd7",
    action: "updated",
    date_updated: "2019-01-15T12:48:23.395000",
    changed_fields: [
      "confidence",
      "date_updated",
      "status_id",
      "status_label",
      "status_type"
    ],
    previous_data: {
      status_type: "active",
      confidence: 70,
      date_updated: "2019-01-15T12:47:39.873000+00:00",
      status_id: "stat_3FD9DnGUCJzccBKTh8LiiKoyVPpMJsOkJdcGoA5AYKH",
      status_label: "Active"
    },
    organization_id: "orga_XbVPx5fFbKlYTz9PW5Ih1XDhViV10YihIaEgMEb6fVW",
    data: {
      contact_name: "Mr. Jones",
      user_name: "Joe Kemp",
      value_period: "one_time",
      updated_by_name: "Joe Kemp",
      date_created: "2019-01-15T12:41:24.496000+00:00",
      user_id: "user_N6KhMpzHRCYQHdn4gRNIFNN5JExnsrprKA6ekxM63XA",
      updated_by: "user_N6KhMpzHRCYQHdn4gRNIFNN5JExnsrprKA6ekxM63XA",
      value_currency: "USD",
      organization_id: "orga_XbVPx5fFbKlYTz9PW5Ih1XDhViV10YihIaEgMEb6fVW",
      status_label: "Won",
      contact_id: "cont_BwlwYQkIP6AooiXP1CMvc6Zbb5gGh2gPu4dqIDlDrII",
      status_type: "won",
      created_by_name: "Joe Kemp",
      id: "oppo_8H4sjNso7FyBFaeR3RXi5PMJbilfo0c6UPCxsJtEhCO",
      lead_name: "KLine",
      date_lost: null,
      note: "",
      date_updated: "2019-01-15T12:48:23.392000+00:00",
      status_id: "stat_wMS9M6HC2O3CSEOzF5g2vEGt6RM5R3RfhIQixdnmjf2",
      value: 100000,
      created_by: "user_N6KhMpzHRCYQHdn4gRNIFNN5JExnsrprKA6ekxM63XA",
      value_formatted: "$1,000",
      date_won: "2019-01-15",
      lead_id: "lead_zwqYhEFwzPyfCErS8uQ77is2wFLvr9BgVi6cTfbFM68",
      confidence: 100
    },
    request_id: "req_4S2L8JTBAA1OUS74SVmfbN",
    object_id: "oppo_7H4sjNso7FyBFaeR3RXi5PMJbilfo0c6UPCxsJtEhCO",
    user_id: "user_N6KhMpzHRCYQHdn4gRNIFNN5JExnsrprKA6ekxM63XA",
    object_type: "opportunity",
    lead_id: "lead_zwqYhEFwzPyfCErS8uQ77is2wFLvr9BgVi6cTfbFM68"
  }
});
