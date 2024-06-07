import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { krispcallAuth } from '../..';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
export const newVoicemail = createTrigger({
  name: 'newVoicemail',
  displayName: 'New Voicemail',
  description: 'It triggers when new voicemail arrive in user workspace.',
  auth: krispcallAuth,
  props: {},
  sampleData: {
    id: '',
    from: '+9779821110987',
    duration: '5 seconds',
    call_time: '2000-10-31T01:30:00.000-05:00',
    voicemail_audio: 'voicemail.mp4',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/subscribe',
      body: {
        hookUrl: context.webhookUrl,
        action: 'new_voicemail',
      },
      headers: {
        'X-API-KEY': context.auth.apiKey,
      },
    };
    const response = await httpClient.sendRequest(request);
    const id: string = response.body.id;
    const key = `new_voicemail`;
    await context.store.put(key, id);
  },
  async onDisable(context) {
    // implement webhook deletion logic
    const webhook_id = await context.store.get<string>(`new_voicemail`);
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: 'https://automationapi.krispcall.com/api/v1/platform/activepiece/unsubscribe',
      body: {
        hookUrl: webhook_id,
      },
      headers: {
        'X-API-KEY': context.auth.apiKey,
      },
    };
    await httpClient.sendRequest(request);
  },
  async run(context) {
    return [context.payload.body];
  },
});
