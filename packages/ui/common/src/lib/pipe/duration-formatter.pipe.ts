import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'durationFormatter',
  pure: true,
  standalone: true,
})
export class DurationFormatterPipe implements PipeTransform {
  transform(duration: number): string {
    try {
      const durationInSeconds = Math.ceil(duration / 1000);
      if (durationInSeconds < 60) {
        return $localize`${durationInSeconds} seconds`;
      }
      const durationInMinutes = Math.ceil(durationInSeconds / 60);
      if (durationInMinutes < 60) {
        return $localize`${durationInMinutes} minutes`;
      }
      const durationInHours = Math.ceil(durationInMinutes / 60);
      return $localize`${durationInHours} hours`;
    } catch (ex) {
      console.error(ex);
      return '';
    }
  }
}
