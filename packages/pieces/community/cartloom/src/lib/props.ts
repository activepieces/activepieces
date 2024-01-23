import { CartloomAuthType } from './auth';
import { getProducts } from './api';

export async function buildProductsDropdown(auth: CartloomAuthType) {
  if (!auth) {
    return {
      options: [],
      disabled: true,
      placeholder: 'Please authenticate first',
    };
  }
  const response = await getProducts(auth as CartloomAuthType);
  const options = response.data.map((product) => {
    return { label: product.name, value: product.pid };
  });
  return {
    options: options,
  };
}
