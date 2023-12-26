import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';

import { MatDialogRef } from '@angular/material/dialog';
import { FlowTemplate, TemplateType } from '@activepieces/shared';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { TemplatesService } from '@activepieces/ui/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-create-template-dialogue',
  templateUrl: './create-template-dialogue.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateTemplateDialogueComponent {
  loading = false;
  invalidJson = false;
  createTemplate$: Observable<void> | undefined;
  shareTemplateMarkdown = `You can create a template from a flow and share it to your platform users,
   to do that go to a flow you would like to use as a template, click on the chevron next to its name and select **Export** then use it here`;
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
    private dialogRef: MatDialogRef<CreateTemplateDialogueComponent>
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
  }

  createTemplate() {
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
        })
        .pipe(
          tap(() => {
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
