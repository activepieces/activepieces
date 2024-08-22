import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { ProcessorFn } from './types'

export const dateTimeProcessor: ProcessorFn = (_property, value) => {
    dayjs.extend(utc)
    dayjs.extend(timezone)
    const dateTimeString = value
    try {
        if (!dateTimeString) throw Error('Undefined input')
        return dayjs.tz(dateTimeString, 'UTC').toISOString()
    }
    catch (error) {
        console.error(error)
        return undefined
    }
}