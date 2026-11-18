import {
  createTrigger,
  isNil,
  Property,
  Store,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { getCalendars } from '../common/helper';
import { CalendarObject } from '../common/types';
import { calendarOutputSchema } from '../output-schemas';

const LEGACY_KNOWN_CALENDARS_STORE_KEY = 'calendars';
const KNOWN_CALENDARS_STORE_KEY = 'calendars_with_hidden';
const SAMPLE_SIZE = 5;

export const newCalendar = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_calendar',
  classification: 'READ',
  displayName: 'New Calendar',
  description: 'Fires when a new calendar is created or becomes accessible.',
  aiMetadata: {
    description: 'Fires when a calendar newly appears in the connected account\'s calendar list, whether created or shared in, detected by polling. Each fired item is the new calendar. Can be filtered by access role, a name/description text match, and an option to exclude shared calendars; changing a filter later does not fire for calendars that already existed, and hiding a calendar from the list and showing it again does not fire it.',
  },
  propertyGroups: [
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['access_role_filter', 'calendar_name_filter', 'exclude_shared'],
    },
  ],
  props: {
    access_role_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Access Role Filter',
      description: 'Leave empty to fire for every access role.',
      required: false,
      options: {
        options: [
          { label: 'Owner', value: 'owner' },
          { label: 'Writer', value: 'writer' },
          { label: 'Reader', value: 'reader' },
          { label: 'Free/Busy Reader', value: 'freeBusyReader' },
        ],
      },
    }),
    calendar_name_filter: Property.ShortText({
      displayName: 'Calendar Name Filter',
      description: 'Only calendars whose name or description contain this.',
      required: false,
    }),
    exclude_shared: Property.Checkbox({
      displayName: 'Exclude Shared Calendars',
      description: 'Fires only for calendars you own.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: calendarOutputSchema,
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'sample_calendar_id@group.calendar.google.com',
    summary: 'New Project Team Calendar',
    description: 'A shared calendar for the new project team.',
    timeZone: 'Asia/Kolkata',
    backgroundColor: '#9fe1e7',
    foregroundColor: '#000000',
    accessRole: 'owner',
    isOwned: true,
    isShared: false,
    calendarType: 'owned',
    primary: false,
  },

  async onEnable(context) {
    if (
      context.isRepublish &&
      !isNil(await readKnown({ store: context.store }))
    ) {
      return;
    }
    const calendars = await getCalendars(context.auth, undefined, {
      showHidden: true,
    });
    await saveKnown({ store: context.store, calendars });
  },

  async onDisable() {
    return;
  },

  async run(context) {
    const calendars = await getCalendars(context.auth, undefined, {
      showHidden: true,
    });
    const known = await readKnown({ store: context.store });
    if (isNil(known)) {
      await saveKnown({ store: context.store, calendars });
      return [];
    }
    const knownIds = new Set(known.ids);
    const knownIncludesHidden = known.includesHidden;
    const fresh = filterCalendars({
      calendars: calendars.filter(
        (calendar) =>
          !knownIds.has(calendar.id) &&
          (knownIncludesHidden || calendar.hidden !== true)
      ),
      filters: context.propsValue,
    });
    await saveKnown({ store: context.store, calendars });
    return fresh.map((calendar) => toOutput({ calendar }));
  },

  async test(context) {
    const calendars = await getCalendars(context.auth);
    return filterCalendars({ calendars, filters: context.propsValue })
      .slice(-SAMPLE_SIZE)
      .reverse()
      .map((calendar) => toOutput({ calendar }));
  },
});

async function saveKnown({
  store,
  calendars,
}: {
  store: Store;
  calendars: CalendarObject[];
}): Promise<void> {
  await store.put<string[]>(
    KNOWN_CALENDARS_STORE_KEY,
    calendars.map((calendar) => calendar.id)
  );
}

async function readKnown({
  store,
}: {
  store: Store;
}): Promise<{ ids: string[]; includesHidden: boolean } | null> {
  const current = await store.get<string[]>(KNOWN_CALENDARS_STORE_KEY);
  if (Array.isArray(current)) {
    return { ids: current, includesHidden: true };
  }
  const legacy = await store.get<string[]>(LEGACY_KNOWN_CALENDARS_STORE_KEY);
  if (Array.isArray(legacy)) {
    return { ids: legacy, includesHidden: false };
  }
  return null;
}

function filterCalendars({
  calendars,
  filters,
}: {
  calendars: CalendarObject[];
  filters: CalendarFilters;
}): CalendarObject[] {
  const { access_role_filter, calendar_name_filter, exclude_shared } = filters;
  const searchTerm = (calendar_name_filter ?? '').toLowerCase().trim();
  return calendars.filter((calendar) => {
    if (
      access_role_filter &&
      access_role_filter.length > 0 &&
      !access_role_filter.includes(calendar.accessRole)
    ) {
      return false;
    }
    if (
      searchTerm &&
      !calendar.summary?.toLowerCase().includes(searchTerm) &&
      !calendar.description?.toLowerCase().includes(searchTerm)
    ) {
      return false;
    }
    if (exclude_shared && !isOwned({ calendar })) {
      return false;
    }
    return true;
  });
}

function isOwned({ calendar }: { calendar: CalendarObject }): boolean {
  return calendar.accessRole === 'owner' || calendar.primary === true;
}

function toOutput({ calendar }: { calendar: CalendarObject }) {
  return {
    ...calendar,
    isOwned: isOwned({ calendar }),
    isShared: !isOwned({ calendar }),
    calendarType:
      calendar.primary === true
        ? 'primary'
        : calendar.accessRole === 'owner'
        ? 'owned'
        : 'shared',
  };
}

type CalendarFilters = {
  access_role_filter?: string[];
  calendar_name_filter?: string;
  exclude_shared?: boolean;
};
