import {
  Component,
  DoCheck,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Optional,
  Self,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';

@Component({
  selector: 'ap-file-upload',
  templateUrl: './upload-file-control.component.html',
  providers: [
    { provide: MatFormFieldControl, useExisting: UploadFileControlComponent },
  ],
  styleUrls: ['./upload-file-control.component.scss'],
})
export class UploadFileControlComponent
  implements
    MatFormFieldControl<File>,
    OnDestroy,
    ControlValueAccessor,
    DoCheck
{
  public get ngControl(): NgControl {
    return this._ngControl;
  }
  public set ngControl(value: NgControl) {
    this._ngControl = value;
  }
  value: File | null;
  stateChanges: Subject<void> = new Subject();
  static nextId = 0;
  @HostBinding()
  id = `file-input-${UploadFileControlComponent.nextId++}`;
  placeholder: string;
  focused = false;
  empty: boolean;
  shouldLabelFloat: true;
  required: boolean;
  disabled: boolean;
  errorState = true;
  controlType?: string | undefined;
  autofilled?: boolean | undefined;
  userAriaDescribedBy?: string | undefined;
  @Input() loadedImageUrl = '';
  @Input() extensions: string[] = ['.json'];
  @Input() fileMaxSize = 90000;
  @Input() placeHolder = 'Template.json';
  @Input() label = 'File';
  touched = false;
  onTouched = () => {
    //ignore
  };
  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file = event && event.item(0);
    if (file) {
      this.fileDropped(file);
    }
  }
  constructor(
    @Optional()
    @Self()
    private _ngControl: NgControl,
    @Optional() private _parentForm: NgForm,
    @Optional() private _parentFormGroup: FormGroupDirective
  ) {
    if (this.ngControl != null) {
      // Setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }
  }
  setDescribedByIds(ids: string[]): void {
    // console.log(ids);
  }
  onContainerClick(event: MouseEvent): void {
    // console.log(event);
  }
  onChange: (file: File | null) => void = (file: File | null) => {
    //ignore
  };
  fileDropped(file: File) {
    this.value = file;
    this.onChange(file);
    this.onTouched();
    this.stateChanges?.next();
  }

  writeValue(file: File) {
    this.value = file;
    this.stateChanges.next();
  }

  registerOnChange(fn: (file: File | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  ngOnDestroy(): void {
    this.stateChanges.complete();
  }
  ngDoCheck() {
    if (this.ngControl) {
      this.updateErrorState();
      this.touched = this.ngControl.touched || false;
    }
  }
  private updateErrorState() {
    const parent = this._parentFormGroup || this._parentForm;

    const oldState = this.errorState;
    const newState =
      this.ngControl?.invalid && (this.touched || parent.submitted);

    if (oldState !== newState) {
      this.errorState = newState || false;
      this.stateChanges.next();
    }
  }
}
