import { formulaEvaluator } from '@activepieces/core-formula';
import { isNil } from '@activepieces/core-utils';

import { pathUtils } from '@/lib/path-utils';

const WHOLE_FIELD_MENTION = /^\{\{([\s\S]+)\}\}$/;

const resolveItemsCount = ({
  items,
  outputSampleData,
}: {
  items: string | undefined;
  outputSampleData: Record<string, unknown | undefined>;
}): number | null => {
  const expression = formulaEvaluator.unwrap(items ?? '').trim();
  const mention = expression.match(WHOLE_FIELD_MENTION);
  if (!mention) {
    return null;
  }
  const [stepName, ...path] = pathUtils.parsePath(mention[1].trim());
  if (typeof stepName !== 'string') {
    return null;
  }
  const value = pathUtils.resolveSegments(
    outputSampleData[stepName],
    path[0] === 'output' ? path.slice(1) : path,
  );
  return Array.isArray(value) ? value.length : null;
};

const secondsToHours = (
  timeoutSeconds: number | undefined,
): number | undefined =>
  isNil(timeoutSeconds)
    ? undefined
    : Math.round(timeoutSeconds / SECONDS_PER_HOUR);

const hoursToSeconds = (hours: number | undefined): number | undefined =>
  isNil(hours) || Number.isNaN(hours)
    ? undefined
    : Math.round(hours) * SECONDS_PER_HOUR;

const SECONDS_PER_HOUR = 3600;

export const processInBatchesUtils = {
  resolveItemsCount,
  secondsToHours,
  hoursToSeconds,
};
