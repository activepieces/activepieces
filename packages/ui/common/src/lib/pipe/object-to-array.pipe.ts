import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectToArray',
  pure: true,
})
export class ObjectToArrayPipe implements PipeTransform {
  transform<T>(obj: T): { key: keyof T; value: (typeof obj)[keyof T] }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, val]) => {
      return {
        value: val as (typeof obj)[keyof T],
        key: key as keyof T,
      };
    });
  }
}
