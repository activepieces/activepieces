import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
  take,
} from 'rxjs';
import { FlowTemplate, TelemetryEventName } from '@activepieces/shared';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TelemetryService, TemplatesService } from '@activepieces/ui/common';
import { MatTabGroup } from '@angular/material/tabs';

export interface TemplateDialogData {
  insideBuilder: boolean;
  showStartFromScratch?: boolean;
}
type tabsNames = 'all ideas' | 'featured';
const START_FROM_SCRATCH = 'Start from scratch';
export interface TemplateDialogClosingResult {
  template: FlowTemplate | typeof START_FROM_SCRATCH;
  activeTab: tabsNames;
}

@Component({
  selector: 'app-templates-dialog',
  templateUrl: './templates-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesDialogComponent {
  @ViewChild(MatTabGroup) matTabGroup!: MatTabGroup;
  descriptionTemplate$: Subject<FlowTemplate | undefined> = new Subject();
  readonly ANIMATION_DURATION = 500;
  dialogForm: FormGroup<{
    search: FormControl<string>;
    tags: FormControl<string[]>;
    pieces: FormControl<string[]>;
  }> = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    tags: new FormControl([] as Array<string>, { nonNullable: true }),
    pieces: new FormControl([] as Array<string>, { nonNullable: true }),
  });
  loading$: BehaviorSubject<boolean> = new BehaviorSubject(true);
  templates$: Observable<FlowTemplate[]>;
  searchFormControl = new FormControl<string>('');
  filters$: Observable<string[]>;
  constructor(
    private templatesService: TemplatesService,
    private dialogRef: MatDialogRef<TemplatesDialogComponent>,
    private telemetryService: TelemetryService,
    @Inject(MAT_DIALOG_DATA)
    public data?: TemplateDialogData
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
      debounceTime(1000),
      switchMap(() => {
        this.telemetryService.capture({
          name: TelemetryEventName.TEMPLATE_SEARCH,
          payload: this.dialogForm.getRawValue(),
        });
        return this.templatesService.list(this.dialogForm.getRawValue());
      }),
      tap(() => {
        this.loading$.next(false);
      }),
      shareReplay(1)
    );
    this.filters$ = this.templates$.pipe(
      take(1),
      map((templates) => {
        const tags = templates.flatMap((template) => template.tags);
        const uniqueTags = Array.from(new Set(tags));
        const sortedTags = uniqueTags.sort();
        return sortedTags.filter((tag) => tag !== '');
      })
    );
  }
  useTemplate(template: FlowTemplate, tab: tabsNames) {
    const result: TemplateDialogClosingResult = {
      template,
      activeTab: tab,
    };
    this.dialogRef.close(result);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  startFromScratch() {
    const result: TemplateDialogClosingResult = {
      template: START_FROM_SCRATCH,
      activeTab: 'all ideas',
    };
    this.dialogRef.close(result);
  }
  showTemplateDescription(template: FlowTemplate) {
    this.matTabGroup.selectedIndex = 1;
    this.descriptionTemplate$.next(template);
  }
  backToTemplates() {
    this.matTabGroup.selectedIndex = 0;
    setTimeout(() => {
      this.descriptionTemplate$.next(undefined);
    }, this.ANIMATION_DURATION);
  }
}
