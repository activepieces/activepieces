import { isNil } from "@activepieces/shared";
import { ProcessorFn } from "packages/engine/src/lib/variables/processors";

export const numberProcessor: ProcessorFn = (_property, value) => {
  if (isNil(value)) {
    return value;
  }
  if (value === '') {
    return NaN;
  }
  return Number(value);
}