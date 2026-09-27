export const dateInput = {
    toIsoDate,
    isoWeekMonday,
};

function toIsoDate({ date, format }: { date: string; format: string }): string {
    const tokens = tokenize(format.trim());
    const pattern = tokens.map((token) => TOKEN_PATTERNS[token] ?? escapeRegExp(token)).join('');
    const match = new RegExp(`^${pattern}$`).exec(date.trim());
    if (match === null) {
        throw new Error(`The date "${date}" does not match the format "${format}".`);
    }
    const groups = tokens.filter((token) => token in TOKEN_PATTERNS);
    const values = Object.fromEntries(groups.map((token, index) => [token, Number(match[index + 1])]));
    const year = values['YYYY'] ?? (values['YY'] === undefined ? undefined : 2000 + values['YY']);
    const month = values['MM'] ?? values['M'];
    const day = values['DD'] ?? values['D'];
    if (year === undefined || month === undefined || day === undefined) {
        throw new Error(`The format "${format}" must include a year (YYYY or YY), a month (MM or M) and a day (DD or D).`);
    }
    return formatIso({ year, month, day });
}

function isoWeekMonday({ weekNumber, year }: { weekNumber: number; year: number }): string {
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > weeksInIsoYear(year)) {
        throw new Error(`Week ${weekNumber} does not exist in ${year}. Use a week number from 1 to ${weeksInIsoYear(year)}.`);
    }
    const monday = new Date(firstIsoMonday(year) + (weekNumber - 1) * WEEK_MS);
    const day = String(monday.getUTCDate()).padStart(2, '0');
    const month = String(monday.getUTCMonth() + 1).padStart(2, '0');
    return `${day}.${month}.${monday.getUTCFullYear()}`;
}

function tokenize(format: string): string[] {
    return format.match(/YYYY|YY|MM|M|DD|D|[^YMD]+/g) ?? [];
}

function formatIso({ year, month, day }: { year: number; month: number; day: number }): string {
    const candidate = new Date(Date.UTC(year, month - 1, day));
    if (candidate.getUTCFullYear() !== year || candidate.getUTCMonth() !== month - 1 || candidate.getUTCDate() !== day) {
        throw new Error(`${year}-${month}-${day} is not a real calendar date.`);
    }
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function firstIsoMonday(year: number): number {
    const januaryFourth = Date.UTC(year, 0, 4);
    const weekday = (new Date(januaryFourth).getUTCDay() + 6) % 7;
    return januaryFourth - weekday * DAY_MS;
}

function weeksInIsoYear(year: number): number {
    return Math.round((firstIsoMonday(year + 1) - firstIsoMonday(year)) / WEEK_MS);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEK_MS = 7 * DAY_MS;

const TOKEN_PATTERNS: Record<string, string> = {
    YYYY: '(\\d{4})',
    YY: '(\\d{2})',
    MM: '(\\d{2})',
    M: '(\\d{1,2})',
    DD: '(\\d{2})',
    D: '(\\d{1,2})',
};
