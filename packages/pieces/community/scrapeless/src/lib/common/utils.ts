function stringList({
  value,
  prop,
}: {
  value: unknown[] | undefined;
  prop: string;
}): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    !value.every(
      (item): item is string => typeof item === 'string' && item !== ''
    )
  ) {
    throw new Error(`${prop} must be a list of non-empty strings.`);
  }
  return value;
}

export const scrapelessUtils = { stringList };
