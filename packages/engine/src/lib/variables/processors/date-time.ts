import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { ProcessorFn } from './types'
import { EngineGenericError } from '../../helper/execution-errors'

export const dateTimeProcessor: ProcessorFn = (_property, value) => {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    const dateTimeString = value
    try {
        if (!dateTimeString) {
            throw new EngineGenericError('DateTimeStringUndefinedError', 'Date time string is undefined')
        }
        return dayjs.tz(dateTimeString, 'UTC').toISOString()
    }
    catch (error) {
        console.error(error)
        return undefined
    }
}