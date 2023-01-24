import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormBuilder,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable, tap } from 'rxjs';
import { Artifact } from 'packages/frontend/src/app/modules/flow-builder/model/artifact.interface';
import { CodeArtifactControlFullscreenComponent } from './code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { MatTooltip } from '@angular/material/tooltip';

export interface CodeArtifactForm {
  content: FormControl<string>;
  package: FormControl<string>;
}

@Component({
  selector: 'app-code-artifact-form-control',
  templateUrl: './code-artifact-form-control.component.html',
  styleUrls: ['./code-artifact-form-control.component.css'],
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
  @ViewChild('tooltip') tooltip: MatTooltip;
  hideDelayForFullscreenTooltip = 2000;
  codeArtifactForm: FormGroup<CodeArtifactForm>;
  codeEditorOptions = {
    lineNumbers: true,
    lineWrapping: true,
    theme: 'lucario',
    readOnly: '',
    mode: 'javascript',
  };
  constructor(
    private formBuilder: FormBuilder,
    private dialogService: MatDialog
  ) {
    this.codeArtifactForm = this.formBuilder.group({
      content: new FormControl('', { nonNullable: true }),
      package: new FormControl('', { nonNullable: true }),
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
      this.codeEditorOptions.readOnly = 'nocursor';
    }
  }
  updateComponentValue$: Observable<any>;
  onChange = (val) => {};
  onTouched = () => {};

  writeValue(artifact: Artifact): void {
    if (artifact && (artifact.content || artifact.package)) {
      this.codeArtifactForm.patchValue(artifact, { emitEvent: false });
    }
  }

  registerOnChange(change: any): void {
    this.onChange = change;
  }
  registerOnTouched(touched: any): void {
    this.onTouched = touched;
  }
  showFullscreenEditor() {
    this.dialogService.open(CodeArtifactControlFullscreenComponent, {
      data: {
        codeFilesForm: this.codeArtifactForm,
        readonly: this.codeEditorOptions.readOnly === 'nocursor',
      },
      panelClass: 'fullscreen-dialog',
    });
  }

  setupValueListener() {
    this.updateComponentValue$ = this.codeArtifactForm.valueChanges.pipe(
      tap((artifact) => {
        this.onChange(artifact);
      })
    );
  }
}
