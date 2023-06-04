import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  debounceTime,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { FlowTemplate, FlowVersion } from '@activepieces/shared';
import { TemplatesService } from '../../service/templates.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'ap-templates-dialog',
  templateUrl: './templates-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesDialogComponent {
  dialogForm: FormGroup<{
    search: FormControl<string>;
    filters: FormControl<string[]>;
    apps: FormControl<string[]>;
  }> = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    filters: new FormControl([] as Array<string>, { nonNullable: true }),
    apps: new FormControl([] as Array<string>, { nonNullable: true }),
  });
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  templates$: Observable<(FlowTemplate & { template: FlowVersion })[]>;
  searchFormControl = new FormControl<string>('');
  filters = ['ChatGPT', 'Content', 'RSS', 'Sales Funnel', 'Notifications'];
  constructor(
    private templatesService: TemplatesService,
    @Inject(MAT_DIALOG_DATA)
    public data: { insideBuilder: boolean }
  ) {
    this.templates$ = this.dialogForm.valueChanges.pipe(
      startWith(() => {
        return {
          search: '',
          filters: [],
          apps: [],
        };
      }),
      tap(() => {
        this.loading$.next(true);
      }),
      debounceTime(300),
      switchMap(() => {
        return this.templatesService.getTemplates(
          this.dialogForm.getRawValue()
        );
      }),
      tap((res) => {
        this.loading$.next(false);
      }),
      shareReplay(1)
    );
  }
  useTemplate(template: FlowTemplate & { template: FlowVersion }) {}
}
