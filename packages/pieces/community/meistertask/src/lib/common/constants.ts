export const BASE_URL = 'https://www.meistertask.com';

export function handleDropdownError(msg: string) {
  return {
    disabled: true,
    options: [],
    placeholder: msg,
  };
}