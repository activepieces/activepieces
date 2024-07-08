import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

export interface FilterConfig {
  type: 'text' | 'select';
  name: string;
  label: string;
  formControl: FormControl;
  searchControl?: FormControl;
  options?: Observable<any[]>; // TODO add type
  allValues?: any; // TODO add type
  optionLabelKey?: string;
  optionValueKey?: string;
}
