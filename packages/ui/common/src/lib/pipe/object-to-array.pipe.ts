import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'objectToArray',
  pure: true,
})
export class ObjectToArrayPipe implements PipeTransform {
  transform(obj: any): { value: any; key: string }[] {
    if (!obj) return [];
    return Object.entries(obj).map(([key, val]) => {
      return {
        value: val,
        key: key,
      };
    });
  }
}
