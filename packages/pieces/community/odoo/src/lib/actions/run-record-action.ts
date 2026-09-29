import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooClient } from '../common/client';
import { odooOperations } from '../common/operations';
import { odooProps } from '../common/props';
import { odooInput } from '../common/values';
import { runMethodOutputSchema } from '../output-schemas';

const HUMAN_ACTIONS = { delete: 'Delete Record', update: 'Custom Update Record', create: 'Custom Create Record', read: 'Get Record' };

export const runRecordActionAction = createAction({
  auth: odooAuth,
  name: 'run_record_action',
  classification: 'WRITE',
  displayName: 'Run Record Action',
  description: 'Run a button action on a record, for example confirm a quotation or post an invoice.',
  audience: 'human',
  aiMetadata: {
    description:
      'Calls a public business method on one Odoo record (for example action_confirm on sale.order, action_post on account.move, action_set_won on crm.lead, action_archive). Methods that return nothing are reported as success. unlink, write, create, copy, browse, sudo, with_user, with_context, with_env and private (_) methods are refused; use Delete Record, Custom Update Record, Custom Create Record or Get Record instead. Not idempotent: most actions fail or repeat their effect when run twice.',
    idempotent: false,
  },
  outputSchema: runMethodOutputSchema,
  props: {
    model: odooProps.modelDropdown(),
    record_id: odooProps.recordDropdown(),
    method: Property.ShortText({
      displayName: 'Action (method name)',
      description:
        'The technical name of the button method. Examples: action_confirm (confirm a quotation), action_post (post an invoice), action_set_won (mark a lead won), action_archive (archive any record). Turn on developer mode in Odoo and hover a button to see its name.',
      required: true,
    }),
    kwargs: Property.Json({
      displayName: 'Extra Arguments',
      description: 'Optional JSON object of named arguments, for example {"lost_reason_id": 3} for action_set_lost.',
      required: false,
    }),
  },
  async run(context) {
    const model = odooInput.toModelName(context.propsValue.model);
    const id = odooInput.toId({ value: context.propsValue.record_id, label: 'Record' });
    const method = odooInput.toMethodName({ value: context.propsValue.method, actions: HUMAN_ACTIONS });
    const kwargs = odooInput.parseObject({ value: context.propsValue.kwargs, label: 'Extra Arguments', allowEmpty: true });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.runMethod({ client, model, method, ids: [id], args: [], kwargs });
  },
});
