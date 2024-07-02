import { Pipe, PipeTransform } from '@angular/core';
const fractionDigits = 2;
@Pipe({
  name: 'durationFormatter',
  pure: true,
  standalone: true,
})
export class DurationFormatterPipe implements PipeTransform {
  transform(
    durationInMs: number,
    short?: boolean,
    allowFractions?: boolean
  ): string {
    try {
      if (durationInMs < 1000) {
        return $localize`${durationInMs.toFixed()} ${
          short ? 'ms' : 'milliseconds'
        }`;
      }
      const durationInSeconds = allowFractions
        ? Math.max(0, parseFloat((durationInMs / 1000).toFixed(fractionDigits)))
        : Math.ceil(durationInMs / 1000);

      if (durationInSeconds < 60) {
        return $localize`${durationInSeconds} ${short ? 's' : 'seconds'}`;
      }
      const durationInMinutes = allowFractions
        ? parseFloat((durationInSeconds / 60).toFixed(fractionDigits))
        : Math.ceil(durationInSeconds / 60);
      if (durationInMinutes < 60) {
        return $localize` ${durationInMinutes} ${short ? 'm' : 'minutes'}`;
      }
      const durationInHours = allowFractions
        ? parseFloat((durationInMinutes / 60).toFixed(fractionDigits))
        : Math.ceil(durationInMinutes / 60);
      if (durationInHours < 24) {
        return $localize`${durationInHours} ${short ? 'h' : 'hours'}`;
      }
      const durationInDays = allowFractions
        ? parseFloat((durationInHours / 24).toFixed(fractionDigits))
        : Math.ceil(durationInHours / 24);
      return $localize`${durationInDays} ${short ? 'd' : 'days'}`;
    } catch (ex) {
      console.error(ex);
      return '';
    }
  }
}
