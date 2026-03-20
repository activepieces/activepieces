export type bigCommerceAuth = {
    storeHash: string;
    accessToken: string;
}

export const GET_BASE_URL = (storeHash: string) =>
  `https://api.bigcommerce.com/stores/${storeHash}`;

export function handleDropdownError(msg: string) {
  return {
    disabled: true,
    options: [],
    placeholder: msg,
  };
}