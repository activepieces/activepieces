import {
  AfterViewInit,
  Component,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap, map, skip } from 'rxjs';
import {
  CodeArtifactControlFullscreenComponent,
  CodeArtifactControlFullscreenData,
} from './code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { MatTooltip } from '@angular/material/tooltip';
import { SourceCode } from '@activepieces/shared';

export interface CodeArtifactForm {
  code: FormControl<string>;
  packageJson: FormControl<string>;
}

@Component({
  selector: 'app-code-artifact-form-control',
  templateUrl: './code-artifact-form-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CodeArtifactFormControlComponent,
    },
  ],
})
export class CodeArtifactFormControlComponent
  implements ControlValueAccessor, AfterViewInit
{
  updateComponentValue$: Observable<Partial<SourceCode>>;
  @ViewChild('tooltip') tooltip: MatTooltip;
  @Output() openCodeWriterDialog = new EventEmitter<boolean>();
  hideDelayForFullscreenTooltip = 2000;
  codeArtifactForm: FormGroup<CodeArtifactForm>;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'apTheme',
    language: 'typescript',
    readOnly: false,
    automaticLayout: true,
  };
  fullScreenEditorClosed$: Observable<void>;
  constructor(
    private formBuilder: FormBuilder,
    private dialogService: MatDialog
  ) {
    this.codeArtifactForm = this.formBuilder.group({
      packageJson: new FormControl('', { nonNullable: true }),
      code: new FormControl('', { nonNullable: true }),
    });
    this.updateComponentValue$ = this.codeArtifactForm.valueChanges.pipe(
      skip(1),
      tap((artifact) => {
        this.onChange(artifact);
      })
    );
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.tooltip.show();
      this.hideDelayForFullscreenTooltip = 0;
    }, 100);
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.codeArtifactForm.disable();
      this.codeEditorOptions.readOnly = true;
    }
  }
  onChange: (val: unknown) => void = (val) => {
    val;
    //ignored
  };
  onTouched: () => void = () => {
    //ignored
  };

  writeValue(artifact: SourceCode): void {
    if (artifact && (artifact.code || artifact.packageJson)) {
      this.codeArtifactForm.setValue(artifact, { emitEvent: false });
    }
  }

  registerOnChange(change: (val: unknown) => void): void {
    this.onChange = change;
  }
  registerOnTouched(touched: () => void): void {
    this.onTouched = touched;
  }
  showFullscreenEditor() {
    const data: CodeArtifactControlFullscreenData = {
      codeFilesForm: this.codeArtifactForm,
      readOnly: this.codeEditorOptions.readOnly,
      openCodeWriterDialog$: this.openCodeWriterDialog,
    };
    this.fullScreenEditorClosed$ = this.dialogService
      .open(CodeArtifactControlFullscreenComponent, {
        data,
        panelClass: 'fullscreen-dialog',
      })
      .beforeClosed()
      .pipe(
        tap(() => {
          this.reinitialiseEditor();
        }),
        map(() => void 0)
      );
  }
  /**Check ngx-monaco-editor-v2 code, you will see the editor gets reinitialised once the options are changed, no public api to do that otherwise. */
  private reinitialiseEditor() {
    this.codeEditorOptions = JSON.parse(JSON.stringify(this.codeEditorOptions));
  }
}
