type Option = { label: string; value: string };

export function createStaticDropdown(options: Option[]) {
  return async () => ({ options });
} 