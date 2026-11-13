import { OutputSchema } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateBmiAction } from '../src/lib/actions/calculate/calculate-bmi';
import { calculateGeoDistanceAction } from '../src/lib/actions/calculate/calculate-geo-distance';
import { convertCsvToJsonAction } from '../src/lib/actions/convert/convert-csv-to-json';
import { convertCurrencyAction } from '../src/lib/actions/convert/convert-currency';
import { convertIpToGeoAction } from '../src/lib/actions/convert/convert-ip-to-geo';
import { convertIsoToNationAction } from '../src/lib/actions/convert/convert-iso-to-nation';
import { convertNationToIsoAction } from '../src/lib/actions/convert/convert-nation-to-iso';
import { convertTimezoneWithDateAction } from '../src/lib/actions/date-and-time/convert-timezone-with-date';
import { convertTimezoneWithUnixTimestampAction } from '../src/lib/actions/date-and-time/convert-timezone-with-unix-timestamp';
import { currentMonthAction } from '../src/lib/actions/date-and-time/current-month';
import { currentWeekAction } from '../src/lib/actions/date-and-time/current-week';
import { currentWeekFromDateAction } from '../src/lib/actions/date-and-time/current-week-from-date';
import { currentWeekFromUnixTimestampAction } from '../src/lib/actions/date-and-time/current-week-from-unix-timestamp';
import { currentWeekWithWeekNumberAction } from '../src/lib/actions/date-and-time/current-week-with-week-number';
import { currentWeekWithWeekNumberAndYearAction } from '../src/lib/actions/date-and-time/current-week-with-week-number-and-year';
import { getHolidaysAction } from '../src/lib/actions/date-and-time/get-holidays';
import { isWeekendAction } from '../src/lib/actions/date-and-time/is-weekend';
import { isWeekendWithFormatAction } from '../src/lib/actions/date-and-time/is-weekend-with-format';
import { specificMonthAndYearAction } from '../src/lib/actions/date-and-time/specific-month-and-year';
import { getANumberAction } from '../src/lib/actions/generate/get-a-number';
import { getRandomCityAction } from '../src/lib/actions/generate/get-random-city';
import { getRandomNameAction } from '../src/lib/actions/generate/get-random-name';
import { getRandomNameWithGenderAction } from '../src/lib/actions/generate/get-random-name-with-gender';
import { runAction, TestAction } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: {
            sendRequest: (...args: unknown[]) => sendRequest(...args),
        },
    };
});

beforeEach(() => {
    sendRequest.mockReset();
});

const calendarWeekResponse = { workingDate: '20.01.2025', weekNumber: 4, firstDayOfWeek: '20.01.2025', lastDayOfWeek: '26.01.2025' };
const monthResponse = {
    daysInMonth: 28,
    firstDayOfMonth: '01.02.2025',
    lastDayOfMonth: '28.02.2025',
    lastWorkdayOfMonth: '28.02.2025',
    workdays: ['03.02.2025'],
    workdaysReversed: ['03.02.2025'],
    saturdays: ['01.02.2025'],
    sundays: ['02.02.2025'],
};
const isWeekendResponse = { isWeekend: false, weekDay: 'Monday', dayNumber: 1 };
const switchTimeZoneResponse = { convertedTime: '20.01.2025 15:30', timeZone: 'Europe/Berlin' };
const nameResponse = {
    firstName: 'Ada',
    middleName: 'Byron',
    lastName: 'Lovelace',
    completeName: 'Ada Lovelace',
    completeNameWithMiddleName: 'Ada Byron Lovelace',
};

const objectCases: ObjectCase[] = [
    { action: currentWeekAction, props: {}, response: calendarWeekResponse },
    { action: currentWeekFromDateAction, props: { date: '20.01.2025', dateFormat: 'DD.MM.YYYY' }, response: calendarWeekResponse },
    { action: currentWeekFromUnixTimestampAction, props: { unixTimestamp: 1737331200 }, response: calendarWeekResponse },
    { action: currentWeekWithWeekNumberAction, props: { weekNumber: 4 }, response: calendarWeekResponse },
    { action: currentWeekWithWeekNumberAndYearAction, props: { weekNumber: 4, year: 2025 }, response: calendarWeekResponse },
    { action: currentMonthAction, props: {}, response: monthResponse },
    { action: specificMonthAndYearAction, props: { month: 2, year: 2025 }, response: monthResponse },
    { action: isWeekendAction, props: { date: '2025-01-20' }, response: isWeekendResponse },
    { action: isWeekendWithFormatAction, props: { date: '20.01.2025', dateFormat: 'DD.MM.YYYY' }, response: isWeekendResponse },
    {
        action: convertTimezoneWithDateAction,
        props: { inputTime: '2025-01-20 14:30', inputTimeZone: 'UTC', destinationTimeZone: 'Europe/Berlin' },
        response: switchTimeZoneResponse,
    },
    {
        action: convertTimezoneWithUnixTimestampAction,
        props: { inputTime: 1737331200, destinationTimeZone: 'Europe/Berlin' },
        response: switchTimeZoneResponse,
    },
    {
        action: calculateBmiAction,
        props: { weight: 80, height: 180 },
        response: { bmi: 24.69, bmiClassification: 'normal', dbw: 72, kcal: 2160, nutrients: { carbohydrates: 324, protein: 81, fat: 60 } },
    },
    {
        action: calculateGeoDistanceAction,
        props: { startPoint: 'Berlin', endPoint: 'Munich', mode: 'driving' },
        response: { distanceInKM: 584, duration: { hours: 5, minutes: 40 } },
    },
    {
        action: convertCurrencyAction,
        props: { amount: 10, sourceCurrency: 'usd', targetCurrency: 'eur' },
        response: { oldAmount: 10, oldCurrency: 'USD', convertedAmount: 9.2, currency: 'EUR', dataDate: '20.01.2025' },
    },
    {
        action: convertIpToGeoAction,
        props: { ip: '87.155.190.147' },
        response: {
            status: 'success',
            country: 'Germany',
            countryCode: 'DE',
            region: 'BE',
            regionName: 'Berlin',
            city: 'Berlin',
            zip: '10115',
            lat: 52.52,
            lon: 13.4,
            timezone: 'Europe/Berlin',
            isp: 'Deutsche Telekom AG',
            org: 'Deutsche Telekom AG',
            as: 'AS3320 Deutsche Telekom AG',
            query: '87.155.190.147',
        },
    },
    { action: convertIsoToNationAction, props: { iso: 'DE' }, response: { iso: 'DE', nation: 'Germany' } },
    { action: convertNationToIsoAction, props: { nation: 'Germany' }, response: { iso: 'DE', nation: 'Germany' } },
    { action: getANumberAction, props: { min: 1, max: 10, type: 'integer' }, response: { randomNumber: 7 } },
    { action: getRandomCityAction, props: {}, response: { city: 'Springfield', country: 'Freedonia' } },
    { action: getRandomNameAction, props: {}, response: nameResponse },
    { action: getRandomNameWithGenderAction, props: { gender: 'female' }, response: nameResponse },
];

describe('date, calculate, convert and generate output schemas', () => {
    it.each(objectCases.map((testCase) => [testCase.action.name, testCase]))(
        '%s schema keys match the run() output keys',
        async (_, testCase) => {
            sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: testCase.response });

            const result = await runAction({ action: testCase.action, propsValue: testCase.props });

            expect(testCase.action.outputSchema).toBeDefined();
            expect(fieldKeys(testCase.action.outputSchema?.fields)).toEqual(Object.keys(objectOf(result)).sort());
        },
    );

    it('get_holidays wraps the top-level list and its item keys match each holiday row', async () => {
        sendRequest.mockResolvedValueOnce({
            status: 200,
            headers: {},
            body: {
                holidays: [
                    {
                        date: '2025-01-01 00:00:00',
                        start: '2024-12-31T23:00:00.000Z',
                        end: '2025-01-01T23:00:00.000Z',
                        name: "New Year's Day",
                        type: 'public',
                        rule: '01-01',
                    },
                ],
            },
        });

        const result = await runAction({ action: getHolidaysAction, propsValue: { countryCode: 'DE', year: 2025 } });
        const schema = getHolidaysAction.outputSchema;
        const wrapper = schema?.fields[0];

        expect(schema?.fields).toHaveLength(1);
        expect(wrapper?.value).toBe('');
        expect(schema?.itemLabel).toBe('{name}');
        expect(Array.isArray(result)).toBe(true);
        expect(fieldKeys(wrapper?.listItems)).toEqual(Object.keys(objectOf(firstOf(result))).sort());
    });

    it('convert_csv_to_json wraps the top-level list without fixed item fields', async () => {
        sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { json: [{ name: 'Ada' }] } });

        const result = await runAction({ action: convertCsvToJsonAction, propsValue: { csv: 'name\nAda', delimiter: 'auto' } });
        const schema = convertCsvToJsonAction.outputSchema;

        expect(Array.isArray(result)).toBe(true);
        expect(schema?.fields).toHaveLength(1);
        expect(schema?.fields[0].value).toBe('');
        expect(schema?.fields[0].listItems).toBeUndefined();
    });
});

function fieldKeys(fields: OutputSchema['fields'] | undefined): string[] {
    return (fields ?? []).map((field) => field.value ?? field.key).sort();
}

function objectOf(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error('Expected an object output');
    }
    return Object.fromEntries(Object.entries(value));
}

function firstOf(value: unknown): unknown {
    if (!Array.isArray(value)) {
        throw new Error('Expected an array output');
    }
    return value[0];
}

type SchemaAction = TestAction & {
    name: string;
    outputSchema?: OutputSchema;
};

type ObjectCase = {
    action: SchemaAction;
    props: Record<string, unknown>;
    response: Record<string, unknown>;
};
