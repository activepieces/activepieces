import { Pipe, PipeTransform } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PropertyType } from '@activepieces/pieces-framework';
import { Observable, map } from 'rxjs';

@Pipe({
  name: 'extractControlErrorMessage',
  pure: true,
  standalone:true
})
export class ExtractControlErrorMessage implements PipeTransform {
  transform(
    value: FormControl,
    propertyName:string
  ): Observable<string> {
    return value.valueChanges.pipe(map(()=>{
        if(value.invalid && value.hasError('required')){
            return `${propertyName} is required`
        }
        else if(value.invalid)
        {
            return `${propertyName} is invalid`
        }
        return '';
    }))
  }
}
