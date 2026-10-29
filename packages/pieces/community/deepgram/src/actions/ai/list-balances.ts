import { createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../../common/auth';
import { deepgramProps } from '../../common/props';
import { balancesOutputSchema } from '../../output-schemas';
import { listBalances, getBalancesAction } from '../get-balances';

const { project: _project, ...originalProps } = getBalancesAction.props;

export const listBalancesAiAction = createAction({
  auth: deepgramAuth,
  name: 'deepgram_list_balances',
  classification: 'SEARCH',
  displayName: 'List Credit Balances',
  description: 'Lists the prepaid credit balances of a Deepgram project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every prepaid credit balance of a Deepgram project with its ID, amount and units; amounts in different units are never added up. Use before large batches to avoid out-of-credit errors, or to get a balance ID for deepgram_get_balance. Needs an admin or owner key. Read-only.',
    idempotent: true,
  },
  outputSchema: balancesOutputSchema,
  props: {
    project_id: deepgramProps.projectId(),
    ...originalProps,
  },
  async run(context) {
    const { project_id, ...input } = context.propsValue;
    return listBalances({
      apiKey: context.auth.secret_text,
      input: { ...input, project: project_id ?? undefined },
    });
  },
});
