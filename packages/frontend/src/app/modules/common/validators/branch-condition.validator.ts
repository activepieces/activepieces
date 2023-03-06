import { AbstractControl, ValidationErrors } from '@angular/forms';
import {  BranchCondition, singleValueConditions } from '@activepieces/shared';



export function branchConditionValidator(
  control: AbstractControl
): ValidationErrors | null {
    const val: BranchCondition = control.value;
    return validateCondition(val);
 
}

export function branchConditionGroupValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const val: BranchCondition[] = control.value;
    const hasError = val.some((c=>{
        return !!validateCondition(c);
    }))
    if(hasError)
    {
        return {invalid:true};
    }
    return null;
    
  }
  function validateCondition(val:BranchCondition)
  {
    if(!val.firstValue)
    {
        return {invalidFirstValue:true}
    }
    if(!val.operator)
    {
        return { invalidOperator:true};
    }
    if(!singleValueConditions.find(o=>o===val.operator) && !val['secondValue'])
    {
        return {invalidSecondValue:true};
    }
    return null;
  }