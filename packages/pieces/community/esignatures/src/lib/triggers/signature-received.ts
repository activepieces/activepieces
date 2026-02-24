import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { esignaturesAuth } from '../common/auth';
export const signatureReceived = createTrigger({
  auth: esignaturesAuth,
  name: 'signatureReceived',
  displayName: 'Signature Received',
  description: 'Trigger when a singer has signed the contract',
  props: {},
  sampleData: {
    status: 'signer-signed',
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
        signer_field_values: {
          city: 'Boston',
          preferred_contact: 'Phone',
        },
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
    if (body.status === 'signer-signed') {
      return [context.payload.body];
    }
    return [];
  },
});
