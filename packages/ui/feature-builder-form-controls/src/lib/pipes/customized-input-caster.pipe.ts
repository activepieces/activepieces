import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customizedInputsCaster',
  pure: true,
  standalone: true,
})

export class CustomizedInputsCasterPipe implements PipeTransform {
  transform(customizedInputsValue: Record<string,boolean> | boolean): Record<string, boolean>{
    return customizedInputsValue as Record<string, boolean>;
  }
}
