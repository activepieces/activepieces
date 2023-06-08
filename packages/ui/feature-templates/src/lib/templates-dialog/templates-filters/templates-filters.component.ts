import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormArray,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { Observable, tap } from 'rxjs';

@Component({
  selector: 'app-templates-filters',
  templateUrl: './templates-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TemplatesFiltersComponent,
    },
  ],
})
export class TemplatesFiltersComponent implements OnInit, ControlValueAccessor {
  filtersForm: FormGroup<{ filters: FormArray }> = new FormGroup({
    filters: new FormArray([] as Array<FormControl<boolean>>),
  });
  valueChanges$: Observable<Partial<Array<boolean>>>;
  @Input() filters: Array<string> = [];
  onChange: (val: Array<string>) => void = () => {
    //ignored
  };
  ngOnInit() {
    this.filtersForm.controls.filters = new FormArray(
      this.filters.map(() => new FormControl(false))
    );
    this.valueChanges$ = this.filtersForm.controls.filters.valueChanges.pipe(
      tap((val) => {
        const value = this.filters.filter((_, i) => (val ? val[i] : false));
        this.onChange(value);
      })
    );
  }
  writeValue(): void {
    //ignored
  }
  registerOnChange(fn: (val: Array<string>) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {
    //ignored
  }
  setDisabledState?(): void {
    //ignored
  }
}
