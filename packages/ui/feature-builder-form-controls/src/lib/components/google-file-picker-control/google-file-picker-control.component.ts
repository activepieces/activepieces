import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleFilePickerService,
  PieceConnectionDropdownItem,
  UiCommonModule,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  GoogleFilePickerProperty,
  GoogleFilePickerPropertyValueSchema,
} from '@activepieces/pieces-framework';
import { Observable, map, tap } from 'rxjs';
@Component({
  selector: 'app-google-file-picker-control',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field class="ap-w-full" subscriptSizing="dynamic">
      <mat-label i18n>{{ property.displayName }}</mat-label>
      <input
        class="!ap-hidden"
        matInput
        [formControl]="control"
        [readonly]="true"
        (click)="openPicker()"
      />
      <input
        class="ap-cursor-pointer"
        matInput
        [value]="control.value?.fileDisplayName || ''"
        [readonly]="true"
        (click)="openPicker()"
      />
      <div matSuffix class="ap-flex ap-gap-2">
        @if(property.required || control.value === undefined) {
        <ap-icon-button
          [height]="25"
          [width]="25"
          iconFilename="google-drive.svg"
          (buttonClicked)="openPicker()"
        ></ap-icon-button>
        } @if( !property.required && control.value !== undefined) {
        <ap-icon-button
          [height]="15"
          [width]="15"
          iconFilename="close.svg"
          (buttonClicked)="unset()"
        ></ap-icon-button>
        }
      </div>
    </mat-form-field>

    @if(pickerOpened$ | async) {} @if(connectionNameChanged$ | async){}
  `,
})
export class GoogleFilePicerkControlComponent {
  readonly selectFileText = $localize`Select File`;
  readonly changeFileText = $localize`Change File`;
  readonly noFileSelectedText = $localize`No file selected`;
  connectionNameChanged$: Observable<
    PieceConnectionDropdownItem['value'] | undefined
  >;
  firstTimeSetting = true;
  @Input({ required: true })
  control: FormControl<GoogleFilePickerPropertyValueSchema | undefined>;
  @Input({ required: true }) property: GoogleFilePickerProperty<boolean>;
  @Input({ required: true }) set connectionControl(
    ctrl: FormControl<PieceConnectionDropdownItem['value'] | undefined>
  ) {
    this.connectionNameChanged$ = ctrl.valueChanges.pipe(
      tap((val) => {
        this._connectionName = val ? this.extractConnectionName(val) : '';
        this.control.setValue(undefined);
      })
    );
    this._connectionName = ctrl.value
      ? this.extractConnectionName(ctrl.value)
      : '';
  }
  _connectionName = '';
  pickerOpened$: Observable<GoogleFilePickerPropertyValueSchema | null>;
  isLoadingPickerApi$: Observable<boolean>;
  constructor(
    private googleFilePickerService: GoogleFilePickerService,
    private snackbar: MatSnackBar
  ) {
    this.isLoadingPickerApi$ = this.googleFilePickerService
      .getIsPickerLoaded$()
      .pipe(map((res) => !res));
  }
  openPicker() {
    if (this._connectionName) {
      this.pickerOpened$ = this.googleFilePickerService
        .showPicker(this._connectionName, this.property.viewId as any)
        .pipe(
          tap((value) => {
            if (value) {
              this.control.setValue(value);
            }
          })
        );
    } else {
      this.snackbar.open($localize`Please select a connection first`);
    }
  }
  private extractConnectionName(val: PieceConnectionDropdownItem['value']) {
    const regex = /\{\{\s*connections\['(.*?)'\]\}\s*\}/;
    const match = val.match(regex);
    if (match) {
      return match[1];
    }
    console.error('Activepieces: Could not extract connection name');
    return '';
  }

  unset() {
    this.control.setValue(undefined);
  }
}
