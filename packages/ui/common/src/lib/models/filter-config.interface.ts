import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

export interface FilterConfig<T, D> {
  type: 'text' | 'select' | 'date';
  name: string;
  label: string;
  queryParam: string | string[];
  formControl?: FormControl;
  searchControl?: FormControl<string>;
  dateFormGroup?: FormGroup<{
    start: FormControl<Date | null>;
    end: FormControl<Date | null>;
  }>;
  options$?: Observable<T[]>;
  allValues$?: Observable<D[] | undefined>;
  optionLabelKey?: string;
  optionValueKey?: string;
  isMultipleSelect?: boolean;
}
