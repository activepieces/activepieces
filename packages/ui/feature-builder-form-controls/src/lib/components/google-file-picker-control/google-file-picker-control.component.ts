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
    <div class="ap-flex ap-gap-2 ap-items-center ap-justify-between ap-mb-2">
      <div>
        {{ property.displayName }}
      </div>
      <ng-content></ng-content>
    </div>
    <div class="ap-flex ap-gap-2 ap-items-center">
      <ap-button
        btnSize="small"
        (buttonClicked)="openPicker()"
        [loading]="isLoadingPickerApi$ | async | defaultTrue"
      >
        {{ control.value ? changeFileText : selectFileText }}
      </ap-button>
      {{ control.value ? control.value.fileDisplayName : noFileSelectedText }}
    </div>
    @if(pickerOpened$ | async) {}
  `,
})
export class GoogleFilePicerkControlComponent {
  readonly selectFileText = $localize`Select File`;
  readonly changeFileText = $localize`Change File`;
  readonly noFileSelectedText = $localize`No file selected`;
  firstTimeSetting = true;
  @Input({ required: true })
  control: FormControl<GoogleFilePickerPropertyValueSchema | undefined>;
  @Input({ required: true }) property: GoogleFilePickerProperty<boolean>;
  @Input({ required: true }) set connectionName(
    val: PieceConnectionDropdownItem['value']
  ) {
    const newConnectionName = this.extractConnectionName(val);
    if (!this.firstTimeSetting && newConnectionName !== this._connectionName) {
      this.control.setValue(undefined);
    }
    this.firstTimeSetting = false;
    this._connectionName = newConnectionName;
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
            debugger;
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
}
