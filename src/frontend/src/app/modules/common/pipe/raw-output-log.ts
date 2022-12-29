import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'rawOutputLog' })
export class RawOutputLogPipe implements PipeTransform {
	transform(value: any | null): string {
		if (value == undefined) {
			return '{}';
		}
		let result = '';
		if (typeof value === 'object') {
			result = JSON.stringify(value, null, 2);
		} else if (this.isJsonString(value)) {
			result = JSON.stringify(JSON.parse(value), null, 2);
		} else {
			result = this.repr(value);
		}
		return result.length > 64000 ? result.substr(0, 64000) + ' (truncated)' : result;
	}

	repr(obj) {
		if (obj == null || typeof obj === 'string' || typeof obj === 'number') return String(obj);
		if (obj.length) return '[' + Array.prototype.map.call(obj, this.repr).join(', ') + ']';
		if (obj instanceof HTMLElement) return '<' + obj.nodeName.toLowerCase() + '>';
		if (obj instanceof Text) return '"' + obj.nodeValue + '"';
		if (obj.toString) return obj.toString();

		return String(obj);
	}

	isJsonString(str) {
		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
}
