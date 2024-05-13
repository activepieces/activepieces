import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'defaultText', pure: true, standalone: true })
export class DefaultTextPipe implements PipeTransform {
  transform(value: string | null, placeholder: string): string {
    return value == null ? placeholder : value;
  }
}
