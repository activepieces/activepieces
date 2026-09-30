import { createAction, Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from '../common/client';
import { omieDropdowns } from '../common/dropdowns';

export const createServiceContract = createAction({
  auth: omieAuth,
  name: 'create_service_contract',
  classification: 'WRITE',
  displayName: 'Create Service Contract',
  description: 'Creates a recurring service contract with its items in Omie (Incluir Contrato de Serviço).',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a service contract for a client with one or more billable items (IncluirContrato). Use Additional Header Fields for contract fields not listed. Each call creates a new contract, so retries duplicate.',
    idempotent: false,
  },
  props: {
    client: omieDropdowns.clientDropdown({
      displayName: 'Client',
      description: 'The client the contract is for.',
      required: true,
    }),
    contract_number: Property.ShortText({
      displayName: 'Contract Number',
      description: 'Contract number shown in Omie, e.g. "2026/01001".',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description: 'First day the contract is valid.',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      description: 'Last day the contract is valid.',
      required: true,
    }),
    billing_day: Property.Number({
      displayName: 'Billing Day',
      description: 'Day of the month the contract is billed, e.g. 30.',
      required: true,
    }),
    billing_type: Property.ShortText({
      displayName: 'Billing Type Code',
      description: 'Omie billing type code (cTipoFat), e.g. "01" for monthly billing.',
      required: true,
      defaultValue: '01',
    }),
    items: Property.Array({
      displayName: 'Items',
      description: 'The services billed by this contract.',
      required: true,
      properties: {
        description: Property.LongText({
          displayName: 'Service Description',
          description: 'Full description of the service, e.g. "Monthly consulting".',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: true,
        }),
        unit_value: Property.Number({
          displayName: 'Unit Value',
          description: 'Price per unit in BRL, e.g. 1000.',
          required: true,
        }),
        municipal_service_code: Property.ShortText({
          displayName: 'Municipal Service Code',
          description: 'Municipal service code (codServMunic), e.g. "01292".',
          required: false,
        }),
        lc116_code: Property.ShortText({
          displayName: 'LC 116 Service Code',
          description: 'Federal service list code (LC 116), e.g. "3.05".',
          required: false,
        }),
        operation_nature: Property.ShortText({
          displayName: 'Operation Nature Code',
          description: 'Omie operation nature code (natOperacao), e.g. "01".',
          required: false,
        }),
      },
    }),
    additional_header_fields: Property.Json({
      displayName: 'Additional Header Fields',
      description:
        'Any other contract header fields as JSON, e.g. {"cCodSit": "10"}. They are merged into the contract header (cabecalho).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const items = omieClient.parseObjectArray({ value: propsValue.items });
    return omieClient.call({
      auth,
      module: 'servicos/contrato',
      method: 'IncluirContrato',
      param: {
        cabecalho: omieClient.compact({
          value: {
            cCodIntCtr: omieClient.newIntegrationCode(),
            cNumCtr: propsValue.contract_number,
            nCodCli: propsValue.client,
            dVigInicial: omieClient.toOmieDate({ value: propsValue.start_date }),
            dVigFinal: omieClient.toOmieDate({ value: propsValue.end_date }),
            nDiaFat: propsValue.billing_day,
            cTipoFat: propsValue.billing_type,
            ...omieClient.parseJsonObject({ value: propsValue.additional_header_fields }),
          },
        }),
        itensContrato: items.map((item, index) => ({
          itemCabecalho: omieClient.compact({
            value: {
              codIntItem: String(index + 1),
              seq: index + 1,
              quant: item['quantity'],
              valorUnit: item['unit_value'],
              codServMunic: item['municipal_service_code'],
              codLC116: item['lc116_code'],
              natOperacao: item['operation_nature'],
            },
          }),
          itemDescrServ: { descrCompleta: item['description'] },
        })),
      },
    });
  },
});
