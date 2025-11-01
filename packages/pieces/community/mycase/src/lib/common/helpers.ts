export function handleDropdownError(msg: string) {
  return {
    disabled: true,
    options: [],
    placeholder: msg,
  };
}