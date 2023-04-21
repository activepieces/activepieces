import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defaultFalse' })
export class DefaultFalsePipe implements PipeTransform {
  transform(value: boolean | null): boolean {
    return value == null ? false : value;
  }
}
