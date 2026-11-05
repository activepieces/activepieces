function getSelectedValues({
  searchParams,
  key,
  allowedValues,
  defaultValues,
}: {
  searchParams: URLSearchParams;
  key: string;
  allowedValues: string[];
  defaultValues?: string[];
}): string[] {
  if (!defaultValues) {
    return searchParams.getAll(key);
  }
  if (!searchParams.has(key)) {
    return defaultValues;
  }
  return searchParams
    .getAll(key)
    .filter((value) => allowedValues.includes(value));
}

export const dataTableFilterUtils = { getSelectedValues };
