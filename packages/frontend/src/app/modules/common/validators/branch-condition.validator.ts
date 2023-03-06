import { AbstractControl, ValidationErrors } from '@angular/forms';
import { BranchCondition, singleValueConditions } from '../../../../../../shared/src';


export function branchConditionValidator(
  control: AbstractControl
): ValidationErrors | null {
    const val: BranchCondition = control.value;
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
