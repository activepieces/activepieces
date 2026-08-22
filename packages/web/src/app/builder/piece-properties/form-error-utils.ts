function getNestedErrorPaths(
  errors: Record<string, unknown>,
  prefix: string,
): string[] {
  return Object.entries(errors ?? {}).flatMap(([key, value]) => {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && 'message' in value) {
      return [path];
    }
    if (value && typeof value === 'object') {
      return getNestedErrorPaths(value as Record<string, unknown>, path);
    }
    return [];
  });
}

function getTouchedPaths(
  source: Record<string, unknown>,
  prefix: string,
): string[] {
  return Object.entries(source ?? {}).flatMap(([key, value]) => {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    if (value === true) {
      return [path];
    }
    if (value && typeof value === 'object') {
      return getTouchedPaths(value as Record<string, unknown>, path);
    }
    return [];
  });
}

function hasErrorUnder({
  errors,
  paths,
}: {
  errors: Record<string, unknown>;
  paths: string[];
}): boolean {
  const errorPaths = getNestedErrorPaths(errors, '');
  return paths.some((path) =>
    errorPaths.some((errorPath) => errorPath.startsWith(path)),
  );
}

function hasTouchedErrorUnder({
  errors,
  touchedFields,
  paths,
}: {
  errors: Record<string, unknown>;
  touchedFields: Record<string, unknown>;
  paths: string[];
}): boolean {
  const errorPaths = getNestedErrorPaths(errors, '');
  const touchedPaths = getTouchedPaths(touchedFields, '');
  return paths.some(
    (path) =>
      errorPaths.some((errorPath) => errorPath.startsWith(path)) &&
      touchedPaths.some((touchedPath) => touchedPath.startsWith(path)),
  );
}

export const formErrorUtils = {
  getNestedErrorPaths,
  getTouchedPaths,
  hasErrorUnder,
  hasTouchedErrorUnder,
};
