import { Component, HostListener, Input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'ap-file-upload',
  templateUrl: './upload-file-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UploadImageControlComponent,
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: UploadImageControlComponent,
      multi: true,
    },
  ],
  styleUrls: ['./upload-file-control.component.scss'],
})
export class UploadImageControlComponent implements ControlValueAccessor {
  @Input() public file: File | null = null;
  @Input() loadedImageUrl = '';
  @Input() extensions: string[] = ['.json'];
  @Input() fileMaxSize = 90000;
  @Input() placeHolder = 'Template.json';
  @Input() label = 'File';
  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file = event && event.item(0);
    if (file) {
      this.fileDropped(file);
    }
  }
  onChange: (file: File | null) => void = (file: File | null) => {
    //ignore
  };
  fileDropped(file: File) {
    if (this.validateFileType(file) === null) {
      this.file = file;
      this.onChange(file);
    } else {
      this.onChange(null);
      this.file = null;
    }
  }
  validate() {
    const err = this.validateFileType(this.file);
    if (err) {
      return err;
    }
    return null;
  }
  writeValue(file: File) {
    this.file = file;
  }

  registerOnChange(fn: (file: File | null) => void) {
    this.onChange = fn;
  }

  registerOnTouched() {
    // ignored
  }

  validateFileType(file: File | null): Record<string, boolean> | null {
    if (file) {
      const parts = file.name.split('.');
      if (parts.length === 0) {
        return { emptyFile: true };
      }
      const extension = '.' + parts[parts.length - 1].toLowerCase();
      if (
        !this.extensions.find(
          (allowedExtension) =>
            allowedExtension.toLocaleLowerCase() ==
            extension.toLocaleLowerCase()
        )
      ) {
        return { invalidExtenstion: true };
      }
      if (file.size > this.fileMaxSize) {
        return { sizeLimit: true };
      }
      return null;
    }
    return { emptyFile: true };
  }
}
