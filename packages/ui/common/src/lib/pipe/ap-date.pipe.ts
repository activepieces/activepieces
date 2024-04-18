import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'apDate',
  standalone: true,
})
export class ApDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(
    value: Date | string,
    format: 'mdhm' | 'mdhms' | 'ymdhm' | 'ymd' = 'mdhm'
  ): string {
    let dateValue: Date;

    let angularFormat = '';
    switch (format) {
      case 'ymd':
        angularFormat = 'MMM d, y';
        break;
      case 'mdhms':
        angularFormat = 'MMM d, h:mm:ss a';
        break;
      case 'mdhm':
        angularFormat = 'MMM d, h:mm a';
        break;
      case 'ymdhm':
        angularFormat = 'MMM d, y, h:mm a';
        break;
      default:
        break;
    }
    // If value is a string, parse it into a Date object
    if (typeof value === 'string') {
      dateValue = new Date(value);
    } else {
      dateValue = value;
    }

    // If dateValue is invalid, return empty string
    if (isNaN(dateValue.getTime())) {
      return '';
    }

    return this.datePipe.transform(dateValue, angularFormat) || '';
  }
}
