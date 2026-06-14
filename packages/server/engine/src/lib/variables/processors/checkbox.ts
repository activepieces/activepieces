import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (_property, value) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (value?.toLowerCase() === 'true') {
    return true
  }
  if (value?.toLowerCase() === 'false') {
    return false
  }
  return value
}