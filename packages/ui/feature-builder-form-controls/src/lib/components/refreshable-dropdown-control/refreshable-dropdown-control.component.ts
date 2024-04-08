import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { DropdownState, PropertyType } from '@activepieces/pieces-framework';
import {
  DropdownSearchControlComponent,
  UiCommonModule,
} from '@activepieces/ui/common';
import { DynamicInputToggleComponent } from '../dynamic-input-toggle/dynamic-input-toggle.component';
import deepEqual from 'deep-equal';
import { DropdownSelectedValuesPipe } from '../../pipes/dropdown-selected-values.pipe';
import { Observable, startWith } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/feature-pieces';
import { DropdownLabelsJoinerPipe } from '../../pipes/dropdown-labels-joiner.pipe';
import { FormControl, UntypedFormControl } from '@angular/forms';
import { RefreshablePropertyCoreControlComponent } from '../refreshable-property-core/refreshable-property-core-control.component';
@Component({
  selector: 'app-refreshable-dropdown-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    DynamicInputToggleComponent,
    DropdownSearchControlComponent,
    DropdownSelectedValuesPipe,
    DropdownLabelsJoinerPipe,
  ],
  templateUrl: './refreshable-dropdown-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RefreshableDropdownControlComponent
  extends RefreshablePropertyCoreControlComponent
  implements OnInit
{
  @Input({ required: true }) passedFormControl: UntypedFormControl;
  searchControl: FormControl<string>;
  options$?: Observable<DropdownState<unknown>>;
  readonly PropertyType = PropertyType;
  constructor(piecetaDataService: PieceMetadataService) {
    const searchControl = new FormControl('', { nonNullable: true });
    super(piecetaDataService, searchControl.valueChanges.pipe(startWith('')));
    this.searchControl = searchControl;
  }
  ngOnInit() {
    this.options$ = this.createRefreshers();
  }
  dropdownCompareWithFunction(opt: unknown, formControlValue: string) {
    return (
      formControlValue !== undefined &&
      deepEqual(opt, formControlValue, { strict: true })
    );
  }
  override refreshersChanged() {
    this.passedFormControl.setValue(undefined);
  }
}
