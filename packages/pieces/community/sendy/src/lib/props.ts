import { SendyAuthType } from './auth';
import { getBrands, getLists } from './api';

export async function buildBrandDropdown(auth: SendyAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getBrands(auth as SendyAuthType);
  const options = response.data.map((brand) => {
    return { label: brand.name, value: brand.id };
  });
  return {
    options: options,
  };
}

export async function buildListDropdown(auth: SendyAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getLists(auth as SendyAuthType);
  const options = response.data.map((list) => {
    return { label: list.name, value: list.id };
  });
  return {
    options: options,
  };
}
