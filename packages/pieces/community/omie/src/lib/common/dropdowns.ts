import { Property } from '@activepieces/pieces-framework';
import { omieAuth } from '../auth';
import { omieClient } from './client';
import { omieEndpoints } from './endpoints';

function clientDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const clients = await omieClient.listAll<ClientItem>({
        auth,
        endpoint: omieEndpoints.clients,
        filters: { apenas_importado_api: 'N' },
      });
      return {
        disabled: false,
        options: clients.map((client) => ({
          label: client.cnpj_cpf
            ? `${client.razao_social} (${client.cnpj_cpf})`
            : client.razao_social,
          value: client.codigo_cliente_omie,
        })),
      };
    },
  });
}

function categoryDropdown({ displayName, description, required, accountType }: CategoryDropdownParams) {
  return Property.Dropdown<string, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const categories = await omieClient.listAll<CategoryItem>({
        auth,
        endpoint: omieEndpoints.categories,
        filters: { filtrar_apenas_ativo: 'S' },
      });
      return {
        disabled: false,
        options: categories
          .filter((category) => category[accountType] === 'S')
          .map((category) => ({
            label: `${category.codigo} - ${category.descricao}`,
            value: category.codigo,
          })),
      };
    },
  });
}

function bankAccountDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const accounts = await omieClient.listAll<BankAccountItem>({
        auth,
        endpoint: omieEndpoints.bankAccounts,
        filters: { apenas_importado_api: 'N' },
      });
      return {
        disabled: false,
        options: accounts.map((account) => ({
          label: account.descricao,
          value: account.nCodCC,
        })),
      };
    },
  });
}

function serviceDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const services = await omieClient.listAll<ServiceItem>({
        auth,
        endpoint: omieEndpoints.services,
      });
      return {
        disabled: false,
        options: services.map((service) => ({
          label: service.cabecalho.cDescricao,
          value: service.intListar.nCodServ,
        })),
      };
    },
  });
}

function contractDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const contracts = await omieClient.listAll<ContractItem>({
        auth,
        endpoint: omieEndpoints.contracts,
      });
      return {
        disabled: false,
        options: contracts.map((contract) => ({
          label: `${contract.cabecalho.cNumCtr} (#${contract.cabecalho.nCodCtr})`,
          value: contract.cabecalho.nCodCtr,
        })),
      };
    },
  });
}

function contractItemDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: ['contract'],
    options: async ({ auth, contract }) => {
      if (!auth || typeof contract !== 'number') {
        return { disabled: true, options: [], placeholder: 'Please select a contract first' };
      }
      const response = await omieClient.call<ContractDetailsResponse>({
        auth,
        module: 'servicos/contrato',
        method: 'ConsultarContrato',
        param: { contratoChave: { nCodCtr: contract } },
      });
      return {
        disabled: false,
        options: (response.contratoCadastro?.itensContrato ?? []).map((item) => ({
          label: `${item.itemCabecalho.seq}. ${item.itemDescrServ?.descrCompleta ?? item.itemCabecalho.codItem}`,
          value: item.itemCabecalho.codItem,
        })),
      };
    },
  });
}

function serviceOrderDropdown({ displayName, description, required }: DropdownParams) {
  return Property.Dropdown<number, boolean, typeof omieAuth>({
    auth: omieAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return notConnected();
      const orders = await omieClient.listAll<ServiceOrderItem>({
        auth,
        endpoint: omieEndpoints.serviceOrders,
      });
      return {
        disabled: false,
        options: orders.map((order) => ({
          label: `OS ${order.Cabecalho.cNumOS} (#${order.Cabecalho.nCodOS})`,
          value: order.Cabecalho.nCodOS,
        })),
      };
    },
  });
}

function notConnected() {
  return { disabled: true, options: [], placeholder: 'Please connect your Omie account first' };
}

export const omieDropdowns = {
  clientDropdown,
  categoryDropdown,
  bankAccountDropdown,
  serviceDropdown,
  contractDropdown,
  contractItemDropdown,
  serviceOrderDropdown,
};

type DropdownParams = {
  displayName: string;
  description: string;
  required: boolean;
};

type CategoryDropdownParams = DropdownParams & {
  accountType: 'conta_receita' | 'conta_despesa';
};

type ClientItem = { codigo_cliente_omie: number; razao_social: string; cnpj_cpf?: string };
type CategoryItem = {
  codigo: string;
  descricao: string;
  conta_receita?: string;
  conta_despesa?: string;
};
type BankAccountItem = { nCodCC: number; descricao: string };
type ServiceItem = {
  intListar: { nCodServ: number };
  cabecalho: { cDescricao: string };
};
type ContractItem = { cabecalho: { nCodCtr: number; cNumCtr: string } };
type ServiceOrderItem = { Cabecalho: { nCodOS: number; cNumOS: string } };
type ContractDetailsResponse = {
  contratoCadastro?: {
    itensContrato?: {
      itemCabecalho: { codItem: number; seq: number };
      itemDescrServ?: { descrCompleta?: string };
    }[];
  };
};
