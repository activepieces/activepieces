import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { esignaturesAuth } from '../common/auth';
export const contractSigned = createTrigger({
  auth: esignaturesAuth,
  name: 'contractSigned',
  displayName: 'Contract Signed',
  description: 'Triggers when a contract is signed',
  props: {},
  sampleData: {
    status: 'contract-signed',
    data: {
      contract: {
        id: '4efd01d4-d82b-438d-be3e-07099b35bebc',
        status: 'signed',
        title: 'Sample Consulting Agreement',
        metadata: '',
        labels: [],
        source: 'ui',
        test: 'yes',
        contract_pdf_url: '',
        signers: [
          {
            id: '386b8eb0-aac5-43ce-aa5e-500d5d548934',
            name: 'sanket',
            email: 'sanketnannaware21@gmail.com',
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
              {
                event: 'contract_viewed',
                timestamp: '2025-12-16T10:30:33.362Z',
                remote_ip: '152.59.8.216',
              },
              {
                event: 'sign_contract',
                timestamp: '2025-12-16T10:30:43.039Z',
                remote_ip: '152.59.8.216',
              },
              {
                event: 'email_final_contract_sent',
                timestamp: '2025-12-16T10:30:44.116Z',
              },
            ],
            signer_field_values: { 'Signer field 1': '1' },
          },
        ],
        finalized_at: '2025-12-16T10:30:43Z',
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
    if (body.status === 'contract-signed') {
      return [context.payload.body];
    }
    return [];
  },
});
