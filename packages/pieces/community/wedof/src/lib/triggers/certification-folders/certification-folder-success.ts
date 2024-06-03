
import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient ,HttpMethod } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const certificationFolderSuccess = createTrigger({
    auth: wedofAuth,
    name: 'certificationfolderSuccess',
    displayName: 'Dossier de certification réussi',
    description: "Se déclenche Lorsqu'un dossier de formation passe à l'état réussi",
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const name =
        'Activepieces - CertificationFolderSuccess - ' +
        context.webhookUrl.substring(context.webhookUrl.lastIndexOf('/') + 1);
  
      const message = {
        url: context.webhookUrl,
        events: ['certificationFolder.success'],
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
          },
        });
  
        await context.store.put('_webhookId', response.body.id);
      } else {
        console.log('/////////// webhook already exist ////');
      }
    },
    async onDisable(context){
        const id = await context.store.get('_webhookId');

        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: wedofCommon.baseUrl + '/webhooks/' + id,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        });
        await context.store.delete('_webhookId');
    },
    async run(context){
        return [context.payload.body]
    }
})