import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
} from '@angular/core';

import { MatDialogRef } from '@angular/material/dialog';
import { FlowTemplate, TemplateType } from '@activepieces/shared';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  GenericSnackbarTemplateComponent,
  TemplatesService,
} from '@activepieces/ui/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
export type CreateOrUpdateTemplateDialogData = {
  template?: FlowTemplate;
};
@Component({
  selector: 'app-create-or-update-template-dialogue',
  templateUrl: './create-or-update-template-dialogue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateOrUpdateTemplateDialogueComponent {
  loading = false;
  invalidJson = false;
  createTemplate$: Observable<void> | undefined;
  shareTemplateMarkdown = `You can create a template from a flow and share it to your platform users,
   to do that go to a flow you would like to use as a template, click on the arrow down next to its name and select **Export** then use it here`;
  title = $localize`New Template`;
  form: FormGroup<{
    file: FormControl<File | null>;
    name: FormControl<string>;

    blogUrl: FormControl<string>;
    tags: FormControl<string[]>;
  }>;
  constructor(
    private templateService: TemplatesService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateOrUpdateTemplateDialogueComponent>,
    private matSnackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data?: CreateOrUpdateTemplateDialogData
  ) {
    this.form = this.fb.group({
      file: new FormControl<File | null>(null, {
        validators: Validators.required,
      }),

      name: new FormControl('', {
        nonNullable: true,
        validators: Validators.required,
      }),
      blogUrl: new FormControl('', { nonNullable: true }),
      tags: new FormControl<string[]>([], { nonNullable: true }),
    });
    if (data?.template) {
      this.form.patchValue({
        name: data.template.name,
        blogUrl: data.template.blogUrl,
        tags: data.template.tags,
      });
      this.title = $localize`Edit` + ` ${data.template.name}`;
    }
  }

  createOrUpdate() {
    this.form.markAllAsTouched();
    if (this.form.valid) {
      this.loading = true;
      this.readFile();
    }
  }

  readFile() {
    if (this.form.value.file === null || this.form.value.file === undefined) {
      return;
    }
    this.invalidJson = false;
    const reader = new FileReader();
    reader.onload = () => {
      const template: FlowTemplate = JSON.parse(reader.result as string);
      template.name = this.form.getRawValue().name;
      template.template.displayName = this.form.getRawValue().name;
      this.createTemplate$ = this.templateService
        .create({
          ...template,
          type: TemplateType.PLATFORM,
          blogUrl: this.form.value.blogUrl,
          tags: this.form.value.tags,
          id: this.data?.template?.id,
        })
        .pipe(
          tap(() => {
            if (this.data) {
              this.matSnackBar.openFromComponent(
                GenericSnackbarTemplateComponent,
                { data: `<b> ${this.form.value.name}</b> updated` }
              );
            } else {
              this.matSnackBar.openFromComponent(
                GenericSnackbarTemplateComponent,
                { data: `<b> ${this.form.value.name}</b> created` }
              );
            }
            this.dialogRef.close(true);
          }),
          catchError(() => {
            this.invalidJson = true;
            return of({});
          }),
          map(() => void 0)
        );
      this.cd.markForCheck();
    };
    reader.readAsText(this.form.value.file);
  }
}
