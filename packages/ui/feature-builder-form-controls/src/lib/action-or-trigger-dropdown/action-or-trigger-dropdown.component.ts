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
import { isTriggerGuardPipe } from '../pipes/is-trigger-guard.pipe';
import { tap } from 'rxjs';

@Component({
  selector: 'app-action-or-trigger-dropdown',
  standalone: true,
  imports: [CommonModule, UiCommonModule, isTriggerGuardPipe],
  templateUrl: './action-or-trigger-dropdown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionOrTriggerDropdownComponent {
  @Input({ required: true }) items: (ActionBase | TriggerBase)[] = [];
  @Input() set value(value: string | undefined) {
    this.dropdownFormControl.setValue(value || '');
  }
  @Output() valueChange = new EventEmitter<ActionBase | TriggerBase>();
  dropdownFormControl = new FormControl('', {
    nonNullable: true,
    validators: Validators.required,
  });
  dropdownValueChanged$ = this.dropdownFormControl.valueChanges.pipe(
    tap((name) => {
      const item = this.items.find((i) => i.name === name);
      if (item) {
        this.valueChange.emit(item);
      }
    })
  );
  readonly TriggerStrategy = TriggerStrategy;
  dropdownCompareFn(
    item: ActionBase | TriggerBase,
    selected: string | undefined
  ) {
    return item.name === selected;
  }
}
