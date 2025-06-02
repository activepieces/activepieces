import { wedofAuth } from '../../..';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const certificationPartnerSuspended = createTrigger({
  auth: wedofAuth,
  name: 'certificationPartnerSuspended',
  displayName: 'Partenariat suspendu',
  description: "Se déclenche Lorsqu'un partenariat est suspendu",
  props: {},
  sampleData: {
    id: 0,
    url: 'string',
    secret: 'string',
    type: 'string',
    events: {},
    enabled: true,
    ignoreSsl: true,
    name: 'string',
    createdOn: '2019-08-24T14:15:22Z',
    updatedOn: '2019-08-24T14:15:22Z',
    _links: {
      self: {
        href: 'string',
      },
      organism: {
        href: 'string',
        name: null,
        siret: null,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const flows = await context.flows.list();
    const flow = flows.data.find(
      (flow) => flow.id === context.flows.current.id
    );
    const name = `<a href="${context.webhookUrl
      .split('/')
      .slice(0, 3)
      .join('/')}/projects/${context.project.id}/flows/${
      context.flows.current.id
    }">${flow?.version.displayName}</a>`;

    await wedofCommon.handleWebhookSubscription(
      ['certificationPartner.suspended'],
      context,
      name
    );
  },

  async onDisable(context) {
    const id = await context.store.get('_webhookId');
    if (id !== null && id !== undefined) {
      await wedofCommon.unsubscribeWebhook(
        id as string,
        context.auth as string
      );
      await context.store.delete('_webhookId');
    }
  },

  async run(context) {
    return [context.payload.body];
  },
});
