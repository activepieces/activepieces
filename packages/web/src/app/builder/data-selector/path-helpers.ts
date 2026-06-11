import { pathUtils } from '@/lib/path-utils';

function escapeMentionKey(key: string): string {
  return key.replaceAll(/[\\"'\n\r\t’]/g, (char) => `\\${char}`);
}

function propertyPathStarter(stepName: string): string {
  return `${stepName}['output']`;
}

function convertValuePathToPropertyPath(
  stepName: string,
  valuePath: string,
): string {
  const segments = pathUtils.parsePath(valuePath);
  return segments.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return `${acc}['${escapeMentionKey(segment)}']`;
  }, propertyPathStarter(stepName));
}

export const pathHelpers = {
  escapeMentionKey,
  convertValuePathToPropertyPath,
  propertyPathStarter,
};
