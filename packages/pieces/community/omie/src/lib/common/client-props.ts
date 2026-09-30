import { Property } from '@activepieces/pieces-framework';

export const clientFieldProps = {
  razao_social: Property.ShortText({
    displayName: 'Legal Name',
    description: 'Legal name of the client or supplier (razão social).',
    required: true,
  }),
  nome_fantasia: Property.ShortText({
    displayName: 'Trade Name',
    description: 'Trade name (nome fantasia), e.g. "Acme Store".',
    required: false,
  }),
  cnpj_cpf: Property.ShortText({
    displayName: 'CNPJ / CPF',
    description: 'Company (CNPJ) or person (CPF) tax ID, e.g. "80.716.929/0001-50".',
    required: false,
  }),
  email: Property.ShortText({
    displayName: 'Email',
    required: false,
  }),
  telefone1_ddd: Property.ShortText({
    displayName: 'Phone Area Code',
    description: 'Area code (DDD), e.g. "11".',
    required: false,
  }),
  telefone1_numero: Property.ShortText({
    displayName: 'Phone Number',
    description: 'Phone number without area code, e.g. "98765-4321".',
    required: false,
  }),
  endereco: Property.ShortText({
    displayName: 'Street',
    description: 'Street name (endereço).',
    required: false,
  }),
  endereco_numero: Property.ShortText({
    displayName: 'Street Number',
    required: false,
  }),
  bairro: Property.ShortText({
    displayName: 'Neighborhood',
    description: 'Neighborhood (bairro).',
    required: false,
  }),
  cidade: Property.ShortText({
    displayName: 'City',
    required: false,
  }),
  estado: Property.ShortText({
    displayName: 'State',
    description: 'Two-letter state code (UF), e.g. "SP".',
    required: false,
  }),
  cep: Property.ShortText({
    displayName: 'Postal Code',
    description: 'Postal code (CEP), e.g. "01234-567".',
    required: false,
  }),
  additional_fields: Property.Json({
    displayName: 'Additional Fields',
    description:
      'Any other Omie client fields as JSON, e.g. {"pessoa_fisica": "S", "inscricao_estadual": "123"}. They override the fields above. See the ClientesCadastro reference at developer.omie.com.br.',
    required: false,
  }),
};
