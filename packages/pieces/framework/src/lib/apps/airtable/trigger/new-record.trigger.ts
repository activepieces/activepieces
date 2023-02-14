import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { airtableCommon, AirtableWebhookInformation } from '../common';

const triggerNameInStore = 'airtable_new_record_trigger';
export const airtableNewRecord = createTrigger({
  name: 'new_record',
  displayName: 'New Record',
  description: 'Triggers when a new record is added to the selected table.',
  props: {
    authentication: airtableCommon.authentication,
    base: airtableCommon.base,
    table: airtableCommon.table
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.airtable.com/v0/bases/${context.propsValue["base"]}/webhooks`,
      body: {
        notificationUrl: context.webhookUrl,
        specification: {
          options: {
            filters: {
              dataTypes: [
                "tableData"
              ],
              recordChangeScope: context.propsValue["table"],
              changeTypes: ["add"]
            }
          }
        }
      },
      authentication:
      {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue["authentication"]!
      }
    };

    const { body } = await httpClient.sendRequest<AirtableWebhookInformation>(request);
    console.debug("RUN AIRTABLE");
    console.debug(JSON.stringify(body));
    await context.store?.put<AirtableWebhookInformation>(triggerNameInStore, body);

  },
  async onDisable(context) {
    const response = await context.store?.get<AirtableWebhookInformation>(triggerNameInStore);
    if (response) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `https://api.airtable.com/v0/bases/${context.propsValue["base"]}/webhooks/${response.id}`,
        authentication:
        {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue["authentication"]!
        }
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    console.debug("RUN ---- ");;
    const response = await context.store?.get<AirtableWebhookInformation>(triggerNameInStore);
    const webhookPayload = await airtableCommon.getWebhookPayload({ baseId: context.propsValue["base"]!, personalToken: context.propsValue["authentication"]!, webhookId: response!.id, cursor: undefined });
    const payloads: unknown[] = [...webhookPayload.payloads];
    console.debug('------------');
    console.debug(JSON.stringify(webhookPayload));
    console.debug('------------');
    console.debug(JSON.stringify(payloads));
    return payloads;

  },
});



