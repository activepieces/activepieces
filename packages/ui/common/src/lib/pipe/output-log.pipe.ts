import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'outputLog', pure: true })
export class OutputLogPipe implements PipeTransform {
  transform(value: any, truncate = true): string {
    let result = '';
    if (typeof value === 'object') {
      result = JSON.stringify(value, null, 2);
    } else if (this.isJsonString(value)) {
      result = JSON.stringify(JSON.parse(value), null, 2);
    } else {
      result = this.repr(value);
    }
    if (truncate) {
      return result.length > 8092
        ? result.substring(0, 8092) + ' (truncated)'
        : result;
    } else return result;
  }

  repr(obj: unknown): string {
    if (obj == null || typeof obj === 'string' || typeof obj === 'number')
      return String(obj);
    if (Array.isArray(obj))
      return '[' + Array.prototype.map.call(obj, this.repr).join(', ') + ']';
    if (obj instanceof HTMLElement)
      return '<' + obj.nodeName.toLowerCase() + '>';
    if (obj instanceof Text) return '"' + obj.nodeValue + '"';
    if (obj.toString) return obj.toString();

    return String(obj);
  }

  isJsonString(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }
}
