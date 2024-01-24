import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'flowStatus',
  standalone: true,
  pure: true,
})
export class FlowStatusPipe implements PipeTransform {
  transform(flowOn: boolean, flowDisabled: boolean): string {
    if (flowDisabled) {
      return $localize`Please publish the flow`;
    }

    return flowOn ? $localize`Flow is on` : $localize`Flow is off`;
  }
}
