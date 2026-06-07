import { pathUtils } from '@/lib/path-utils';

function escapeMentionKey(key: string): string {
  return key.replaceAll(/[\\"'\n\r\t’]/g, (char) => `\\${char}`);
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
  }, stepName);
}

export const pathHelpers = {
  escapeMentionKey,
  convertValuePathToPropertyPath,
};
