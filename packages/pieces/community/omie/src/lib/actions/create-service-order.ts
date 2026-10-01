import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieDropdowns } from '../common/dropdowns';

export const createServiceOrder = createAction({
  auth: omieAuth,
  name: 'create_service_order',
  classification: 'WRITE',
  displayName: 'Create Service Order',
  description: 'Creates a service order (ordem de serviço) with one service in Omie.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create an Omie service order (IncluirOS) for a client with one registered service. Returns the order code to pass to Bill Service Order. Use Additional Fields to add more data. Each call creates a new order, so retries duplicate.',
    idempotent: false,
  },
  props: {
    client: omieDropdowns.clientDropdown({
      displayName: 'Client',
      description: 'The client the service is provided to.',
      required: true,
    }),
    service: omieDropdowns.serviceDropdown({
      displayName: 'Service',
      description: 'A service registered in Omie.',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: true,
      defaultValue: 1,
    }),
    unit_value: Property.Number({
      displayName: 'Unit Value',
      description: 'Price per unit in BRL, e.g. 1500.',
      required: true,
    }),
    forecast_date: Property.DateTime({
      displayName: 'Forecast Date',
      description: 'Expected date of the service (dDtPrevisao).',
      required: true,
    }),
    installments: Property.Number({
      displayName: 'Number of Installments',
      required: true,
      defaultValue: 1,
    }),
    payment_terms_code: Property.ShortText({
      displayName: 'Payment Terms Code',
      description: 'Omie payment terms code (cCodParc), e.g. "000" for a single payment.',
      required: true,
      defaultValue: '000',
    }),
    stage: Property.ShortText({
      displayName: 'Stage Code',
      description: 'Omie service order stage code (cEtapa), e.g. "10".',
      required: true,
      defaultValue: '10',
    }),
    category: omieDropdowns.categoryDropdown({
      displayName: 'Revenue Category',
      description: 'Category used when the order is billed. Needed to bill the order.',
      required: false,
      accountType: 'conta_receita',
    }),
    bank_account: omieDropdowns.bankAccountDropdown({
      displayName: 'Bank Account',
      description: 'Account that receives the payment. Needed to bill the order.',
      required: false,
    }),
    additional_fields: Property.Json({
      displayName: 'Additional Fields',
      description:
        'Any other IncluirOS fields as JSON, e.g. {"Observacoes": {"cObsOS": "Urgent"}}. They are merged into the request at the top level.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return omieClient.call({
      auth,
      module: 'servicos/os',
      method: 'IncluirOS',
      param: {
        Cabecalho: {
          cCodIntOS: omieClient.newIntegrationCode(),
          cCodParc: propsValue.payment_terms_code,
          cEtapa: propsValue.stage,
          dDtPrevisao: omieClient.toOmieDate({ value: propsValue.forecast_date }),
          nCodCli: propsValue.client,
          nQtdeParc: propsValue.installments,
        },
        InformacoesAdicionais: omieClient.compact({
          value: { cCodCateg: propsValue.category, nCodCC: propsValue.bank_account },
        }),
        ServicosPrestados: [
          {
            nCodServico: propsValue.service,
            nQtde: propsValue.quantity,
            nValUnit: propsValue.unit_value,
          },
        ],
        ...omieClient.parseJsonObject({ value: propsValue.additional_fields }),
      },
    });
  },
});
