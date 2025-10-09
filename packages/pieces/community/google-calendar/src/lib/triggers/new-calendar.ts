import {
  createTrigger,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../../';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { getCalendars } from '../common/helper';
import { CalendarObject } from '../common/types';

const polling: Polling<
  PiecePropValueSchema<typeof googleCalendarAuth>,
  {
    access_role_filter: string[] | undefined;
    calendar_name_filter: string | undefined;
    exclude_shared: boolean | undefined;
  }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, store, propsValue }) => {
    const { access_role_filter, calendar_name_filter, exclude_shared } =
      propsValue;

    const currentCalendars = await getCalendars(auth);

    let filteredCalendars = currentCalendars;

    if (access_role_filter && access_role_filter.length > 0) {
      filteredCalendars = filteredCalendars.filter((cal) =>
        access_role_filter.includes(cal.accessRole)
      );
    }

    if (calendar_name_filter && calendar_name_filter.trim()) {
      const searchTerm = calendar_name_filter.toLowerCase().trim();
      filteredCalendars = filteredCalendars.filter(
        (cal) =>
          cal.summary?.toLowerCase().includes(searchTerm) ||
          cal.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (exclude_shared) {
      filteredCalendars = filteredCalendars.filter(
        (cal) => cal.accessRole === 'owner' || cal.primary
      );
    }

    const currentCalendarIds = filteredCalendars.map((cal) => cal.id);

    const oldCalendarIds = (await store.get<string[]>('calendars')) || [];
    const oldCalendarIdsSet = new Set(oldCalendarIds);

    const newCalendars = filteredCalendars.filter(
      (cal) => !oldCalendarIdsSet.has(cal.id)
    );

    await store.put('calendars', currentCalendarIds);

    return newCalendars.map((cal) => ({
      id: cal.id,
      data: {
        ...cal,
        isOwned: cal.accessRole === 'owner' || cal.primary,
        isShared: cal.accessRole !== 'owner' && !cal.primary,
        calendarType: cal.primary
          ? 'primary'
          : cal.accessRole === 'owner'
          ? 'owned'
          : 'shared',
      },
    }));
  },
};

export const newCalendar = createTrigger({
  auth: googleCalendarAuth,
  name: 'new_calendar',
  displayName: 'New Calendar',
  description: 'Fires when a new calendar is created or becomes accessible.',
  props: {
    access_role_filter: Property.StaticMultiSelectDropdown({
      displayName: 'Access Role Filter',
      description:
        'Only trigger for calendars with specific access roles (optional)',
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
      description:
        'Only trigger for calendars containing this text in name or description (optional)',
      required: false,
    }),
    exclude_shared: Property.Checkbox({
      displayName: 'Exclude Shared Calendars',
      description: 'Only trigger for calendars you own, not shared calendars',
      required: false,
      defaultValue: false,
    }),
  },
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
    const calendars = await getCalendars(context.auth);

    const { access_role_filter, calendar_name_filter, exclude_shared } =
      context.propsValue;
    let filteredCalendars = calendars;

    if (access_role_filter && access_role_filter.length > 0) {
      filteredCalendars = filteredCalendars.filter((cal) =>
        access_role_filter.includes(cal.accessRole)
      );
    }

    if (calendar_name_filter && calendar_name_filter.trim()) {
      const searchTerm = calendar_name_filter.toLowerCase().trim();
      filteredCalendars = filteredCalendars.filter(
        (cal) =>
          cal.summary?.toLowerCase().includes(searchTerm) ||
          cal.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (exclude_shared) {
      filteredCalendars = filteredCalendars.filter(
        (cal) => cal.accessRole === 'owner' || cal.primary
      );
    }

    await context.store.put(
      'calendars',
      filteredCalendars.map((cal) => cal.id)
    );

    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },

  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },

  async test(context) {
    const calendars = await getCalendars(context.auth);
    const recentCalendars = calendars.slice(-1);
    return recentCalendars.map((cal: CalendarObject) => ({
      id: cal.id,
      data: {
        ...cal,
        isOwned: cal.accessRole === 'owner' || cal.primary,
        isShared: cal.accessRole !== 'owner' && !cal.primary,
        calendarType: cal.primary
          ? 'primary'
          : cal.accessRole === 'owner'
          ? 'owned'
          : 'shared',
      },
    }));
  },
});
