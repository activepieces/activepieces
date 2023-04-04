import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defaultTrue' })
export class DefaultTruePipe implements PipeTransform {
  transform(value: boolean | null): boolean {
    return value == null ? true : value;
  }
}
