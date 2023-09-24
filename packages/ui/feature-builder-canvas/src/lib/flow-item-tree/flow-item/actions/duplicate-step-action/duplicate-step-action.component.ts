import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FlowItem } from '../../../../../../../feature-builder-store/src';

@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({required:true})
  flowItem: FlowItem;
}
