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
import { IsTriggerGuardPipe } from '../pipes/is-trigger-guard.pipe';

@Component({
  selector: 'app-action-or-trigger-dropdown',
  standalone: true,
  imports: [CommonModule, UiCommonModule, IsTriggerGuardPipe],
  templateUrl: './action-or-trigger-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionOrTriggerDropdownComponent {
  @Input({ required: true }) items: (ActionBase | TriggerBase)[] = [];
  @Output() valueChange = new EventEmitter<ActionBase | TriggerBase>();
  @Input({ required: true }) passedFormControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  readonly TriggerStrategy = TriggerStrategy;
}
