import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { esignaturesAuth } from '../common/auth';
export const contractSentToASigner = createTrigger({
  auth: esignaturesAuth,
  name: 'contractSentToASigner',
  displayName: 'Contract Sent to a Signer',
  description: '',
  props: {},
  sampleData: {
    status: 'contract-sent-to-signer',
    data: {
      signer: {
        id: '386b8eb0-aac5-43ce-aa5e-500d5d548934',
        name: 'test',
        email: 'test@gmail.com',
        mobile: null,
        company_name: 'ss',
        signing_order: '1',
        auto_sign: 'no',
        redirect_url: '',
        events: [
          {
            event: 'email_contract_sent',
            timestamp: '2025-12-16T10:30:15.390Z',
          },
        ],
      },
      contract: {
        id: '4efd01d4-d82b-438d-be3e-07099b35bebc',
        status: 'sent',
        title: 'Sample Consulting Agreement',
        metadata: '',
        labels: [],
        source: 'ui',
        test: 'yes',
        expires_at: '2025-12-30T10:30:12Z',
        assigned_user_email: 'test@gmail.com',
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
    if (body.status === 'contract-sent-to-signer') {
      return [context.payload.body];
    }
    return [];
  },
});
