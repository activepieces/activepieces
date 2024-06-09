import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  DropdownOption,
  DropdownState,
  PropertyType,
} from '@activepieces/pieces-framework';
import {
  DropdownSearchControlComponent,
  UiCommonModule,
} from '@activepieces/ui/common';
import { DynamicInputToggleComponent } from '../dynamic-input-toggle/dynamic-input-toggle.component';
import deepEqual from 'deep-equal';
import { DropdownSelectedValuesPipe } from '../../pipes/dropdown-selected-values.pipe';
import { BehaviorSubject, Observable, startWith, tap } from 'rxjs';
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
  /**Because options are dynamic and they might not be there when the user searches, this helps us show a value */
  selectedItemsCache$ = new BehaviorSubject<DropdownOption<unknown>[]>([]);
  invalidateCache$?: Observable<void>;
  refresh$ = new BehaviorSubject<void>(undefined);
  readonly PropertyType = PropertyType;
  readonly loadingText = $localize`Loading...`;
  constructor(piecetaDataService: PieceMetadataService) {
    const searchControl = new FormControl('', { nonNullable: true });
    super(piecetaDataService, searchControl.valueChanges);
    this.searchControl = searchControl;
  }
  ngOnInit() {
    this.options$ = this.createRefreshers(
      this.refresh$.pipe(startWith(undefined))
    );
    this.invalidateCache$ = this.passedFormControl.valueChanges.pipe(
      tap(() => {
        this.selectedItemsCache$.next([]);
      })
    );
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
  refreshOptions() {
    this.refresh$.next(undefined);
    this.searchControl.setValue('');
  }
}
