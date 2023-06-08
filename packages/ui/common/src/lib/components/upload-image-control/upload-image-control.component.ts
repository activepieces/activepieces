import { Component, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ap-file-upload',
  templateUrl: './upload-image-control.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: UploadImageControlComponent,
      multi: true,
    },
  ],
  styleUrls: ['./upload-image-control.component.scss'],
})
export class UploadImageControlComponent implements ControlValueAccessor {
  onChange!: (file: File | null) => void;
  @Input() public file: File | null = null;
  @Input() loadedImageUrl = '';
  uploadButtonHovered = false;
  showError = false;
  @Input() extensions: string[] = ['.json'];
  @Input() fileMaxSize = 90000;
  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file = event && event.item(0);
    if (file) {
      this.fileDropped(file);
    }
  }

  fileDropped(file: any) {
    this.showError = !this.validateFileType(file);
    if (!this.showError) {
      this.onChange(file);
      this.file = file;
      this.readImage();
    } else {
      this.onChange(null);
      this.file = null;
    }
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

  validateFileType(file: File) {
    if (file) {
      const parts = file.name.split('.');
      if (parts.length === 0) {
        return false;
      }
      const extension = '.' + parts[parts.length - 1].toLowerCase();
      if (
        !this.extensions.find(
          (allowedExtension) =>
            allowedExtension.toLocaleLowerCase() ==
            extension.toLocaleLowerCase()
        )
      ) {
        return false;
      }
      return file.size <= this.fileMaxSize;
    }
    return false;
  }

  readImage() {
    const reader = new FileReader();
    reader.onload = () => {
      this.loadedImageUrl = reader.result as string;
    };
    if (this.file) reader.readAsDataURL(this.file);
  }

  get cloudSvgClass() {
    if (this.uploadButtonHovered) {
      return 'cloud-svg cloud-svg-hover';
    } else {
      return 'cloud-svg';
    }
  }
}
