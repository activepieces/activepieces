import { ProcessorFn } from './types'

export const checkboxProcessor: ProcessorFn = (_property, value) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string' && value.toLowerCase() === 'true') {
    return true
  }
  if (typeof value === 'string' && value.toLowerCase() === 'false') {
    return false
  }
  return value
}