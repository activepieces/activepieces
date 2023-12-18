import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap, map } from 'rxjs';
import { CodeArtifactControlFullscreenComponent } from './code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { MatTooltip } from '@angular/material/tooltip';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';
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
  implements ControlValueAccessor, OnInit, AfterViewInit
{
  updateComponentValue$: Observable<Partial<SourceCode>>;
  @ViewChild('codeMirror') codeMirror: CodemirrorComponent;
  @ViewChild('tooltip') tooltip: MatTooltip;
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
  }
  ngOnInit(): void {
    this.setupValueListener();
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
      this.codeArtifactForm.patchValue(artifact, { emitEvent: false });
    }
  }

  registerOnChange(change: (val: unknown) => void): void {
    this.onChange = change;
  }
  registerOnTouched(touched: () => void): void {
    this.onTouched = touched;
  }
  showFullscreenEditor() {
    this.fullScreenEditorClosed$ = this.dialogService
      .open(CodeArtifactControlFullscreenComponent, {
        data: {
          codeFilesForm: this.codeArtifactForm,
          readOnly: this.codeEditorOptions.readOnly,
        },
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

  setupValueListener() {
    this.updateComponentValue$ = this.codeArtifactForm.valueChanges.pipe(
      tap((artifact) => {
        this.onChange(artifact);
      })
    );
  }
}
