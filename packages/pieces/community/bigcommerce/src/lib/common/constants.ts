export function normalizeStoreHash(storeHash: string): string {
  const trimmed = storeHash.trim();
  const fromApiPath = /\/stores\/([^/?#]+)/i.exec(trimmed);
  const fromStoreUrl = /^(?:https?:\/\/)?store-([^./]+)\.mybigcommerce\.com/i.exec(trimmed);
  const candidate = (fromApiPath?.[1] ?? fromStoreUrl?.[1] ?? trimmed).replace(/\/+$/, '');
  if (!/^[a-z0-9]+$/i.test(candidate)) {
    throw new Error(
      'BigCommerce Store Hash is invalid. Use only the letters and digits after /stores/ in your API Path (for example abcd1234).'
    );
  }
  return candidate;
}

export const GET_BASE_URL = (storeHash: string) =>
  `https://api.bigcommerce.com/stores/${normalizeStoreHash(storeHash)}`;

export function handleDropdownError(msg: string) {
  return {
    disabled: true,
    options: [],
    placeholder: msg,
  };
}

export const MAX_PAGE_SIZE = 250;

export type bigCommerceAuth = {
  storeHash: string;
  accessToken: string;
};
