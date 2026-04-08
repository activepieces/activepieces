function getRequiredString({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function getOptionalString({
  value,
}: {
  value: unknown;
}): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function getOptionalPositiveInteger({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new Error(`${fieldName} must be a positive integer.`);
  }

  return value;
}

function getOptionalObject({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!isRecord(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }

  return value;
}

function getLineItems({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): Array<{
  price_id: string;
  quantity?: number;
}> {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${fieldName} must be a non-empty array.`);
  }

  return value.map((lineItem, index) => {
    if (!isRecord(lineItem)) {
      throw new Error(`${fieldName} item ${index + 1} must be a JSON object.`);
    }

    const priceId = getRequiredString({
      value: lineItem['price_id'],
      fieldName: `${fieldName} item ${index + 1} price_id`,
    });
    const quantity = getOptionalPositiveInteger({
      value: lineItem['quantity'],
      fieldName: `${fieldName} item ${index + 1} quantity`,
    });

    if (quantity === undefined) {
      return {
        price_id: priceId,
      };
    }

    return {
      price_id: priceId,
      quantity,
    };
  });
}

function compactRecord(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const paddleUtils = {
  compactRecord,
  getLineItems,
  getOptionalObject,
  getOptionalPositiveInteger,
  getOptionalString,
  getRequiredString,
};

export { paddleUtils };
