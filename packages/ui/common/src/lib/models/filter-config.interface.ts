import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

export interface FilterConfig<T, D> {
  type: 'text' | 'select';
  name: string;
  label: string;
  formControl: FormControl;
  searchControl?: FormControl;
  options?: Observable<T[]>;
  allValues?: Observable<D[] | undefined>;
  optionLabelKey?: string;
  optionValueKey?: string;
}
