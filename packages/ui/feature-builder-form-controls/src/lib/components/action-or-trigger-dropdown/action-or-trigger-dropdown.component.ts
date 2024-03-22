import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FormControl, Validators } from '@angular/forms';
import {
  ActionBase,
  TriggerBase,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { IsTriggerGuardPipe } from '../../pipes/is-trigger-guard.pipe';
import { DropdownSelectedValuesPipe } from '../../pipes/dropdown-selected-values.pipe';
import { selectedTirggerOrActionPipe } from '../../pipes/selected-action-or-trigger.pipe';

@Component({
  selector: 'app-action-or-trigger-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    IsTriggerGuardPipe,
    DropdownSelectedValuesPipe,
    selectedTirggerOrActionPipe,
  ],
  templateUrl: './action-or-trigger-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionOrTriggerDropdownComponent {
  @Input({ required: true }) items: ActionBase[] | TriggerBase[] = [];
  @Output() newActionOrTriggerSelected = new EventEmitter<
    ActionBase | TriggerBase
  >();
  @Input({ required: true }) passedFormControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });

  readonly TriggerStrategy = TriggerStrategy;
  readonly noOptionsError = $localize`No options available`;
  readonly selectTriggerError = $localize`Please select a trigger`;
  readonly selectActionError = $localize`Please select an action`;
}
