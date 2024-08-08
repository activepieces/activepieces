import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const certificationFolderSurveyInitialExperienceAnswered = createTrigger({
  auth: wedofAuth,
  name: 'certificationFolderSurveyInitialExperienceAnswered',
  displayName: 'Enquéte "Situation professionnelle en début de cursus" répondue',
  description: "Se déclenche lorsqu'un une enquéte de début de cursus est répondue",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {},

  async onEnable(context) {
    const url = context.webhookUrl as string;
    const name =
      'Activepieces - certificationFolderSurveyInitialExperienceAnswered - ' +
      url.substring(url.lastIndexOf('/') + 1);

    const message = {
      url: context.webhookUrl,
      events: ['certificationFolderSurvey.initialExperienceAnswered'],
      name: name,
      secret: null,
      enabled: true,
      ignoreSsl: false,
    };

    const id = await context.store.get('_webhookId');

    if (id === null) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/webhooks',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
          'User-Agent': 'activepieces'
        },
      });

      await context.store.put('_webhookId', response.body.id);
    } else {
      console.log('/////////// webhook already exist ////');
    }
  },

  async onDisable(context) {
    const id = await context.store.get('_webhookId');

    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: wedofCommon.baseUrl + '/webhooks/' + id,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': context.auth as string,
        'User-Agent': 'activepieces'
      },
    });
    await context.store.delete('_webhookId');
  },
  async run(context) {
    return [context.payload.body];
  },
});
