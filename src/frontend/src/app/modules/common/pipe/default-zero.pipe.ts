import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defaultZero' })
export class DefaultZeroPipe implements PipeTransform {
	transform(value: number | undefined): number {
		return value == null ? 0 : value;
	}
}
