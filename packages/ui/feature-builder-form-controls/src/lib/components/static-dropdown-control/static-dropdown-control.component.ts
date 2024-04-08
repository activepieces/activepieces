import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, UntypedFormControl } from '@angular/forms';
import {
  PropertyType,
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
} from '@activepieces/pieces-framework';
import {
  DropdownSearchControlComponent,
  UiCommonModule,
} from '@activepieces/ui/common';
import { DynamicInputToggleComponent } from '../dynamic-input-toggle/dynamic-input-toggle.component';
import deepEqual from 'deep-equal';
import { DropdownSelectedValuesPipe } from '../../pipes/dropdown-selected-values.pipe';
import { DropdownLabelsJoinerPipe } from '../../pipes/dropdown-labels-joiner.pipe';

@Component({
  selector: 'app-static-dropdown-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    DynamicInputToggleComponent,
    DropdownSearchControlComponent,
    DropdownSelectedValuesPipe,
    DropdownLabelsJoinerPipe,
  ],
  templateUrl: './static-dropdown-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaticDropdownControlComponent {
  @Input({ required: true }) passedFormControl: UntypedFormControl;
  @Input({ required: true }) property:
    | StaticDropdownProperty<unknown, boolean>
    | StaticMultiSelectDropdownProperty<unknown, boolean>;
  searchControl = new FormControl('', { nonNullable: true });
  readonly PropertyType = PropertyType;
  dropdownCompareWithFunction(opt: unknown, formControlValue: string) {
    return (
      formControlValue !== undefined &&
      deepEqual(opt, formControlValue, { strict: true })
    );
  }
}
