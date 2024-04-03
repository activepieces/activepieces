import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { yamlEditorOptionsMonaco } from '../../../utils/consts';
export type YamlViewDialogData = {
  title: string;
  content: string;
};

@Component({
  selector: 'ap-yaml-view-dialog',
  templateUrl: './yaml-view-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YamlViewDialogComponent {
  data: YamlViewDialogData;
  readonly yamlEditorOptionsMonaco = yamlEditorOptionsMonaco;
  yamlFormControl: FormControl<unknown>;
  constructor(@Inject(MAT_DIALOG_DATA) dialogData: YamlViewDialogData) {
    this.data = dialogData;
    this.yamlFormControl = new FormControl(dialogData.content);
  }
}
