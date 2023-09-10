import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'interpolateConnectionName',
})
export class InterpolateConnectionNamePipe implements PipeTransform {
  transform(value: string): string {
    return `{{connections['${value}']}}`;
  }
}
