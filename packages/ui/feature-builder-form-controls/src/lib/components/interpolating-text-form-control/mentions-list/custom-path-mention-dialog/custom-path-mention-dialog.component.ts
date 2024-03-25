import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { keysWithinPath } from '../../utils';
import { MentionListItem } from '@activepieces/ui/common';

export interface CustomPathMentionDialogData {
  stepDisplayName: string;
  defaultValue: string;
  placeHolder: string;
  dialogTitle: string;
  entityName: string;
  stepName: string;
}

@Component({
  templateUrl: './custom-path-mention-dialog.component.html',
})
export class CustomPathMentionDialogComponent implements OnInit {
  pathFormGroup: FormGroup<{ path: FormControl<string> }>;
  constructor(
    private formBuilder: FormBuilder,
    @Inject(MAT_DIALOG_DATA)
    public data: CustomPathMentionDialogData,
    private dialogRef: MatDialogRef<CustomPathMentionDialogComponent>
  ) {}
  ngOnInit(): void {
    const pathRegex = `${this.data.stepName}(\\[([0-9]|'.+'|".+")+\\])*((\\.[a-zA-Z_$][a-zA-Z_$0-9]*)(\\[([0-9]|'.+'|".+"])+\\])*)*`;
    this.pathFormGroup = this.formBuilder.group({
      path: new FormControl<string>(this.data.defaultValue, {
        validators: [
          Validators.pattern(pathRegex),
          pathStartValidator(this.data.stepName),
        ],
        nonNullable: true,
      }),
    });
  }
  emitCustomPathMention() {
    if (this.pathFormGroup.valid) {
      const customPath = `{{${this.pathFormGroup.controls.path.value!}}}`;
      const triggerPathWithoutInterpolationDenotation = customPath.slice(
        2,
        customPath.length - 2
      );

      const mentionText = [
        this.data.stepDisplayName,
        ...keysWithinPath(triggerPathWithoutInterpolationDenotation).slice(1),
      ].join(' ');
      const mentionItem: MentionListItem = {
        value: customPath,
        label: mentionText,
      };
      this.dialogRef.close(mentionItem);
    }
  }
}

function pathStartValidator(stepName: string) {
  const fn = (control: AbstractControl) => {
    const val: string = control.value;
    if (val.startsWith(stepName)) return null;
    else {
      return { 'invalid-path': true };
    }
  };
  return fn;
}
