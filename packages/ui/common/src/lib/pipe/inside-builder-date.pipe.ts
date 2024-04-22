import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
@Pipe({
  name: 'insideBuilderDate',
  standalone: true,
})
export class InsideBuilderDatePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(value: Date | string): string {
    let dateValue: Date;

    if (typeof value === 'string') {
      dateValue = new Date(value);
    } else {
      dateValue = value;
    }

    // If dateValue is invalid, return empty string
    if (isNaN(dateValue.getTime())) {
      return '';
    }

    const now = new Date();
    const time = this.datePipe.transform(dateValue, 'shortTime');
    const diff = now.getTime() - dateValue.getTime();
    if (diff < TWENTY_FOUR_HOURS) {
      return $localize`Today at ${time}`;
    } else if (diff < 2 * TWENTY_FOUR_HOURS) {
      return $localize`Yesterday at ${time}`;
    }
    const res = `${this.datePipe.transform(
      dateValue,
      'mediumDate'
    )}, ${this.datePipe.transform(dateValue, 'shortTime')}`;
    if (!res) {
      console.warn('Invalid date value', value, dateValue, res);
      return '';
    }
    return res;
  }
}
