import {
  Component,
  DoCheck,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  Optional,
  Self,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
} from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { coerceBooleanProperty, BooleanInput } from '@angular/cdk/coercion';
@Component({
  selector: 'ap-file-upload',
  templateUrl: './upload-file-control.component.html',
  providers: [
    { provide: MatFormFieldControl, useExisting: UploadFileControlComponent },
  ],
  styleUrls: ['./upload-file-control.component.scss'],
})
export class UploadFileControlComponent
  implements OnDestroy, ControlValueAccessor, DoCheck
{
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
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
  get empty(): boolean {
    return !this.value;
  }
  @HostBinding('class.floated')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }
  @Input()
  get required() {
    return this._required;
  }
  set required(req: BooleanInput) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }
  private _required = false;
  disabled: boolean;
  errorState = true;
  controlType?: string | undefined;
  autofilled?: boolean | undefined;
  userAriaDescribedBy?: string | undefined;
  @Input() extensions: string[] = ['.json'];
  @Input() fileMaxSize = 90000;
  @Input() placeHolder = 'Template.json';
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
      this.touched = this.ngControl.touched || false;
      this.updateErrorState();
    }
  }
  private updateErrorState() {
    const parent = this._parentFormGroup || this._parentForm;

    const oldState = this.errorState;
    const newState =
      this.ngControl?.invalid && (this.touched || parent?.submitted);

    if (oldState !== newState) {
      this.errorState = newState || false;
      this.stateChanges.next();
    }
    console.log(this.ngControl?.invalid);
  }
}
