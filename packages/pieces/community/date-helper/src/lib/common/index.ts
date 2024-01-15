export interface dateInformation {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  unix_time: number;
}

export enum timeFormat {
  format00 = 'DDD MMM DD YYYY HH:mm:ss',
  format01 = 'DDD MMM DD HH:mm:ss YYYY',
  format02 = 'MMMM DD YYYY HH:mm:ss',
  format03 = 'MMMM DD YYYY',
  format04 = 'MMM DD YYYY',
  format05 = 'YYYY-MM-DDTHH:mm:ss',
  format06 = 'YYYY-MM-DD HH:mm:ss',
  format07 = 'YYYY-MM-DD',
  format08 = 'MM-DD-YYYY',
  format09 = 'MM/DD/YYYY',
  format10 = 'MM/DD/YY',
  format11 = 'DD-MM-YYYY',
  format12 = 'DD/MM/YYYY',
  format13 = 'DD/MM/YY',
  format14 = 'X',
}

export enum timeFormatLabel {
  format00 = 'DDD MMM DD YYYY HH:mm:ss (Sun Sep 17 2023 11:23:58)',
  format01 = 'DDD MMM DD HH:mm:ss YYYY (Sun Sep 17 11:23:58 2023)',
  format02 = 'MMMM DD YYYY HH:mm:ss (September 17 2023 11:23:58)',
  format03 = 'MMMM DD YYYY (September 17 2023)',
  format04 = 'MMM DD YYYY (Sep 17 2023)',
  format05 = 'YYYY-MM-DDTHH:mm:ss (2023-09-17T11:23:58) ',
  format06 = 'YYYY-MM-DD HH:mm:ss (2023-09-17 11:23:58)',
  format07 = 'YYYY-MM-DD (2023-09-17)',
  format08 = 'MM-DD-YYYY (09-17-2023)',
  format09 = 'MM/DD/YYYY (09/17/2023)',
  format10 = 'MM/DD/YY (09/17/23)',
  format11 = 'DD-MM-YYYY (17-09-2023)',
  format12 = 'DD/MM/YYYY (17/09/2023)',
  format13 = 'DD/MM/YY (17/09/23)',
  format14 = 'X (1694949838)',
}

export enum timeParts {
  year = 'year',
  month = 'month',
  day = 'day',
  hour = 'hour',
  minute = 'minute',
  second = 'second',
  unix_time = 'unix_time',
  dayOfWeek = 'dayOfWeek',
  monthName = 'monthName',
}

export const timeFormatDescription = `Here's what each part of the format (eg. YYYY) means:
\nYYYY : Year (4 digits)
\nYY : Year (2 digits)
\nMMMM : Month (full name)
\nMMM : Month (short name)
\nMM : Month (2 digits)
\nDDDD : Day (full name)
\nDDD : Day (short name)
\nDD : Day (2 digits)
\nHH : Hour (2 digits)
\nmm : Minute (2 digits)
\nss : Second (2 digits)
\nX : Time in unix format`;

export const optionalTimeFormats = [
  { label: timeFormatLabel.format00, value: timeFormat.format00 },
  { label: timeFormatLabel.format01, value: timeFormat.format01 },
  { label: timeFormatLabel.format02, value: timeFormat.format02 },
  { label: timeFormatLabel.format03, value: timeFormat.format03 },
  { label: timeFormatLabel.format04, value: timeFormat.format04 },
  { label: timeFormatLabel.format05, value: timeFormat.format05 },
  { label: timeFormatLabel.format06, value: timeFormat.format06 },
  { label: timeFormatLabel.format07, value: timeFormat.format07 },
  { label: timeFormatLabel.format08, value: timeFormat.format08 },
  { label: timeFormatLabel.format09, value: timeFormat.format09 },
  { label: timeFormatLabel.format10, value: timeFormat.format10 },
  { label: timeFormatLabel.format11, value: timeFormat.format11 },
  { label: timeFormatLabel.format12, value: timeFormat.format12 },
  { label: timeFormatLabel.format13, value: timeFormat.format13 },
  { label: timeFormatLabel.format14, value: timeFormat.format14 },
];

function formatNumber(num: number, length: number) {
  let result = num.toString();
  while (result.length < length) result = '0' + result;
  return result;
}

function getYear(dateString: string, typeString: string) {
  let yearIndex = typeString.indexOf('YYYY'),
    year = 0;
  if (yearIndex !== -1) {
    const stringYear = dateString.substring(yearIndex, yearIndex + 4);
    year = parseInt(stringYear);
    if (Number.isNaN(year)) {
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringYear}" for "YYYY" cannot be parsed as an integer.`
      );
    }
  } else {
    yearIndex = typeString.indexOf('YY');
    if (yearIndex !== -1) {
      const stringYear = dateString.substring(yearIndex, yearIndex + 2);
      year = parseInt(stringYear);
      if (Number.isNaN(year)) {
        throw new Error(
          `Invalid Date format in ${typeString}. The value "${stringYear}" for "YY" cannot be parsed as an integer.`
        );
      }
      year = year + 2000;
    }
  }
  return year;
}

function getMonth(dateString: string, typeString: string) {
  let monthIndex = typeString.indexOf('MMMM'),
    month = 0;
  if (monthIndex !== -1) {
    const monthNames1 = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    for (let i = 0; i < monthNames1.length; i++) {
      if (dateString.toLowerCase().includes(monthNames1[i].toLowerCase())) {
        month = i + 1;
        break;
      }
    }
    if (month == 0)
      throw new Error(
        `Invalid Date format in ${typeString}. The value for "MMMM" which is long month cannot be found in ${dateString}.`
      );
  } else {
    monthIndex = typeString.indexOf('MMM');
    if (monthIndex !== -1) {
      const monthNames2 = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      for (let i = 0; i < monthNames2.length; i++) {
        if (dateString.toLowerCase().includes(monthNames2[i].toLowerCase())) {
          month = i + 1;
          break;
        }
      }
      if (month == 0)
        throw new Error(
          `Invalid Date format in ${typeString}. The value for "MMM" which is short month cannot be found in ${dateString}.`
        );
    } else {
      monthIndex = typeString.indexOf('MM');
      if (monthIndex !== -1) {
        const monthString = dateString.substring(monthIndex, monthIndex + 2);
        month = parseInt(monthString);
        if (Number.isNaN(month))
          throw new Error(
            `Invalid Date format in ${typeString}. The value "${monthString}" for "MM" cannot be parsed as an integer.`
          );
      }
    }
  }
  return month;
}

function getDay(dateString: string, typeString: string) {
  const dayIndex = typeString.indexOf('DD');
  let day = 0;
  if (dayIndex !== -1) {
    const stringDay = dateString.substring(dayIndex, dayIndex + 2);
    day = parseInt(stringDay);
    if (Number.isNaN(day))
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringDay}" for "DD" cannot be parsed as an integer.`
      );
  }
  return day;
}

function getHour(dateString: string, typeString: string) {
  const hourIndex = typeString.indexOf('HH');
  let hour = 0;
  if (hourIndex !== -1) {
    const stringHour = dateString.substring(hourIndex, hourIndex + 2);
    hour = parseInt(stringHour);
    if (Number.isNaN(hour))
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringHour}" for "HH" cannot be parsed as an integer.`
      );
  }
  return hour;
}

function getMinute(dateString: string, typeString: string) {
  const minuteIndex = typeString.indexOf('mm');
  let minute = 0;
  if (minuteIndex !== -1) {
    const stringMinute = dateString.substring(minuteIndex, minuteIndex + 2);
    minute = parseInt(stringMinute);
    if (Number.isNaN(minute))
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringMinute}" for "mm" cannot be parsed as an integer.`
      );
  }
  return minute;
}

function getSecond(dateString: string, typeString: string) {
  const secondIndex = typeString.indexOf('ss');
  let second = 0;
  if (secondIndex !== -1) {
    const stringSecond = dateString.substring(secondIndex, secondIndex + 2);
    second = parseInt(stringSecond);
    if (Number.isNaN(second))
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringSecond}" for "ss" cannot be parsed as an integer.`
      );
  }
  return second;
}

function getUnixTime(dateString: string, typeString: string) {
  const unixIndex = typeString.indexOf('X');
  let unixTime = 0;
  if (unixIndex !== -1) {
    let endIndex = unixIndex;
    while (dateString[endIndex] >= '0' && dateString[endIndex] <= '9')
      endIndex++;
    const stringnix = dateString.substring(unixIndex, endIndex);
    unixTime = parseInt(stringnix);
    if (Number.isNaN(unixTime))
      throw new Error(
        `Invalid Date format in ${typeString}. The value "${stringnix}" for "X" cannot be parsed as an integer.`
      );
  }
  return unixTime;
}

function removeMonth(date: string) {
  const longMonthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const shortMonthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  for (let i = 0; i < longMonthNames.length; i++) {
    date = date.replace(longMonthNames[i], '');
  }
  for (let i = 0; i < shortMonthNames.length; i++) {
    date = date.replace(shortMonthNames[i], '');
  }
  return date;
}

function removeDay(date: string) {
  const longDayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const shortDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 0; i < longDayNames.length; i++) {
    date = date.replace(longDayNames[i], '');
  }
  for (let i = 0; i < shortDayNames.length; i++) {
    date = date.replace(shortDayNames[i], '');
  }
  return date;
}

export function createDateFromInfo(dateInfo: dateInformation) {
  let date;
  if (dateInfo.unix_time !== 0) date = new Date(dateInfo.unix_time * 1000);
  else
    date = new Date(
      dateInfo.year,
      dateInfo.month - 1,
      dateInfo.day,
      dateInfo.hour,
      dateInfo.minute,
      dateInfo.second
    );
  return date;
}

export function getDateInformation(date: string, TF: string) {
  let typeString = TF.toString();
  // first we strip the month names and day names from the date string
  const month = getMonth(date, typeString);

  date = removeMonth(date);
  typeString = typeString
    .replace('MMMM', '')
    .replace('MMM', '')
    .replace('DDDD', '')
    .replace('DDD', '');
  date = removeDay(date);

  const day = getDay(date, typeString);
  const year = getYear(date, typeString);
  const hour = getHour(date, typeString);
  const minute = getMinute(date, typeString);
  const second = getSecond(date, typeString);

  const unix_time = getUnixTime(date, typeString);

  return {
    year: year,
    month: month,
    day: day,
    hour: hour,
    minute: minute,
    second: second,
    unix_time: unix_time,
  };
}

export function createNewDate(date: Date, TF: string) {
  const year = formatNumber(date.getFullYear(), 4);
  const result = TF.replace('YYYY', year)
    .replace('YY', year.substring(2, 4))
    .replace('MMMM', date.toLocaleString('default', { month: 'long' }))
    .replace('MMM', date.toLocaleString('default', { month: 'short' }))
    .replace('MM', formatNumber(date.getMonth() + 1, 2))
    .replace('DDDD', date.toLocaleString('default', { weekday: 'long' }))
    .replace('DDD', date.toLocaleString('default', { weekday: 'short' }))
    .replace('DD', formatNumber(date.getDate(), 2))
    .replace('HH', formatNumber(date.getHours(), 2))
    .replace('mm', formatNumber(date.getMinutes(), 2))
    .replace('ss', formatNumber(date.getSeconds(), 2))
    .replace('X', (date.getTime() / 1000).toString());
  return result;
}

export function timeDiff(beforeTimeZone: string, afterTimeZone: string) {
  const date = new Date();
  const BeforeDate = new Date(
    date.toLocaleString('en-US', { timeZone: beforeTimeZone })
  );
  const AfterDate = new Date(
    date.toLocaleString('en-US', { timeZone: afterTimeZone })
  );
  const diff = (AfterDate.getTime() - BeforeDate.getTime()) / 60000;

  return diff;
}

export function ChangeDateFormat(
  date: string,
  beforeFormat: string,
  beforeTimeZone: string,
  afterFormat: string,
  afterTimeZone: string
) {
  const DateInfo = getDateInformation(date, beforeFormat) as dateInformation;
  const BeforeDate = createDateFromInfo(DateInfo);
  BeforeDate.setMinutes(
    BeforeDate.getMinutes() + timeDiff(beforeTimeZone, afterTimeZone)
  );
  const newDate = createNewDate(BeforeDate, afterFormat);

  return newDate;
}

export function addSubtractTime(date: Date, expression: string) {
  // remove all the spaces and line breaks from the expression
  expression = expression.replace(/(\r\n|\n|\r)/gm, '').replace(/ /g, '');
  const parts = expression.split(/(\+|-)/);
  let sign = 1;
  const numbers = [];
  const units = [];

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '+') sign = 1;
    else if (parts[i] === '-') sign = -1;
    else if (parts[i] === '') continue;
    let number = '';
    let unit = '';
    for (let j = 0; j < parts[i].length; j++) {
      if (parts[i][j] === ' ') continue;
      if (parts[i][j] >= '0' && parts[i][j] <= '9') {
        if (unit !== '') {
          numbers.push(sign * parseInt(number));
          units.push(unit);
          number = '';
          unit = '';
        }
        number += parts[i][j];
      } else {
        if (number === '') continue;
        unit += parts[i][j];
      }
    }
    if (unit !== '') {
      numbers.push(sign * parseInt(number));
      units.push(unit);
    }
  }
  for (let i = 0; i < numbers.length; i++) {
    const val = units[i].toLowerCase() as timeParts;
    switch (val) {
      case timeParts.year:
        date.setFullYear(date.getFullYear() + numbers[i]);
        break;
      case timeParts.month:
        date.setMonth(date.getMonth() + numbers[i]);
        break;
      case timeParts.day:
        date.setDate(date.getDate() + numbers[i]);
        break;
      case timeParts.hour:
        date.setHours(date.getHours() + numbers[i]);
        break;
      case timeParts.minute:
        date.setMinutes(date.getMinutes() + numbers[i]);
        break;
      case timeParts.second:
        date.setSeconds(date.getSeconds() + numbers[i]);
        break;
      case timeParts.dayOfWeek:
      case timeParts.monthName:
      case timeParts.unix_time:
        break;
      default: {
        const nvr: never = val;
        console.error(nvr, 'unhandled case was reached');
      }
    }
  }
  return date;
}
export const timeZoneOptions = [
  {
    label: '(GMT-11:00) Pacific, Midway',
    value: 'Pacific/Midway',
  },
  {
    label: '(GMT-11:00) Pacific, Niue',
    value: 'Pacific/Niue',
  },
  {
    label: '(GMT-11:00) Pacific, Pago Pago',
    value: 'Pacific/Pago_Pago',
  },
  {
    label: '(GMT-10:00) Pacific, Honolulu',
    value: 'Pacific/Honolulu',
  },
  {
    label: '(GMT-10:00) Pacific, Rarotonga',
    value: 'Pacific/Rarotonga',
  },
  {
    label: '(GMT-10:00) Pacific, Tahiti',
    value: 'Pacific/Tahiti',
  },
  {
    label: '(GMT-09:30) Pacific, Marquesas',
    value: 'Pacific/Marquesas',
  },
  {
    label: '(GMT-09:00) America, Adak',
    value: 'America/Adak',
  },
  {
    label: '(GMT-09:00) Pacific, Gambier',
    value: 'Pacific/Gambier',
  },
  {
    label: '(GMT-08:00) America, Anchorage',
    value: 'America/Anchorage',
  },
  {
    label: '(GMT-08:00) America, Juneau',
    value: 'America/Juneau',
  },
  {
    label: '(GMT-08:00) America, Metlakatla',
    value: 'America/Metlakatla',
  },
  {
    label: '(GMT-08:00) America, Nome',
    value: 'America/Nome',
  },
  {
    label: '(GMT-08:00) America, Sitka',
    value: 'America/Sitka',
  },
  {
    label: '(GMT-08:00) America, Yakutat',
    value: 'America/Yakutat',
  },
  {
    label: '(GMT-08:00) Pacific, Pitcairn',
    value: 'Pacific/Pitcairn',
  },
  {
    label: '(GMT-07:00) America, Creston',
    value: 'America/Creston',
  },
  {
    label: '(GMT-07:00) America, Dawson',
    value: 'America/Dawson',
  },
  {
    label: '(GMT-07:00) America, Dawson Creek',
    value: 'America/Dawson_Creek',
  },
  {
    label: '(GMT-07:00) America, Fort Nelson',
    value: 'America/Fort_Nelson',
  },
  {
    label: '(GMT-07:00) America, Hermosillo',
    value: 'America/Hermosillo',
  },
  {
    label: '(GMT-07:00) America, Los Angeles',
    value: 'America/Los_Angeles',
  },
  {
    label: '(GMT-07:00) America, Mazatlan',
    value: 'America/Mazatlan',
  },
  {
    label: '(GMT-07:00) America, Phoenix',
    value: 'America/Phoenix',
  },
  {
    label: '(GMT-07:00) America, Tijuana',
    value: 'America/Tijuana',
  },
  {
    label: '(GMT-07:00) America, Vancouver',
    value: 'America/Vancouver',
  },
  {
    label: '(GMT-07:00) America, Whitehorse',
    value: 'America/Whitehorse',
  },
  {
    label: '(GMT-06:00) America, Bahia Banderas',
    value: 'America/Bahia_Banderas',
  },
  {
    label: '(GMT-06:00) America, Belize',
    value: 'America/Belize',
  },
  {
    label: '(GMT-06:00) America, Boise',
    value: 'America/Boise',
  },
  {
    label: '(GMT-06:00) America, Cambridge Bay',
    value: 'America/Cambridge_Bay',
  },
  {
    label: '(GMT-06:00) America, Chihuahua',
    value: 'America/Chihuahua',
  },
  {
    label: '(GMT-06:00) America, Ciudad Juarez',
    value: 'America/Ciudad_Juarez',
  },
  {
    label: '(GMT-06:00) America, Costa Rica',
    value: 'America/Costa_Rica',
  },
  {
    label: '(GMT-06:00) America, Denver',
    value: 'America/Denver',
  },
  {
    label: '(GMT-06:00) America, Edmonton',
    value: 'America/Edmonton',
  },
  {
    label: '(GMT-06:00) America, El Salvador',
    value: 'America/El_Salvador',
  },
  {
    label: '(GMT-06:00) America, Guatemala',
    value: 'America/Guatemala',
  },
  {
    label: '(GMT-06:00) America, Inuvik',
    value: 'America/Inuvik',
  },
  {
    label: '(GMT-06:00) America, Managua',
    value: 'America/Managua',
  },
  {
    label: '(GMT-06:00) America, Merida',
    value: 'America/Merida',
  },
  {
    label: '(GMT-06:00) America, Mexico City',
    value: 'America/Mexico_City',
  },
  {
    label: '(GMT-06:00) America, Monterrey',
    value: 'America/Monterrey',
  },
  {
    label: '(GMT-06:00) America, Regina',
    value: 'America/Regina',
  },
  {
    label: '(GMT-06:00) America, Swift Current',
    value: 'America/Swift_Current',
  },
  {
    label: '(GMT-06:00) America, Tegucigalpa',
    value: 'America/Tegucigalpa',
  },
  {
    label: '(GMT-06:00) Pacific, Easter',
    value: 'Pacific/Easter',
  },
  {
    label: '(GMT-06:00) Pacific, Galapagos',
    value: 'Pacific/Galapagos',
  },
  {
    label: '(GMT-05:00) America, Atikokan',
    value: 'America/Atikokan',
  },
  {
    label: '(GMT-05:00) America, Bogota',
    value: 'America/Bogota',
  },
  {
    label: '(GMT-05:00) America, Cancun',
    value: 'America/Cancun',
  },
  {
    label: '(GMT-05:00) America, Cayman',
    value: 'America/Cayman',
  },
  {
    label: '(GMT-05:00) America, Chicago',
    value: 'America/Chicago',
  },
  {
    label: '(GMT-05:00) America, Eirunepe',
    value: 'America/Eirunepe',
  },
  {
    label: '(GMT-05:00) America, Guayaquil',
    value: 'America/Guayaquil',
  },
  {
    label: '(GMT-05:00) America, Indiana, Knox',
    value: 'America/Indiana/Knox',
  },
  {
    label: '(GMT-05:00) America, Indiana, Tell City',
    value: 'America/Indiana/Tell_City',
  },
  {
    label: '(GMT-05:00) America, Jamaica',
    value: 'America/Jamaica',
  },
  {
    label: '(GMT-05:00) America, Lima',
    value: 'America/Lima',
  },
  {
    label: '(GMT-05:00) America, Matamoros',
    value: 'America/Matamoros',
  },
  {
    label: '(GMT-05:00) America, Menominee',
    value: 'America/Menominee',
  },
  {
    label: '(GMT-05:00) America, North Dakota, Beulah',
    value: 'America/North_Dakota/Beulah',
  },
  {
    label: '(GMT-05:00) America, North Dakota, Center',
    value: 'America/North_Dakota/Center',
  },
  {
    label: '(GMT-05:00) America, North Dakota, New Salem',
    value: 'America/North_Dakota/New_Salem',
  },
  {
    label: '(GMT-05:00) America, Ojinaga',
    value: 'America/Ojinaga',
  },
  {
    label: '(GMT-05:00) America, Panama',
    value: 'America/Panama',
  },
  {
    label: '(GMT-05:00) America, Rankin Inlet',
    value: 'America/Rankin_Inlet',
  },
  {
    label: '(GMT-05:00) America, Resolute',
    value: 'America/Resolute',
  },
  {
    label: '(GMT-05:00) America, Rio Branco',
    value: 'America/Rio_Branco',
  },
  {
    label: '(GMT-05:00) America, Winnipeg',
    value: 'America/Winnipeg',
  },
  {
    label: '(GMT-04:00) America, Anguilla',
    value: 'America/Anguilla',
  },
  {
    label: '(GMT-04:00) America, Antigua',
    value: 'America/Antigua',
  },
  {
    label: '(GMT-04:00) America, Aruba',
    value: 'America/Aruba',
  },
  {
    label: '(GMT-04:00) America, Asuncion',
    value: 'America/Asuncion',
  },
  {
    label: '(GMT-04:00) America, Barbados',
    value: 'America/Barbados',
  },
  {
    label: '(GMT-04:00) America, Blanc-Sablon',
    value: 'America/Blanc-Sablon',
  },
  {
    label: '(GMT-04:00) America, Boa Vista',
    value: 'America/Boa_Vista',
  },
  {
    label: '(GMT-04:00) America, Campo Grande',
    value: 'America/Campo_Grande',
  },
  {
    label: '(GMT-04:00) America, Caracas',
    value: 'America/Caracas',
  },
  {
    label: '(GMT-04:00) America, Cuiaba',
    value: 'America/Cuiaba',
  },
  {
    label: '(GMT-04:00) America, Curacao',
    value: 'America/Curacao',
  },
  {
    label: '(GMT-04:00) America, Detroit',
    value: 'America/Detroit',
  },
  {
    label: '(GMT-04:00) America, Dominica',
    value: 'America/Dominica',
  },
  {
    label: '(GMT-04:00) America, Grand Turk',
    value: 'America/Grand_Turk',
  },
  {
    label: '(GMT-04:00) America, Grenada',
    value: 'America/Grenada',
  },
  {
    label: '(GMT-04:00) America, Guadeloupe',
    value: 'America/Guadeloupe',
  },
  {
    label: '(GMT-04:00) America, Guyana',
    value: 'America/Guyana',
  },
  {
    label: '(GMT-04:00) America, Havana',
    value: 'America/Havana',
  },
  {
    label: '(GMT-04:00) America, Indiana, Indianapolis',
    value: 'America/Indiana/Indianapolis',
  },
  {
    label: '(GMT-04:00) America, Indiana, Marengo',
    value: 'America/Indiana/Marengo',
  },
  {
    label: '(GMT-04:00) America, Indiana, Petersburg',
    value: 'America/Indiana/Petersburg',
  },
  {
    label: '(GMT-04:00) America, Indiana, Vevay',
    value: 'America/Indiana/Vevay',
  },
  {
    label: '(GMT-04:00) America, Indiana, Vincennes',
    value: 'America/Indiana/Vincennes',
  },
  {
    label: '(GMT-04:00) America, Indiana, Winamac',
    value: 'America/Indiana/Winamac',
  },
  {
    label: '(GMT-04:00) America, Iqaluit',
    value: 'America/Iqaluit',
  },
  {
    label: '(GMT-04:00) America, Kentucky, Louisville',
    value: 'America/Kentucky/Louisville',
  },
  {
    label: '(GMT-04:00) America, Kentucky, Monticello',
    value: 'America/Kentucky/Monticello',
  },
  {
    label: '(GMT-04:00) America, Kralendijk',
    value: 'America/Kralendijk',
  },
  {
    label: '(GMT-04:00) America, La Paz',
    value: 'America/La_Paz',
  },
  {
    label: '(GMT-04:00) America, Lower Princes',
    value: 'America/Lower_Princes',
  },
  {
    label: '(GMT-04:00) America, Manaus',
    value: 'America/Manaus',
  },
  {
    label: '(GMT-04:00) America, Marigot',
    value: 'America/Marigot',
  },
  {
    label: '(GMT-04:00) America, Martinique',
    value: 'America/Martinique',
  },
  {
    label: '(GMT-04:00) America, Montserrat',
    value: 'America/Montserrat',
  },
  {
    label: '(GMT-04:00) America, Nassau',
    value: 'America/Nassau',
  },
  {
    label: '(GMT-04:00) America, New York',
    value: 'America/New_York',
  },
  {
    label: '(GMT-04:00) America, Port of Spain',
    value: 'America/Port_of_Spain',
  },
  {
    label: '(GMT-04:00) America, Port-au-Prince',
    value: 'America/Port-au-Prince',
  },
  {
    label: '(GMT-04:00) America, Porto Velho',
    value: 'America/Porto_Velho',
  },
  {
    label: '(GMT-04:00) America, Puerto Rico',
    value: 'America/Puerto_Rico',
  },
  {
    label: '(GMT-04:00) America, Santiago',
    value: 'America/Santiago',
  },
  {
    label: '(GMT-04:00) America, Santo Domingo',
    value: 'America/Santo_Domingo',
  },
  {
    label: '(GMT-04:00) America, St. Barthelemy',
    value: 'America/St_Barthelemy',
  },
  {
    label: '(GMT-04:00) America, St. Kitts',
    value: 'America/St_Kitts',
  },
  {
    label: '(GMT-04:00) America, St. Lucia',
    value: 'America/St_Lucia',
  },
  {
    label: '(GMT-04:00) America, St. Thomas',
    value: 'America/St_Thomas',
  },
  {
    label: '(GMT-04:00) America, St. Vincent',
    value: 'America/St_Vincent',
  },
  {
    label: '(GMT-04:00) America, Toronto',
    value: 'America/Toronto',
  },
  {
    label: '(GMT-04:00) America, Tortola',
    value: 'America/Tortola',
  },
  {
    label: '(GMT-03:00) America, Araguaina',
    value: 'America/Araguaina',
  },
  {
    label: '(GMT-03:00) America, Argentina, Buenos Aires',
    value: 'America/Argentina/Buenos_Aires',
  },
  {
    label: '(GMT-03:00) America, Argentina, Catamarca',
    value: 'America/Argentina/Catamarca',
  },
  {
    label: '(GMT-03:00) America, Argentina, Cordoba',
    value: 'America/Argentina/Cordoba',
  },
  {
    label: '(GMT-03:00) America, Argentina, Jujuy',
    value: 'America/Argentina/Jujuy',
  },
  {
    label: '(GMT-03:00) America, Argentina, La Rioja',
    value: 'America/Argentina/La_Rioja',
  },
  {
    label: '(GMT-03:00) America, Argentina, Mendoza',
    value: 'America/Argentina/Mendoza',
  },
  {
    label: '(GMT-03:00) America, Argentina, Rio Gallegos',
    value: 'America/Argentina/Rio_Gallegos',
  },
  {
    label: '(GMT-03:00) America, Argentina, Salta',
    value: 'America/Argentina/Salta',
  },
  {
    label: '(GMT-03:00) America, Argentina, San Juan',
    value: 'America/Argentina/San_Juan',
  },
  {
    label: '(GMT-03:00) America, Argentina, San Luis',
    value: 'America/Argentina/San_Luis',
  },
  {
    label: '(GMT-03:00) America, Argentina, Tucuman',
    value: 'America/Argentina/Tucuman',
  },
  {
    label: '(GMT-03:00) America, Argentina, Ushuaia',
    value: 'America/Argentina/Ushuaia',
  },
  {
    label: '(GMT-03:00) America, Bahia',
    value: 'America/Bahia',
  },
  {
    label: '(GMT-03:00) America, Belem',
    value: 'America/Belem',
  },
  {
    label: '(GMT-03:00) America, Cayenne',
    value: 'America/Cayenne',
  },
  {
    label: '(GMT-03:00) America, Fortaleza',
    value: 'America/Fortaleza',
  },
  {
    label: '(GMT-03:00) America, Glace Bay',
    value: 'America/Glace_Bay',
  },
  {
    label: '(GMT-03:00) America, Goose Bay',
    value: 'America/Goose_Bay',
  },
  {
    label: '(GMT-03:00) America, Halifax',
    value: 'America/Halifax',
  },
  {
    label: '(GMT-03:00) America, Maceio',
    value: 'America/Maceio',
  },
  {
    label: '(GMT-03:00) America, Moncton',
    value: 'America/Moncton',
  },
  {
    label: '(GMT-03:00) America, Montevideo',
    value: 'America/Montevideo',
  },
  {
    label: '(GMT-03:00) America, Paramaribo',
    value: 'America/Paramaribo',
  },
  {
    label: '(GMT-03:00) America, Punta Arenas',
    value: 'America/Punta_Arenas',
  },
  {
    label: '(GMT-03:00) America, Recife',
    value: 'America/Recife',
  },
  {
    label: '(GMT-03:00) America, Santarem',
    value: 'America/Santarem',
  },
  {
    label: '(GMT-03:00) America, Sao Paulo',
    value: 'America/Sao_Paulo',
  },
  {
    label: '(GMT-03:00) America, Thule',
    value: 'America/Thule',
  },
  {
    label: '(GMT-03:00) Antarctica, Palmer',
    value: 'Antarctica/Palmer',
  },
  {
    label: '(GMT-03:00) Antarctica, Rothera',
    value: 'Antarctica/Rothera',
  },
  {
    label: '(GMT-03:00) Atlantic, Bermuda',
    value: 'Atlantic/Bermuda',
  },
  {
    label: '(GMT-03:00) Atlantic, Stanley',
    value: 'Atlantic/Stanley',
  },
  {
    label: '(GMT-02:30) America, St. Johns',
    value: 'America/St_Johns',
  },
  {
    label: '(GMT-02:00) America, Miquelon',
    value: 'America/Miquelon',
  },
  {
    label: '(GMT-02:00) America, Noronha',
    value: 'America/Noronha',
  },
  {
    label: '(GMT-02:00) America, Nuuk',
    value: 'America/Nuuk',
  },
  {
    label: '(GMT-02:00) Atlantic, South Georgia',
    value: 'Atlantic/South_Georgia',
  },
  {
    label: '(GMT-01:00) Atlantic, Cape Verde',
    value: 'Atlantic/Cape_Verde',
  },
  {
    label: '(GMT) Africa, Abidjan',
    value: 'Africa/Abidjan',
  },
  {
    label: '(GMT) Africa, Accra',
    value: 'Africa/Accra',
  },
  {
    label: '(GMT) Africa, Bamako',
    value: 'Africa/Bamako',
  },
  {
    label: '(GMT) Africa, Banjul',
    value: 'Africa/Banjul',
  },
  {
    label: '(GMT) Africa, Bissau',
    value: 'Africa/Bissau',
  },
  {
    label: '(GMT) Africa, Conakry',
    value: 'Africa/Conakry',
  },
  {
    label: '(GMT) Africa, Dakar',
    value: 'Africa/Dakar',
  },
  {
    label: '(GMT) Africa, Freetown',
    value: 'Africa/Freetown',
  },
  {
    label: '(GMT) Africa, Lome',
    value: 'Africa/Lome',
  },
  {
    label: '(GMT) Africa, Monrovia',
    value: 'Africa/Monrovia',
  },
  {
    label: '(GMT) Africa, Nouakchott',
    value: 'Africa/Nouakchott',
  },
  {
    label: '(GMT) Africa, Ouagadougou',
    value: 'Africa/Ouagadougou',
  },
  {
    label: '(GMT) Africa, Sao Tome',
    value: 'Africa/Sao_Tome',
  },
  {
    label: '(GMT) America, Danmarkshavn',
    value: 'America/Danmarkshavn',
  },
  {
    label: '(GMT) America, Scoresbysund',
    value: 'America/Scoresbysund',
  },
  {
    label: '(GMT) Atlantic, Azores',
    value: 'Atlantic/Azores',
  },
  {
    label: '(GMT) Atlantic, Reykjavik',
    value: 'Atlantic/Reykjavik',
  },
  {
    label: '(GMT) Atlantic, St. Helena',
    value: 'Atlantic/St_Helena',
  },
  {
    label: '(GMT) UTC',
    value: 'UTC',
  },
  {
    label: '(GMT+01:00) Africa, Algiers',
    value: 'Africa/Algiers',
  },
  {
    label: '(GMT+01:00) Africa, Bangui',
    value: 'Africa/Bangui',
  },
  {
    label: '(GMT+01:00) Africa, Brazzaville',
    value: 'Africa/Brazzaville',
  },
  {
    label: '(GMT+01:00) Africa, Casablanca',
    value: 'Africa/Casablanca',
  },
  {
    label: '(GMT+01:00) Africa, Douala',
    value: 'Africa/Douala',
  },
  {
    label: '(GMT+01:00) Africa, El Aaiun',
    value: 'Africa/El_Aaiun',
  },
  {
    label: '(GMT+01:00) Africa, Kinshasa',
    value: 'Africa/Kinshasa',
  },
  {
    label: '(GMT+01:00) Africa, Lagos',
    value: 'Africa/Lagos',
  },
  {
    label: '(GMT+01:00) Africa, Libreville',
    value: 'Africa/Libreville',
  },
  {
    label: '(GMT+01:00) Africa, Luanda',
    value: 'Africa/Luanda',
  },
  {
    label: '(GMT+01:00) Africa, Malabo',
    value: 'Africa/Malabo',
  },
  {
    label: '(GMT+01:00) Africa, Ndjamena',
    value: 'Africa/Ndjamena',
  },
  {
    label: '(GMT+01:00) Africa, Niamey',
    value: 'Africa/Niamey',
  },
  {
    label: '(GMT+01:00) Africa, Porto-Novo',
    value: 'Africa/Porto-Novo',
  },
  {
    label: '(GMT+01:00) Africa, Tunis',
    value: 'Africa/Tunis',
  },
  {
    label: '(GMT+01:00) Atlantic, Canary',
    value: 'Atlantic/Canary',
  },
  {
    label: '(GMT+01:00) Atlantic, Faroe',
    value: 'Atlantic/Faroe',
  },
  {
    label: '(GMT+01:00) Atlantic, Madeira',
    value: 'Atlantic/Madeira',
  },
  {
    label: '(GMT+01:00) Europe, Dublin',
    value: 'Europe/Dublin',
  },
  {
    label: '(GMT+01:00) Europe, Guernsey',
    value: 'Europe/Guernsey',
  },
  {
    label: '(GMT+01:00) Europe, Isle of Man',
    value: 'Europe/Isle_of_Man',
  },
  {
    label: '(GMT+01:00) Europe, Jersey',
    value: 'Europe/Jersey',
  },
  {
    label: '(GMT+01:00) Europe, Lisbon',
    value: 'Europe/Lisbon',
  },
  {
    label: '(GMT+01:00) Europe, London',
    value: 'Europe/London',
  },
  {
    label: '(GMT+02:00) Africa, Blantyre',
    value: 'Africa/Blantyre',
  },
  {
    label: '(GMT+02:00) Africa, Bujumbura',
    value: 'Africa/Bujumbura',
  },
  {
    label: '(GMT+02:00) Africa, Ceuta',
    value: 'Africa/Ceuta',
  },
  {
    label: '(GMT+02:00) Africa, Gaborone',
    value: 'Africa/Gaborone',
  },
  {
    label: '(GMT+02:00) Africa, Harare',
    value: 'Africa/Harare',
  },
  {
    label: '(GMT+02:00) Africa, Johannesburg',
    value: 'Africa/Johannesburg',
  },
  {
    label: '(GMT+02:00) Africa, Juba',
    value: 'Africa/Juba',
  },
  {
    label: '(GMT+02:00) Africa, Khartoum',
    value: 'Africa/Khartoum',
  },
  {
    label: '(GMT+02:00) Africa, Kigali',
    value: 'Africa/Kigali',
  },
  {
    label: '(GMT+02:00) Africa, Lubumbashi',
    value: 'Africa/Lubumbashi',
  },
  {
    label: '(GMT+02:00) Africa, Lusaka',
    value: 'Africa/Lusaka',
  },
  {
    label: '(GMT+02:00) Africa, Maputo',
    value: 'Africa/Maputo',
  },
  {
    label: '(GMT+02:00) Africa, Maseru',
    value: 'Africa/Maseru',
  },
  {
    label: '(GMT+02:00) Africa, Mbabane',
    value: 'Africa/Mbabane',
  },
  {
    label: '(GMT+02:00) Africa, Tripoli',
    value: 'Africa/Tripoli',
  },
  {
    label: '(GMT+02:00) Africa, Windhoek',
    value: 'Africa/Windhoek',
  },
  {
    label: '(GMT+02:00) Antarctica, Troll',
    value: 'Antarctica/Troll',
  },
  {
    label: '(GMT+02:00) Arctic, Longyearbyen',
    value: 'Arctic/Longyearbyen',
  },
  {
    label: '(GMT+02:00) Europe, Amsterdam',
    value: 'Europe/Amsterdam',
  },
  {
    label: '(GMT+02:00) Europe, Andorra',
    value: 'Europe/Andorra',
  },
  {
    label: '(GMT+02:00) Europe, Belgrade',
    value: 'Europe/Belgrade',
  },
  {
    label: '(GMT+02:00) Europe, Berlin',
    value: 'Europe/Berlin',
  },
  {
    label: '(GMT+02:00) Europe, Bratislava',
    value: 'Europe/Bratislava',
  },
  {
    label: '(GMT+02:00) Europe, Brussels',
    value: 'Europe/Brussels',
  },
  {
    label: '(GMT+02:00) Europe, Budapest',
    value: 'Europe/Budapest',
  },
  {
    label: '(GMT+02:00) Europe, Busingen',
    value: 'Europe/Busingen',
  },
  {
    label: '(GMT+02:00) Europe, Copenhagen',
    value: 'Europe/Copenhagen',
  },
  {
    label: '(GMT+02:00) Europe, Gibraltar',
    value: 'Europe/Gibraltar',
  },
  {
    label: '(GMT+02:00) Europe, Kaliningrad',
    value: 'Europe/Kaliningrad',
  },
  {
    label: '(GMT+02:00) Europe, Ljubljana',
    value: 'Europe/Ljubljana',
  },
  {
    label: '(GMT+02:00) Europe, Luxembourg',
    value: 'Europe/Luxembourg',
  },
  {
    label: '(GMT+02:00) Europe, Madrid',
    value: 'Europe/Madrid',
  },
  {
    label: '(GMT+02:00) Europe, Malta',
    value: 'Europe/Malta',
  },
  {
    label: '(GMT+02:00) Europe, Monaco',
    value: 'Europe/Monaco',
  },
  {
    label: '(GMT+02:00) Europe, Oslo',
    value: 'Europe/Oslo',
  },
  {
    label: '(GMT+02:00) Europe, Paris',
    value: 'Europe/Paris',
  },
  {
    label: '(GMT+02:00) Europe, Podgorica',
    value: 'Europe/Podgorica',
  },
  {
    label: '(GMT+02:00) Europe, Prague',
    value: 'Europe/Prague',
  },
  {
    label: '(GMT+02:00) Europe, Rome',
    value: 'Europe/Rome',
  },
  {
    label: '(GMT+02:00) Europe, San Marino',
    value: 'Europe/San_Marino',
  },
  {
    label: '(GMT+02:00) Europe, Sarajevo',
    value: 'Europe/Sarajevo',
  },
  {
    label: '(GMT+02:00) Europe, Skopje',
    value: 'Europe/Skopje',
  },
  {
    label: '(GMT+02:00) Europe, Stockholm',
    value: 'Europe/Stockholm',
  },
  {
    label: '(GMT+02:00) Europe, Tirane',
    value: 'Europe/Tirane',
  },
  {
    label: '(GMT+02:00) Europe, Vaduz',
    value: 'Europe/Vaduz',
  },
  {
    label: '(GMT+02:00) Europe, Vatican',
    value: 'Europe/Vatican',
  },
  {
    label: '(GMT+02:00) Europe, Vienna',
    value: 'Europe/Vienna',
  },
  {
    label: '(GMT+02:00) Europe, Warsaw',
    value: 'Europe/Warsaw',
  },
  {
    label: '(GMT+02:00) Europe, Zagreb',
    value: 'Europe/Zagreb',
  },
  {
    label: '(GMT+02:00) Europe, Zurich',
    value: 'Europe/Zurich',
  },
  {
    label: '(GMT+03:00) Africa, Addis Ababa',
    value: 'Africa/Addis_Ababa',
  },
  {
    label: '(GMT+03:00) Africa, Asmara',
    value: 'Africa/Asmara',
  },
  {
    label: '(GMT+03:00) Africa, Cairo',
    value: 'Africa/Cairo',
  },
  {
    label: '(GMT+03:00) Africa, Dar es Salaam',
    value: 'Africa/Dar_es_Salaam',
  },
  {
    label: '(GMT+03:00) Africa, Djibouti',
    value: 'Africa/Djibouti',
  },
  {
    label: '(GMT+03:00) Africa, Kampala',
    value: 'Africa/Kampala',
  },
  {
    label: '(GMT+03:00) Africa, Mogadishu',
    value: 'Africa/Mogadishu',
  },
  {
    label: '(GMT+03:00) Africa, Nairobi',
    value: 'Africa/Nairobi',
  },
  {
    label: '(GMT+03:00) Antarctica, Syowa',
    value: 'Antarctica/Syowa',
  },
  {
    label: '(GMT+03:00) Asia, Aden',
    value: 'Asia/Aden',
  },
  {
    label: '(GMT+03:00) Asia, Amman',
    value: 'Asia/Amman',
  },
  {
    label: '(GMT+03:00) Asia, Baghdad',
    value: 'Asia/Baghdad',
  },
  {
    label: '(GMT+03:00) Asia, Bahrain',
    value: 'Asia/Bahrain',
  },
  {
    label: '(GMT+03:00) Asia, Beirut',
    value: 'Asia/Beirut',
  },
  {
    label: '(GMT+03:00) Asia, Damascus',
    value: 'Asia/Damascus',
  },
  {
    label: '(GMT+03:00) Asia, Famagusta',
    value: 'Asia/Famagusta',
  },
  {
    label: '(GMT+03:00) Asia, Gaza',
    value: 'Asia/Gaza',
  },
  {
    label: '(GMT+03:00) Asia, Hebron',
    value: 'Asia/Hebron',
  },
  {
    label: '(GMT+03:00) Asia, Jerusalem',
    value: 'Asia/Jerusalem',
  },
  {
    label: '(GMT+03:00) Asia, Kuwait',
    value: 'Asia/Kuwait',
  },
  {
    label: '(GMT+03:00) Asia, Nicosia',
    value: 'Asia/Nicosia',
  },
  {
    label: '(GMT+03:00) Asia, Qatar',
    value: 'Asia/Qatar',
  },
  {
    label: '(GMT+03:00) Asia, Riyadh',
    value: 'Asia/Riyadh',
  },
  {
    label: '(GMT+03:00) Europe, Athens',
    value: 'Europe/Athens',
  },
  {
    label: '(GMT+03:00) Europe, Bucharest',
    value: 'Europe/Bucharest',
  },
  {
    label: '(GMT+03:00) Europe, Chisinau',
    value: 'Europe/Chisinau',
  },
  {
    label: '(GMT+03:00) Europe, Helsinki',
    value: 'Europe/Helsinki',
  },
  {
    label: '(GMT+03:00) Europe, Istanbul',
    value: 'Europe/Istanbul',
  },
  {
    label: '(GMT+03:00) Europe, Kirov',
    value: 'Europe/Kirov',
  },
  {
    label: '(GMT+03:00) Europe, Kyiv',
    value: 'Europe/Kyiv',
  },
  {
    label: '(GMT+03:00) Europe, Mariehamn',
    value: 'Europe/Mariehamn',
  },
  {
    label: '(GMT+03:00) Europe, Minsk',
    value: 'Europe/Minsk',
  },
  {
    label: '(GMT+03:00) Europe, Moscow',
    value: 'Europe/Moscow',
  },
  {
    label: '(GMT+03:00) Europe, Riga',
    value: 'Europe/Riga',
  },
  {
    label: '(GMT+03:00) Europe, Simferopol',
    value: 'Europe/Simferopol',
  },
  {
    label: '(GMT+03:00) Europe, Sofia',
    value: 'Europe/Sofia',
  },
  {
    label: '(GMT+03:00) Europe, Tallinn',
    value: 'Europe/Tallinn',
  },
  {
    label: '(GMT+03:00) Europe, Vilnius',
    value: 'Europe/Vilnius',
  },
  {
    label: '(GMT+03:00) Europe, Volgograd',
    value: 'Europe/Volgograd',
  },
  {
    label: '(GMT+03:00) Indian, Antananarivo',
    value: 'Indian/Antananarivo',
  },
  {
    label: '(GMT+03:00) Indian, Comoro',
    value: 'Indian/Comoro',
  },
  {
    label: '(GMT+03:00) Indian, Mayotte',
    value: 'Indian/Mayotte',
  },
  {
    label: '(GMT+03:30) Asia, Tehran',
    value: 'Asia/Tehran',
  },
  {
    label: '(GMT+04:00) Asia, Baku',
    value: 'Asia/Baku',
  },
  {
    label: '(GMT+04:00) Asia, Dubai',
    value: 'Asia/Dubai',
  },
  {
    label: '(GMT+04:00) Asia, Muscat',
    value: 'Asia/Muscat',
  },
  {
    label: '(GMT+04:00) Asia, Tbilisi',
    value: 'Asia/Tbilisi',
  },
  {
    label: '(GMT+04:00) Asia, Yerevan',
    value: 'Asia/Yerevan',
  },
  {
    label: '(GMT+04:00) Europe, Astrakhan',
    value: 'Europe/Astrakhan',
  },
  {
    label: '(GMT+04:00) Europe, Samara',
    value: 'Europe/Samara',
  },
  {
    label: '(GMT+04:00) Europe, Saratov',
    value: 'Europe/Saratov',
  },
  {
    label: '(GMT+04:00) Europe, Ulyanovsk',
    value: 'Europe/Ulyanovsk',
  },
  {
    label: '(GMT+04:00) Indian, Mahe',
    value: 'Indian/Mahe',
  },
  {
    label: '(GMT+04:00) Indian, Mauritius',
    value: 'Indian/Mauritius',
  },
  {
    label: '(GMT+04:00) Indian, Reunion',
    value: 'Indian/Reunion',
  },
  {
    label: '(GMT+04:30) Asia, Kabul',
    value: 'Asia/Kabul',
  },
  {
    label: '(GMT+05:00) Antarctica, Mawson',
    value: 'Antarctica/Mawson',
  },
  {
    label: '(GMT+05:00) Asia, Aqtau',
    value: 'Asia/Aqtau',
  },
  {
    label: '(GMT+05:00) Asia, Aqtobe',
    value: 'Asia/Aqtobe',
  },
  {
    label: '(GMT+05:00) Asia, Ashgabat',
    value: 'Asia/Ashgabat',
  },
  {
    label: '(GMT+05:00) Asia, Atyrau',
    value: 'Asia/Atyrau',
  },
  {
    label: '(GMT+05:00) Asia, Dushanbe',
    value: 'Asia/Dushanbe',
  },
  {
    label: '(GMT+05:00) Asia, Karachi',
    value: 'Asia/Karachi',
  },
  {
    label: '(GMT+05:00) Asia, Oral',
    value: 'Asia/Oral',
  },
  {
    label: '(GMT+05:00) Asia, Qyzylorda',
    value: 'Asia/Qyzylorda',
  },
  {
    label: '(GMT+05:00) Asia, Samarkand',
    value: 'Asia/Samarkand',
  },
  {
    label: '(GMT+05:00) Asia, Tashkent',
    value: 'Asia/Tashkent',
  },
  {
    label: '(GMT+05:00) Asia, Yekaterinburg',
    value: 'Asia/Yekaterinburg',
  },
  {
    label: '(GMT+05:00) Indian, Kerguelen',
    value: 'Indian/Kerguelen',
  },
  {
    label: '(GMT+05:00) Indian, Maldives',
    value: 'Indian/Maldives',
  },
  {
    label: '(GMT+05:30) Asia, Colombo',
    value: 'Asia/Colombo',
  },
  {
    label: '(GMT+05:30) Asia, Kolkata',
    value: 'Asia/Kolkata',
  },
  {
    label: '(GMT+05:45) Asia, Kathmandu',
    value: 'Asia/Kathmandu',
  },
  {
    label: '(GMT+06:00) Antarctica, Vostok',
    value: 'Antarctica/Vostok',
  },
  {
    label: '(GMT+06:00) Asia, Almaty',
    value: 'Asia/Almaty',
  },
  {
    label: '(GMT+06:00) Asia, Bishkek',
    value: 'Asia/Bishkek',
  },
  {
    label: '(GMT+06:00) Asia, Dhaka',
    value: 'Asia/Dhaka',
  },
  {
    label: '(GMT+06:00) Asia, Omsk',
    value: 'Asia/Omsk',
  },
  {
    label: '(GMT+06:00) Asia, Qostanay',
    value: 'Asia/Qostanay',
  },
  {
    label: '(GMT+06:00) Asia, Thimphu',
    value: 'Asia/Thimphu',
  },
  {
    label: '(GMT+06:00) Asia, Urumqi',
    value: 'Asia/Urumqi',
  },
  {
    label: '(GMT+06:00) Indian, Chagos',
    value: 'Indian/Chagos',
  },
  {
    label: '(GMT+06:30) Asia, Yangon',
    value: 'Asia/Yangon',
  },
  {
    label: '(GMT+06:30) Indian, Cocos',
    value: 'Indian/Cocos',
  },
  {
    label: '(GMT+07:00) Antarctica, Davis',
    value: 'Antarctica/Davis',
  },
  {
    label: '(GMT+07:00) Asia, Bangkok',
    value: 'Asia/Bangkok',
  },
  {
    label: '(GMT+07:00) Asia, Barnaul',
    value: 'Asia/Barnaul',
  },
  {
    label: '(GMT+07:00) Asia, Ho Chi Minh',
    value: 'Asia/Ho_Chi_Minh',
  },
  {
    label: '(GMT+07:00) Asia, Hovd',
    value: 'Asia/Hovd',
  },
  {
    label: '(GMT+07:00) Asia, Jakarta',
    value: 'Asia/Jakarta',
  },
  {
    label: '(GMT+07:00) Asia, Krasnoyarsk',
    value: 'Asia/Krasnoyarsk',
  },
  {
    label: '(GMT+07:00) Asia, Novokuznetsk',
    value: 'Asia/Novokuznetsk',
  },
  {
    label: '(GMT+07:00) Asia, Novosibirsk',
    value: 'Asia/Novosibirsk',
  },
  {
    label: '(GMT+07:00) Asia, Phnom Penh',
    value: 'Asia/Phnom_Penh',
  },
  {
    label: '(GMT+07:00) Asia, Pontianak',
    value: 'Asia/Pontianak',
  },
  {
    label: '(GMT+07:00) Asia, Tomsk',
    value: 'Asia/Tomsk',
  },
  {
    label: '(GMT+07:00) Asia, Vientiane',
    value: 'Asia/Vientiane',
  },
  {
    label: '(GMT+07:00) Indian, Christmas',
    value: 'Indian/Christmas',
  },
  {
    label: '(GMT+08:00) Asia, Brunei',
    value: 'Asia/Brunei',
  },
  {
    label: '(GMT+08:00) Asia, Choibalsan',
    value: 'Asia/Choibalsan',
  },
  {
    label: '(GMT+08:00) Asia, Hong Kong',
    value: 'Asia/Hong_Kong',
  },
  {
    label: '(GMT+08:00) Asia, Irkutsk',
    value: 'Asia/Irkutsk',
  },
  {
    label: '(GMT+08:00) Asia, Kuala Lumpur',
    value: 'Asia/Kuala_Lumpur',
  },
  {
    label: '(GMT+08:00) Asia, Kuching',
    value: 'Asia/Kuching',
  },
  {
    label: '(GMT+08:00) Asia, Macau',
    value: 'Asia/Macau',
  },
  {
    label: '(GMT+08:00) Asia, Makassar',
    value: 'Asia/Makassar',
  },
  {
    label: '(GMT+08:00) Asia, Manila',
    value: 'Asia/Manila',
  },
  {
    label: '(GMT+08:00) Asia, Shanghai',
    value: 'Asia/Shanghai',
  },
  {
    label: '(GMT+08:00) Asia, Singapore',
    value: 'Asia/Singapore',
  },
  {
    label: '(GMT+08:00) Asia, Taipei',
    value: 'Asia/Taipei',
  },
  {
    label: '(GMT+08:00) Asia, Ulaanbaatar',
    value: 'Asia/Ulaanbaatar',
  },
  {
    label: '(GMT+08:00) Australia, Perth',
    value: 'Australia/Perth',
  },
  {
    label: '(GMT+08:45) Australia, Eucla',
    value: 'Australia/Eucla',
  },
  {
    label: '(GMT+09:00) Asia, Chita',
    value: 'Asia/Chita',
  },
  {
    label: '(GMT+09:00) Asia, Dili',
    value: 'Asia/Dili',
  },
  {
    label: '(GMT+09:00) Asia, Jayapura',
    value: 'Asia/Jayapura',
  },
  {
    label: '(GMT+09:00) Asia, Khandyga',
    value: 'Asia/Khandyga',
  },
  {
    label: '(GMT+09:00) Asia, Pyongyang',
    value: 'Asia/Pyongyang',
  },
  {
    label: '(GMT+09:00) Asia, Seoul',
    value: 'Asia/Seoul',
  },
  {
    label: '(GMT+09:00) Asia, Tokyo',
    value: 'Asia/Tokyo',
  },
  {
    label: '(GMT+09:00) Asia, Yakutsk',
    value: 'Asia/Yakutsk',
  },
  {
    label: '(GMT+09:00) Pacific, Palau',
    value: 'Pacific/Palau',
  },
  {
    label: '(GMT+09:30) Australia, Adelaide',
    value: 'Australia/Adelaide',
  },
  {
    label: '(GMT+09:30) Australia, Broken Hill',
    value: 'Australia/Broken_Hill',
  },
  {
    label: '(GMT+09:30) Australia, Darwin',
    value: 'Australia/Darwin',
  },
  {
    label: '(GMT+10:00) Antarctica, DumontDUrville',
    value: 'Antarctica/DumontDUrville',
  },
  {
    label: '(GMT+10:00) Antarctica, Macquarie',
    value: 'Antarctica/Macquarie',
  },
  {
    label: '(GMT+10:00) Asia, Ust-Nera',
    value: 'Asia/Ust-Nera',
  },
  {
    label: '(GMT+10:00) Asia, Vladivostok',
    value: 'Asia/Vladivostok',
  },
  {
    label: '(GMT+10:00) Australia, Brisbane',
    value: 'Australia/Brisbane',
  },
  {
    label: '(GMT+10:00) Australia, Hobart',
    value: 'Australia/Hobart',
  },
  {
    label: '(GMT+10:00) Australia, Lindeman',
    value: 'Australia/Lindeman',
  },
  {
    label: '(GMT+10:00) Australia, Melbourne',
    value: 'Australia/Melbourne',
  },
  {
    label: '(GMT+10:00) Australia, Sydney',
    value: 'Australia/Sydney',
  },
  {
    label: '(GMT+10:00) Pacific, Chuuk',
    value: 'Pacific/Chuuk',
  },
  {
    label: '(GMT+10:00) Pacific, Guam',
    value: 'Pacific/Guam',
  },
  {
    label: '(GMT+10:00) Pacific, Port Moresby',
    value: 'Pacific/Port_Moresby',
  },
  {
    label: '(GMT+10:00) Pacific, Saipan',
    value: 'Pacific/Saipan',
  },
  {
    label: '(GMT+10:30) Australia, Lord Howe',
    value: 'Australia/Lord_Howe',
  },
  {
    label: '(GMT+11:00) Antarctica, Casey',
    value: 'Antarctica/Casey',
  },
  {
    label: '(GMT+11:00) Asia, Magadan',
    value: 'Asia/Magadan',
  },
  {
    label: '(GMT+11:00) Asia, Sakhalin',
    value: 'Asia/Sakhalin',
  },
  {
    label: '(GMT+11:00) Asia, Srednekolymsk',
    value: 'Asia/Srednekolymsk',
  },
  {
    label: '(GMT+11:00) Pacific, Bougainville',
    value: 'Pacific/Bougainville',
  },
  {
    label: '(GMT+11:00) Pacific, Efate',
    value: 'Pacific/Efate',
  },
  {
    label: '(GMT+11:00) Pacific, Guadalcanal',
    value: 'Pacific/Guadalcanal',
  },
  {
    label: '(GMT+11:00) Pacific, Kosrae',
    value: 'Pacific/Kosrae',
  },
  {
    label: '(GMT+11:00) Pacific, Norfolk',
    value: 'Pacific/Norfolk',
  },
  {
    label: '(GMT+11:00) Pacific, Noumea',
    value: 'Pacific/Noumea',
  },
  {
    label: '(GMT+11:00) Pacific, Pohnpei',
    value: 'Pacific/Pohnpei',
  },
  {
    label: '(GMT+12:00) Antarctica, McMurdo',
    value: 'Antarctica/McMurdo',
  },
  {
    label: '(GMT+12:00) Asia, Anadyr',
    value: 'Asia/Anadyr',
  },
  {
    label: '(GMT+12:00) Asia, Kamchatka',
    value: 'Asia/Kamchatka',
  },
  {
    label: '(GMT+12:00) Pacific, Auckland',
    value: 'Pacific/Auckland',
  },
  {
    label: '(GMT+12:00) Pacific, Fiji',
    value: 'Pacific/Fiji',
  },
  {
    label: '(GMT+12:00) Pacific, Funafuti',
    value: 'Pacific/Funafuti',
  },
  {
    label: '(GMT+12:00) Pacific, Kwajalein',
    value: 'Pacific/Kwajalein',
  },
  {
    label: '(GMT+12:00) Pacific, Majuro',
    value: 'Pacific/Majuro',
  },
  {
    label: '(GMT+12:00) Pacific, Nauru',
    value: 'Pacific/Nauru',
  },
  {
    label: '(GMT+12:00) Pacific, Tarawa',
    value: 'Pacific/Tarawa',
  },
  {
    label: '(GMT+12:00) Pacific, Wake',
    value: 'Pacific/Wake',
  },
  {
    label: '(GMT+12:00) Pacific, Wallis',
    value: 'Pacific/Wallis',
  },
  {
    label: '(GMT+12:45) Pacific, Chatham',
    value: 'Pacific/Chatham',
  },
  {
    label: '(GMT+13:00) Pacific, Apia',
    value: 'Pacific/Apia',
  },
  {
    label: '(GMT+13:00) Pacific, Fakaofo',
    value: 'Pacific/Fakaofo',
  },
  {
    label: '(GMT+13:00) Pacific, Kanton',
    value: 'Pacific/Kanton',
  },
  {
    label: '(GMT+13:00) Pacific, Tongatapu',
    value: 'Pacific/Tongatapu',
  },
  {
    label: '(GMT+14:00) Pacific, Kiritimati',
    value: 'Pacific/Kiritimati',
  },
];
