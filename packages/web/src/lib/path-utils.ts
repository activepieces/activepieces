import { isNil, isObject } from '@activepieces/shared';

const COMMON_WRAPPERS = [
  'properties',
  'data',
  'body',
  'payload',
  'result',
  'response',
  'value',
  'attributes',
  'fields',
];

function parsePath(path: string): Array<string | number> {
  const segments: Array<string | number> = [];
  let i = 0;
  let buf = '';
  const flushBuf = () => {
    if (buf.length > 0) {
      segments.push(buf);
      buf = '';
    }
  };
  while (i < path.length) {
    const ch = path[i];
    if (ch === '.') {
      flushBuf();
      i++;
    } else if (ch === '[') {
      flushBuf();
      i++;
      if (path[i] === '"' || path[i] === "'") {
        const quote = path[i];
        i++;
        let key = '';
        while (i < path.length && path[i] !== quote) {
          if (path[i] === '\\' && i + 1 < path.length) {
            key += path[i + 1];
            i += 2;
          } else {
            key += path[i];
            i++;
          }
        }
        i++;
        while (i < path.length && path[i] !== ']') i++;
        i++;
        segments.push(key);
      } else {
        let num = '';
        while (i < path.length && path[i] !== ']') {
          num += path[i];
          i++;
        }
        i++;
        const n = parseInt(num, 10);
        segments.push(isNaN(n) ? num : n);
      }
    } else {
      buf += ch;
      i++;
    }
  }
  flushBuf();
  return segments;
}

function resolveSegments(
  obj: unknown,
  segments: Array<string | number>,
): unknown {
  let current: unknown = obj;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const idx =
        typeof segment === 'number' ? segment : parseInt(String(segment), 10);
      current = current[idx];
    } else if (isObject(current)) {
      current = current[String(segment)];
    } else {
      return undefined;
    }
  }
  return current;
}

function resolvePathWithWrapperFallback(
  obj: unknown,
  path: string,
): { value: unknown; resolvedPath: string } {
  if (path === '') return { value: obj, resolvedPath: path };
  if (!isObject(obj) && !Array.isArray(obj)) {
    return { value: undefined, resolvedPath: path };
  }
  const segments = parsePath(path);
  const direct = resolveSegments(obj, segments);
  if (!isNil(direct)) return { value: direct, resolvedPath: path };

  if (segments.length === 0 || !isObject(obj)) {
    return { value: direct, resolvedPath: path };
  }
  const rootKeys = Object.keys(obj);
  for (const wrapper of COMMON_WRAPPERS) {
    if (!rootKeys.includes(wrapper)) continue;
    if (segments[0] === wrapper) continue;
    const fallback = resolveSegments(obj, [wrapper, ...segments]);
    if (!isNil(fallback)) {
      return { value: fallback, resolvedPath: `${wrapper}.${path}` };
    }
  }
  return { value: direct, resolvedPath: path };
}

function getValueByDotPath(obj: unknown, path: string): unknown {
  return resolvePathWithWrapperFallback(obj, path).value;
}

export const pathUtils = {
  parsePath,
  resolveSegments,
  resolvePathWithWrapperFallback,
  getValueByDotPath,
};
