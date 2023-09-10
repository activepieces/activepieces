import { Pipe, PipeTransform } from '@angular/core';
import { extractConnectionName } from './utils';

@Pipe({
  name: 'connectionNameExtractor',
})
export class ConnectionNameExtractorPipe implements PipeTransform {
  transform(value: string): string {
    return extractConnectionName(value);
  }
}
