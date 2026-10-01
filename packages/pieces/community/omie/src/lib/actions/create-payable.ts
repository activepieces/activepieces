import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieDropdowns } from '../common/dropdowns';

export const createPayable = createAction({
  auth: omieAuth,
  name: 'create_payable',
  classification: 'WRITE',
  displayName: 'Create Payable',
  description: 'Registers an account payable (conta a pagar) in Omie.',
  audience: 'both',
  aiMetadata: {
    description:
      'Register a bill to pay to a supplier in Omie (IncluirContaPagar). Each call creates a new payable, so retries duplicate.',
    idempotent: false,
  },
  props: {
    supplier: omieDropdowns.clientDropdown({
      displayName: 'Supplier',
      description: 'The supplier to be paid.',
      required: true,
    }),
    category: omieDropdowns.categoryDropdown({
      displayName: 'Expense Category',
      description: 'The expense category of the payable.',
      required: true,
      accountType: 'conta_despesa',
    }),
    bank_account: omieDropdowns.bankAccountDropdown({
      displayName: 'Bank Account',
      description: 'The account the payment is made from.',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'Document value in BRL, e.g. 100.',
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      required: true,
    }),
    forecast_date: Property.DateTime({
      displayName: 'Forecast Date',
      description: 'Expected payment date. Defaults to the due date.',
      required: false,
    }),
    document_number: Property.ShortText({
      displayName: 'Document Number',
      description: 'Invoice or document number, e.g. "NF-1042".',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description:
        'Any other IncluirContaPagar fields as JSON, e.g. {"id_origem": "API"}. They override the fields above.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const dueDate = omieClient.toOmieDate({ value: propsValue.due_date });
    return omieClient.call({
      auth,
      module: 'financas/contapagar',
      method: 'IncluirContaPagar',
      param: omieClient.compact({
        value: {
          codigo_lancamento_integracao: omieClient.newIntegrationCode(),
          codigo_cliente_fornecedor: propsValue.supplier,
          codigo_categoria: propsValue.category,
          id_conta_corrente: propsValue.bank_account,
          valor_documento: propsValue.amount,
          data_vencimento: dueDate,
          data_previsao: propsValue.forecast_date
            ? omieClient.toOmieDate({ value: propsValue.forecast_date })
            : dueDate,
          numero_documento: propsValue.document_number,
          observacao: propsValue.notes,
          ...omieClient.parseJsonObject({ value: propsValue.additional_fields }),
        },
      }),
    });
  },
});
