import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooInput } from '../../common/values';
import { runMethodOutputSchema } from '../../output-schemas';
import { atomicProps } from './common';

export const odooCallMethod = createAction({
  auth: odooAuth,
  name: 'odoo_call_method',
  classification: 'WRITE',
  displayName: 'Call Model Method',
  description: 'Call a public method of an Odoo model, for example a button action.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Calls any public Odoo model method (execute_kw) on the given record IDs with extra positional and keyword arguments, for business verbs without a dedicated action, for example action_archive, action_unarchive, message_subscribe, action_cancel. A method that returns nothing is reported as success with returned_none true. unlink, write, update, create, name_create, load, web_save, copy, browse, sudo, with_user, with_context, with_env and private (_) methods are refused: use odoo_delete_records, odoo_update_records, odoo_create_record or odoo_get_records instead. This list steers you to the right action; it is not a security boundary, and Odoo access rights of the connected user still decide what the call may do. Not idempotent in general; depends on the method.',
    idempotent: false,
  },
  outputSchema: runMethodOutputSchema,
  props: {
    model: atomicProps.modelProp(),
    method: Property.ShortText({
      displayName: 'Method',
      description: 'Public method name, for example action_archive. Private (_) and generic CRUD methods such as unlink or write are refused.',
      required: true,
    }),
    ids: Property.Array({
      displayName: 'Record IDs',
      description: 'Records to call the method on, for example [12]. Leave empty for model-level methods such as default_get.',
      required: false,
    }),
    args: Property.Json({
      displayName: 'Extra Positional Arguments',
      description: 'JSON list passed after the record IDs, for example [["name", "email"]] for default_get. Usually empty.',
      required: false,
    }),
    kwargs: Property.Json({
      displayName: 'Keyword Arguments',
      description: 'JSON object of named arguments, for example {"partner_ids": [7]} for message_subscribe.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    return odooOperations.runMethod({
      client,
      model: odooInput.toModelName(p.model),
      method: odooInput.toMethodName({ value: p.method, actions: AI_ACTIONS }),
      ids: odooInput.toIdList({ value: p.ids, label: 'Record IDs', allowEmpty: true }),
      args: odooInput.parseArray({ value: p.args, label: 'Extra Positional Arguments' }),
      kwargs: odooInput.parseObject({ value: p.kwargs, label: 'Keyword Arguments', allowEmpty: true }),
    });
  },
});

const AI_ACTIONS = {
  delete: 'Delete Records (odoo_delete_records)',
  update: 'Update Records (odoo_update_records)',
  create: 'Create Record (odoo_create_record)',
  read: 'Get Records by ID (odoo_get_records)',
};
