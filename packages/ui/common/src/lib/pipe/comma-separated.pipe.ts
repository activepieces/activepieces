import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'commaSeparated',
})
export class CommaSeparatedPipe implements PipeTransform {
  transform(value: number): string {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
