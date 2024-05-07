import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleFilePickerService,
  UiCommonModule,
} from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import {
  GoogleFilePickerProperty,
  PieceAuthProperty,
  GoogleFilePickerPropertyValueSchema,
} from '@activepieces/pieces-framework';
import { Observable, tap } from 'rxjs';
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
      <ap-button btnSize="small">
        {{ control.value ? changeFileText : selectFileText }}
      </ap-button>
      {{ control.value ? control.value.fileDisplayName : noFileSelectedText }}
    </div>
  `,
})
export class GoogleFilePicerkControlComponent {
  readonly selectFileText = $localize`Select File`;
  readonly changeFileText = $localize`Change File`;
  readonly noFileSelectedText = $localize`No file selected`;
  @Input({ required: true })
  control: FormControl<GoogleFilePickerPropertyValueSchema>;
  @Input({ required: true }) property: GoogleFilePickerProperty<boolean>;
  @Input({ required: true }) authProperty: PieceAuthProperty;
  @Input({ required: true }) connectionId = '';
  pickerOpened$: Observable<GoogleFilePickerPropertyValueSchema | null>;
  constructor(private googleFilePickerService: GoogleFilePickerService) {}
  openPicker() {
    this.pickerOpened$ = this.googleFilePickerService
      .showPicker(this.connectionId)
      .pipe(
        tap((value) => {
          if (value) {
            this.control.setValue(value);
          }
        })
      );
  }
}
