import { Pipe, PipeTransform } from '@angular/core';
import * as YAML from 'yaml';
@Pipe({ name: 'outputLog', pure: true })
export class OutputLogPipe implements PipeTransform {
  transform(value: any, truncate = true): string {
    return outputLog(value, truncate);
  }
}

export function outputLog(value: any, truncate = true): string {
  let result = '';
  const doc = new YAML.Document();
  if (typeof value === 'object') {
    if (Object.keys(value).length > 0) {
      doc.contents = value;
      result = doc.toString();
    }
  } else if (isJsonString(value)) {
    doc.contents = JSON.parse(value);
    result = doc.toString();
  } else {
    result = repr(value);
  }
  if (truncate) {
    result =
      result.length > 8092
        ? result.substring(0, 8092) + ' (truncated)'
        : result;
  }

  return result;
}

function repr(obj: unknown): string {
  if (obj == null || typeof obj === 'string' || typeof obj === 'number')
    return String(obj);
  if (Array.isArray(obj))
    return '[' + Array.prototype.map.call(obj, repr).join(', ') + ']';
  if (obj instanceof HTMLElement) return '<' + obj.nodeName.toLowerCase() + '>';
  if (obj instanceof Text) return '"' + obj.nodeValue + '"';
  if (obj.toString) return obj.toString();

  return String(obj);
}

function isJsonString(str: string) {
  try {
    const result = JSON.parse(str);
    if (typeof result === 'number') {
      return false;
    }
  } catch (e) {
    return false;
  }
  return true;
}
