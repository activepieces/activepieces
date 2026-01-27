import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { esignaturesAuth } from '../common/auth';
export const signerDeclined = createTrigger({
  auth: esignaturesAuth,
  name: 'signerDeclined',
  displayName: 'Signer declined',
  description: 'Trigger when a signer has declined to sign the contract',
  props: {},
  sampleData: {
    status: 'signer-declined',
    data: {
      signer: {
        id: '6signer6-9999',
        name: 'Sam Signer',
        email: 'sam@tenants.com',
        mobile: '+12481234567',
        company_name: 'ACME Corp',
        signing_order: '1',
        auto_sign: 'no',
        redirect_url: '',
        events: [
          {
            event: 'signature_declined',
            reason_for_decline: 'Commencement date is 5th of June',
            timestamp: '2015-10-22T18:19:35.979',
          },
        ],
      },
      contract: {
        id: '1contr11-2222',
        title: 'Sample NDA',
        metadata: 'ID0001',
        source: 'api',
        test: 'no',
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // implement webhook creation logic
  },
  async onDisable(context) {
    // implement webhook deletion logic
  },
  async run(context) {
    const body = context.payload.body as any;
    if (body.status === 'signer-declined') {
      return [context.payload.body];
    }
    return [];
  },
});
