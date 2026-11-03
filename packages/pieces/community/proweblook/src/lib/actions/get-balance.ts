import { createAction } from '@activepieces/pieces-framework';
import { proweblookAuth } from '../auth';
import { proweblookApi } from '../common/client';
import { getBalanceOutputSchema } from '../common/output-schemas';
import { GetBalanceData } from '../common/types';

export const getBalanceAction = createAction({
  auth: proweblookAuth,
  name: 'get_balance',
  classification: 'READ',
  audience: 'both',
  displayName: 'Get Credit Balance',
  description:
    'Retrieve your ProWebLook account email and remaining email, phone, and WhatsApp credit balances (free).',
  outputSchema: getBalanceOutputSchema,
  aiMetadata: {
    description:
      'Returns the authenticated ProWebLook account email and remaining email, phone, and WhatsApp credit balances. Free and read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await proweblookApi.post<GetBalanceData>({
      apiKey: auth.secret_text.trim(),
      operation: 'get_balance',
      body: {},
    });
  },
});
