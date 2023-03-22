import { Component, Inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import {  MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MentionListItem, replaceArrayNotationsWithSpaces, replaceDotsWithSpaces } from '../../utils';

const pathRegex = /\$\{trigger((\.[a-zA-Z_$][a-zA-Z_$0-9]*)(\[([0-9])+\])*)*\}/;
export interface CustomPathMentionDialogData {
  stepDisplayName: string;
  defaultValue: string;
  placeHolder: string;
  dialogTitle:string;
  entityName:string;
}

@Component({
  templateUrl: './custom-path-mention-dialog.component.html'
})
export class CustomPathMentionDialogComponent {
  pathFormGroup: FormGroup<{ path: FormControl<string> }>;
  constructor(
    formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: CustomPathMentionDialogData,
    private dialogRef: MatDialogRef<CustomPathMentionDialogComponent>,
  ) {
    this.pathFormGroup = formBuilder.group({
      path: new FormControl<string>('${trigger.body}', {
        validators: Validators.pattern(pathRegex),
        nonNullable: true,
      }),
    });
  }
  emitCustomPathMention() {
    if (this.pathFormGroup.valid) {
      const triggerPath = this.pathFormGroup.controls.path.value!;
      const triggerPathWithoutInterpolationDenotation = triggerPath.slice(
        2,
        triggerPath.length - 1
      );
      const mentionText = replaceArrayNotationsWithSpaces(
        replaceDotsWithSpaces(
          this.adjustItemPath(triggerPathWithoutInterpolationDenotation)
        )
      );
      const mentionItem: MentionListItem = {
        value: this.pathFormGroup.controls.path.value!,
        label: mentionText,
      };
      this.dialogRef.close(mentionItem);
    }
  }
  adjustItemPath(triggerPathWithoutInterpolationDenotation: string): string {
    const triggerDisplayName = this.data.stepDisplayName;
    return [
      triggerDisplayName,
      ...triggerPathWithoutInterpolationDenotation.split('.').slice(1),
    ].join('.');
  }
}
