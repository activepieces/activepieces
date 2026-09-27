import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zeroCodeKit } from '../src';
import { lookupVatRatesAction } from '../src/lib/actions/business/lookup-vat-rates';
import { validateBicAction } from '../src/lib/actions/business/validate-bic';
import { validateEmailAction } from '../src/lib/actions/business/validate-email';
import { validateIbanAction } from '../src/lib/actions/business/validate-iban';
import { validateVatIdAction } from '../src/lib/actions/business/validate-vat-id';
import { validateVatWithCountryCodeAction } from '../src/lib/actions/business/validate-vat-with-country-code';
import { verifyDomainAction } from '../src/lib/actions/business/verify-domain';
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
import { dateInput } from '../src/lib/common/date-input';
import { specificMonthAndYearAction } from '../src/lib/actions/date-and-time/specific-month-and-year';
import { getANumberAction } from '../src/lib/actions/generate/get-a-number';
import { getRandomCityAction } from '../src/lib/actions/generate/get-random-city';
import { getRandomNameAction } from '../src/lib/actions/generate/get-random-name';
import { getRandomNameWithGenderAction } from '../src/lib/actions/generate/get-random-name-with-gender';
import { detectGenderAction } from '../src/lib/actions/text/detect-gender';
import { splitNameAction } from '../src/lib/actions/text/split-name';
import { textContainsAction } from '../src/lib/actions/text/text-contains';
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

function respond(body: unknown) {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body });
}

function sent() {
    return sendRequest.mock.calls[0][0];
}

beforeEach(() => {
    sendRequest.mockReset();
});

describe('piece metadata', () => {
    const actions = Object.values(zeroCodeKit.actions()).filter((action) => action.name !== 'custom_api_call');

    it('registers all 74 actions plus Custom API Call', () => {
        expect(Object.keys(zeroCodeKit.actions())).toHaveLength(75);
    });

    it.each(actions.map((action) => [action.name, action]))('%s carries audience, aiMetadata and classification', (_, action) => {
        expect(action.audience).toBe('both');
        expect(action.classification).toBeDefined();
        expect(action.aiMetadata?.description?.length).toBeGreaterThan(20);
        expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
    });

    it('registers Custom API Call', async () => {
        const custom = zeroCodeKit.actions()['custom_api_call'];
        expect(custom).toBeDefined();
    });
});

describe('request shape', () => {
    const cases: RequestCase[] = [
        { action: currentMonthAction, props: {}, path: '/dateandtime/month', body: {} },
        {
            action: currentMonthAction,
            props: { outputFormat: 'YYYY-MM-DD', returnTimestamps: true },
            path: '/dateandtime/month',
            body: { outputFormat: 'YYYY-MM-DD', options: { timeStamp: true } },
        },
        {
            action: specificMonthAndYearAction,
            props: { month: 2, year: 2024 },
            path: '/dateandtime/month',
            body: { month: 2, year: 2024 },
        },
        { action: currentWeekAction, props: {}, path: '/dateandtime/calendarweek', body: {} },
        {
            action: currentWeekFromDateAction,
            props: { date: '20.01.2025', dateFormat: 'DD.MM.YYYY' },
            path: '/dateandtime/calendarweek',
            body: { date: '20.01.2025', dateFormat: 'DD.MM.YYYY' },
        },
        {
            action: currentWeekFromUnixTimestampAction,
            props: { unixTimestamp: 1737331200, outputFormat: 'DD/MM' },
            path: '/dateandtime/calendarweek',
            body: { unixTimestamp: 1737331200, outputFormat: 'DD/MM' },
        },
        {
            action: currentWeekWithWeekNumberAction,
            props: { weekNumber: 5 },
            path: '/dateandtime/calendarweek',
            body: { date: dateInput.isoWeekMonday({ weekNumber: 5, year: new Date().getUTCFullYear() }), dateFormat: 'DD.MM.YYYY' },
        },
        {
            action: currentWeekWithWeekNumberAndYearAction,
            props: { weekNumber: 5, year: 2023 },
            path: '/dateandtime/calendarweek',
            body: { date: '30.01.2023', dateFormat: 'DD.MM.YYYY' },
        },
        {
            action: isWeekendAction,
            props: { date: '2025-01-18' },
            path: '/dateandtime/isweekend',
            body: { date: '2025-01-18' },
        },
        {
            action: isWeekendWithFormatAction,
            props: { date: '18.01.2025', dateFormat: 'DD.MM.YYYY', timeZone: 'Europe/Berlin' },
            path: '/dateandtime/isweekend',
            body: { date: '2025-01-18', timeZone: 'Europe/Berlin' },
        },
        {
            action: getHolidaysAction,
            props: { countryCode: ' at ', year: 2022, state: '' },
            path: '/dateandtime/holidays',
            body: { countryCode: 'AT', year: 2022 },
        },
        {
            action: convertTimezoneWithDateAction,
            props: { inputTime: '08-12-2024 12:00', inputTimeZone: 'Europe/Berlin', destinationTimeZone: 'America/New_York' },
            path: '/dateandtime/switchtimezone',
            body: { inputTime: '08-12-2024 12:00', inputTimeZone: 'Europe/Berlin', destinationTimeZone: 'America/New_York' },
        },
        {
            action: convertTimezoneWithUnixTimestampAction,
            props: { inputTime: 1737331200, destinationTimeZone: 'Asia/Tokyo', formatPattern: 'HH:mm' },
            path: '/dateandtime/switchtimezone',
            body: { inputTime: 1737331200, inputTimeZone: 'UTC', destinationTimeZone: 'Asia/Tokyo', formatPattern: 'HH:mm' },
        },
        {
            action: convertCsvToJsonAction,
            props: { csv: 'a,b\n1,2', delimiter: 'auto' },
            path: '/convert/csv/json',
            body: { csv: 'a,b\n1,2', delimiter: 'auto', noheader: false, trim: true, ignoreEmpty: false },
        },
        {
            action: convertCsvToJsonAction,
            props: { csv: 'a;b', delimiter: ';', noHeader: true, trim: false, ignoreEmpty: true },
            path: '/convert/csv/json',
            body: { csv: 'a;b', delimiter: [';'], noheader: true, trim: false, ignoreEmpty: true },
        },
        {
            action: convertCurrencyAction,
            props: { amount: 10, sourceCurrency: 'usd', targetCurrency: ' eur' },
            path: '/convert/currency',
            body: { amount: 10, sourceCurrency: 'USD', targetCurrency: 'EUR' },
        },
        { action: convertIpToGeoAction, props: { ip: ' 1.1.1.1 ' }, path: '/convert/iptogeo', body: { ip: '1.1.1.1' } },
        { action: convertIsoToNationAction, props: { iso: 'DE' }, path: '/convert/nationiso', body: { iso: 'DE' } },
        { action: convertNationToIsoAction, props: { nation: 'Germany' }, path: '/convert/nationiso', body: { nation: 'Germany' } },
        { action: calculateBmiAction, props: { weight: 80, height: 180 }, path: '/calculate/bmi', body: { weight: 80, height: 180 } },
        {
            action: calculateGeoDistanceAction,
            props: { startPoint: 'Flensburg', endPoint: 'Istanbul', mode: 'walking' },
            path: '/calculate/geodistance-v2',
            body: { startPoint: 'Flensburg', endPoint: 'Istanbul', mode: 'walking' },
        },
        { action: validateBicAction, props: { bic: 'DEUTDEFF ' }, path: '/business/validate/bic', body: { bic: 'DEUTDEFF' } },
        { action: validateIbanAction, props: { iban: 'DE02120300000000202051' }, path: '/business/validate/iban', body: { iban: 'DE02120300000000202051' } },
        { action: validateEmailAction, props: { email: 'a@gmial.com' }, path: '/business/validate/email', body: { email: 'a@gmial.com' } },
        {
            action: validateVatWithCountryCodeAction,
            props: { countryCode: 'IT', id: '076 435 20567' },
            path: '/business/validate/vat',
            body: { countryCode: 'IT', id: '07643520567' },
        },
        { action: validateVatIdAction, props: { vatId: 'de 123456789' }, path: '/business/validate/vat', body: { vatId: 'DE123456789' } },
        { action: lookupVatRatesAction, props: { countryCode: 'DE' }, path: '/business/lookupvatrates', body: { countryCode: 'DE' } },
        { action: verifyDomainAction, props: { domain: 'https://example.com' }, path: '/business/verify/domain', body: { domain: 'https://example.com' } },
        { action: detectGenderAction, props: { fullName: 'Jane Doe' }, path: '/operator/gender', body: { fullname: 'Jane Doe' } },
        { action: splitNameAction, props: { name: 'Jane Doe' }, path: '/operator/splitname', body: { name: 'Jane Doe', reversed: false } },
        {
            action: textContainsAction,
            props: { text: 'hello world', keywords: ['world', ' ', 'moon'], caseSensitive: true },
            path: '/text/contains',
            body: {
                text: 'hello world',
                keywordList: ['world', 'moon'],
                options: { caseSensitive: true, onlyCompleteWords: false },
            },
        },
        { action: getRandomCityAction, props: {}, path: '/generate/city', body: {} },
        { action: getRandomNameAction, props: {}, path: '/generate/name', body: {} },
        { action: getRandomNameWithGenderAction, props: { gender: 'male' }, path: '/generate/name', body: { gender: 'male' } },
        {
            action: getANumberAction,
            props: { min: 1, max: 10, type: 'integer', round: 2 },
            path: '/generate/number',
            body: { range: [1, 10], type: 'integer' },
        },
        {
            action: getANumberAction,
            props: { min: 0, max: 1, type: 'decimal', round: 3 },
            path: '/generate/number',
            body: { range: [0, 1], type: 'decimal', round: 3 },
        },
    ];

    it.each(cases.map((testCase) => [testCase.action.name, testCase.path, testCase]))(
        '%s posts to %s',
        async (_, __, testCase) => {
            respond({});

            await runAction({ action: testCase.action, propsValue: testCase.props });

            expect(sendRequest).toHaveBeenCalledTimes(1);
            expect(sent().method).toBe('POST');
            expect(sent().url).toBe(`https://v2.1saas.co${testCase.path}`);
            expect(sent().headers).toEqual({ auth: 'zck_test' });
            expect(sent().body).toEqual(testCase.body);
        },
    );
});

describe('outputs', () => {
    it('flattens a calendar week', async () => {
        respond({ workingDate: '20.01.2025', weekNumber: 4, firstDayOfWeek: '20.01.2025', lastDayOfWeek: '26.01.2025' });

        await expect(runAction({ action: currentWeekAction, propsValue: {} })).resolves.toEqual({
            week_number: 4,
            working_date: '20.01.2025',
            first_day_of_week: '20.01.2025',
            last_day_of_week: '26.01.2025',
        });
    });

    it('returns month day lists with a workday count', async () => {
        respond({
            daysInMonth: 28,
            firstDayOfMonth: '01.02.2025',
            lastDayOfMonth: '28.02.2025',
            lastWorkdayOfMonth: '28.02.2025',
            workdays: ['03.02.2025', '04.02.2025'],
            workdaysReversed: ['04.02.2025', '03.02.2025'],
            saturdays: ['01.02.2025'],
            sundays: ['02.02.2025'],
        });

        const result = await runAction({ action: specificMonthAndYearAction, propsValue: { month: 2, year: 2025 } });

        expect(result).toMatchObject({ days_in_month: 28, workday_count: 2, saturdays: ['01.02.2025'] });
    });

    it('returns an empty holiday list instead of failing when none are returned', async () => {
        respond({});

        await expect(runAction({ action: getHolidaysAction, propsValue: { countryCode: 'DE', year: 2025 } })).resolves.toEqual([]);
    });

    it('returns one flat row per holiday', async () => {
        respond({
            holidays: [
                { date: '2025-01-01 00:00:00', start: 's', end: 'e', name: "New Year's Day", type: 'public', rule: '01-01' },
            ],
        });

        await expect(runAction({ action: getHolidaysAction, propsValue: { countryCode: 'DE', year: 2025 } })).resolves.toEqual([
            { name: "New Year's Day", date: '2025-01-01 00:00:00', type: 'public', start: 's', end: 'e', rule: '01-01' },
        ]);
    });

    it('flattens BMI nutrients', async () => {
        respond({ bmi: 24.69, bmiClassification: 'normal', dbw: 72, kcal: 2160, nutrients: { carbohydrates: 324, protein: 81, fat: 60 } });

        await expect(runAction({ action: calculateBmiAction, propsValue: { weight: 80, height: 180 } })).resolves.toEqual({
            bmi: 24.69,
            classification: 'normal',
            desirable_body_weight_kg: 72,
            daily_calories_kcal: 2160,
            daily_carbohydrates_g: 324,
            daily_protein_g: 81,
            daily_fat_g: 60,
        });
    });

    it('flattens geo distance duration', async () => {
        respond({ distanceInKM: 584.2, duration: { hours: 5, minutes: 41 } });

        await expect(
            runAction({ action: calculateGeoDistanceAction, propsValue: { startPoint: 'a', endPoint: 'b', mode: 'driving' } }),
        ).resolves.toEqual({ distance_km: 584.2, duration_hours: 5, duration_minutes: 41 });
    });

    it('turns "false" VAT rates into null so the column stays numeric', async () => {
        respond({
            country: 'Denmark',
            vat_name: 'Merværdiafgift',
            vat_abbr: 'moms',
            standard_rate: 25,
            reduced_rate: false,
            reduced_rate_alt: false,
            super_reduced_rate: false,
            parking_rate: false,
        });

        const result = await runAction({ action: lookupVatRatesAction, propsValue: { countryCode: 'DK' } });

        expect(result).toMatchObject({ standard_rate: 25, reduced_rate: null, parking_rate: null, vat_abbreviation: 'moms' });
    });

    it('returns the registered company for a valid VAT ID', async () => {
        respond({ countryCode: 'DE', vatNumber: '123456789', requestDate: '2025-01-20', valid: true, name: 'ACME', address: 'Street 1' });

        await expect(runAction({ action: validateVatIdAction, propsValue: { vatId: 'DE123456789' } })).resolves.toEqual({
            valid: true,
            country_code: 'DE',
            vat_number: '123456789',
            company_name: 'ACME',
            company_address: 'Street 1',
            request_date: '2025-01-20',
        });
    });

    it('returns the parsed CSV rows as a list', async () => {
        respond({ json: [{ a: '1', b: '2' }] });

        await expect(runAction({ action: convertCsvToJsonAction, propsValue: { csv: 'a,b\n1,2', delimiter: 'auto' } })).resolves.toEqual([{ a: '1', b: '2' }]);
    });

    it('summarises keyword findings with flat rows', async () => {
        respond({
            findings: [
                { keyword: 'world', contains: true, foundPositions: [6, 20] },
                { keyword: 'moon', contains: false, foundPositions: [] },
            ],
        });

        await expect(runAction({ action: textContainsAction, propsValue: { text: 't', keywords: ['world', 'moon'] } })).resolves.toEqual({
            contains_any: true,
            contains_all: false,
            findings: [
                { keyword: 'world', contains: true, match_count: 2, found_positions: '6, 20' },
                { keyword: 'moon', contains: false, match_count: 0, found_positions: '' },
            ],
        });
    });

    it('maps random name fields to readable keys', async () => {
        respond({ firstName: 'Jane', middleName: 'M', lastName: 'Doe', completeName: 'Jane Doe', completeNameWithMiddleName: 'Jane M Doe' });

        await expect(runAction({ action: getRandomNameAction, propsValue: {} })).resolves.toEqual({
            first_name: 'Jane',
            middle_name: 'M',
            last_name: 'Doe',
            full_name: 'Jane Doe',
            full_name_with_middle_name: 'Jane M Doe',
        });
    });

    it('fills missing fields with null instead of dropping them', async () => {
        respond({ country: 'Germany' });

        const result = await runAction({ action: convertIpToGeoAction, propsValue: { ip: '1.1.1.1' } });

        expect(result).toMatchObject({ country: 'Germany', city: null, latitude: null });
    });
});

describe('input guards', () => {
    it('Detect Gender needs a first or full name', async () => {
        await expect(runAction({ action: detectGenderAction, propsValue: { firstName: ' ', fullName: '' } })).rejects.toThrow(/First Name or Full Name/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Text Contains needs at least one keyword', async () => {
        await expect(runAction({ action: textContainsAction, propsValue: { text: 't', keywords: ['  '] } })).rejects.toThrow(/at least one keyword/);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('Get a Number rejects a minimum above the maximum', async () => {
        await expect(runAction({ action: getANumberAction, propsValue: { min: 10, max: 1, type: 'integer' } })).rejects.toThrow(/Minimum must be/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

type RequestCase = {
    action: TestAction & { name: string };
    props: Record<string, unknown>;
    path: string;
    body: Record<string, unknown>;
};
