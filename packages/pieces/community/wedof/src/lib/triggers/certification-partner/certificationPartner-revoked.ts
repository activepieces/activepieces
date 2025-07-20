import { wedofAuth } from '../../..';
import { httpClient ,HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const certificationPartnerRevoked = createTrigger({
    auth: wedofAuth,
    name: 'certificationPartnerRevoked',
    displayName: 'Partenariat révoqué',
    description: "Se déclenche Lorsqu'un partenariat est révoqué",
    props: {},
    sampleData:{
        id: 0,
        url: "string",
        secret: "string",
        type: "string",
        events: {},
        enabled: true,
        ignoreSsl: true,
        name: "string",
        createdOn: "2019-08-24T14:15:22Z",
        updatedOn: "2019-08-24T14:15:22Z",
        _links: {
          self: {
            href: "string"
          },
          organism: {
            href: "string",
            name: null,
            siret: null
          }
        }
      },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
      const flows = await context.flows.list();
      const flow = flows.data.find((flow) => flow.id === context.flows.current.id);
      const name = `<a href="${context.webhookUrl.split('/').slice(0, 3).join('/')}/projects/${context.project.id}/flows/${context.flows.current.id}">${flow?.version.displayName}</a>`;
        
        const message = {
          url: context.webhookUrl,
          events: ['certificationPartner.revoked'],
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
    async onDisable(context){
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
    async run(context){
        return [context.payload.body]
    }
})