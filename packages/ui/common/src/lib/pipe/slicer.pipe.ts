import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slicer',
  pure: true,
})
export class SlicerPipe implements PipeTransform {
  transform(value: any[], from: number, to: number): any[] {
    return value.slice(from, to);
  }
}
