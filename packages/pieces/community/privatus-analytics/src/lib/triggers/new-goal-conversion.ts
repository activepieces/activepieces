import {
  createTrigger,
  StoreScope,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import {
  listGoals,
  PrivatusGoal,
  privatusApiCall,
  segment,
} from '../common/client';
import { goalDropdown, siteDropdown } from '../common/props';

const STORE_KEY = 'privatus_goal_counts';

/**
 * After a long pause (the poller was down), look back at most this many days.
 * Older completions are skipped instead of sending a burst of old events.
 */
const MAX_CATCH_UP_DAYS = 7;

type Snapshot = {
  date: string;
  completions: Record<string, number>;
  conversions: Record<string, number>;
};

type DayCounts = { date: string; goals: PrivatusGoal[] };

/**
 * Today's date (YYYY-MM-DD) in the timezone of the site. Sites store an IANA
 * timezone name, and the API counts a site without one in UTC, so this does
 * the same.
 */
export function todayIn(
  timezone: string | null | undefined,
  now: Date = new Date()
): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

/**
 * Gets the goal counts of one day. The day is asked for by its date, never as
 * "today", so the counts always belong to the date they are stored under,
 * even when a check runs right at midnight. The API reads the date in the
 * timezone of the site.
 */
async function countsOn(
  token: string,
  siteId: string,
  goalId: string | undefined,
  date: string
): Promise<DayCounts> {
  const goals = await listGoals(token, siteId, {
    period: 'custom',
    from: date,
    to: date,
  });
  return {
    date,
    goals: goals.filter((goal) => !goalId || goal.id === goalId),
  };
}

async function siteToday(token: string, siteId: string): Promise<string> {
  const site = await privatusApiCall<{ timezone?: string | null }>({
    token,
    path: `/sites/${segment(siteId)}.json`,
  });
  return todayIn(site.timezone);
}

function toSnapshot({ date, goals }: DayCounts): Snapshot {
  const snapshot: Snapshot = { date, completions: {}, conversions: {} };
  for (const goal of goals) {
    snapshot.completions[goal.id] = goal.stats?.completions ?? 0;
    snapshot.conversions[goal.id] = goal.stats?.conversions ?? 0;
  }
  return snapshot;
}

function isSnapshot(value: unknown): value is Snapshot {
  const snapshot = value as Snapshot | null | undefined;
  return (
    !!snapshot &&
    typeof snapshot.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(snapshot.date) &&
    typeof snapshot.completions === 'object' &&
    typeof snapshot.conversions === 'object'
  );
}

function toEvent(
  siteId: string,
  date: string,
  goal: PrivatusGoal,
  newCompletions: number,
  newConversions: number
) {
  return {
    site_id: siteId,
    goal_id: goal.id,
    goal_name: goal.name,
    goal_kind: goal.kind,
    new_completions: newCompletions,
    new_conversions: newConversions,
    date,
    day_completions: goal.stats?.completions ?? 0,
    day_conversions: goal.stats?.conversions ?? 0,
    day_conversion_rate_percent: goal.stats?.conversion_rate ?? 0,
    day_value_cents: goal.stats?.value ?? 0,
    checked_at: new Date().toISOString(),
  };
}

/** One event for each goal whose count of the day went up since `before`. */
function growth(
  siteId: string,
  day: DayCounts,
  before: Snapshot | undefined
) {
  const events = [];
  for (const goal of day.goals) {
    const completions = goal.stats?.completions ?? 0;
    const conversions = goal.stats?.conversions ?? 0;
    const completionsBefore = before?.completions[goal.id] ?? 0;
    const conversionsBefore = before?.conversions[goal.id] ?? 0;
    if (completions > completionsBefore) {
      events.push(
        toEvent(
          siteId,
          day.date,
          goal,
          completions - completionsBefore,
          Math.max(0, conversions - conversionsBefore)
        )
      );
    }
  }
  return events;
}

/**
 * The days that ended since the last check: the stored day itself, then
 * every full day after it up to yesterday, at most MAX_CATCH_UP_DAYS.
 */
export function endedDays(storedDate: string, today: string): string[] {
  const earliest = addDays(today, -MAX_CATCH_UP_DAYS);
  const days: string[] = [];
  let day = storedDate < earliest ? earliest : storedDate;
  while (day < today) {
    days.push(day);
    day = addDays(day, 1);
  }
  return days;
}

export const newGoalConversionTrigger = createTrigger({
  auth: privatusAnalyticsAuth,
  name: 'new_goal_conversion',
  classification: 'READ',
  displayName: 'New Goal Conversion',
  description:
    'Starts when a goal of your site is completed again, like a sign-up or a purchase. Checked every few minutes.',
  aiMetadata: {
    description:
      "Fires when the number of times a goal was completed on a day goes up since the last check, one event per goal that grew, with how many new completions there were. Days follow the site's timezone; when a day ends, its last completions are still sent, with the date they belong to.",
  },
  type: TriggerStrategy.POLLING,
  props: {
    site_id: siteDropdown,
    goal_id: goalDropdown,
  },
  sampleData: {
    site_id: 'pa_7Q2K9XH3AB',
    goal_id: 'goal_H51PY56S1P',
    goal_name: 'Signed up',
    goal_kind: 'event',
    new_completions: 2,
    new_conversions: 2,
    date: '2026-10-26',
    day_completions: 14,
    day_conversions: 13,
    day_conversion_rate_percent: 6.4,
    day_value_cents: 0,
    checked_at: '2026-10-26T09:15:00.000Z',
  },
  async onEnable(context) {
    const token = context.auth.secret_text;
    const siteId = context.propsValue.site_id;
    const today = await siteToday(token, siteId);
    const counts = await countsOn(
      token,
      siteId,
      context.propsValue.goal_id ?? undefined,
      today
    );
    await context.store.put<Snapshot>(
      STORE_KEY,
      toSnapshot(counts),
      StoreScope.FLOW
    );
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY, StoreScope.FLOW);
  },
  async test(context) {
    const token = context.auth.secret_text;
    const siteId = context.propsValue.site_id;
    const today = await siteToday(token, siteId);
    const counts = await countsOn(
      token,
      siteId,
      context.propsValue.goal_id ?? undefined,
      today
    );
    return growth(siteId, counts, undefined).slice(0, 5);
  },
  async run(context) {
    const token = context.auth.secret_text;
    const siteId = context.propsValue.site_id;
    const goalId = context.propsValue.goal_id ?? undefined;
    const stored = await context.store.get<Snapshot>(
      STORE_KEY,
      StoreScope.FLOW
    );
    const previous = isSnapshot(stored) ? stored : undefined;
    const today = await siteToday(token, siteId);
    const todayCounts = await countsOn(token, siteId, goalId, today);

    const events = [];
    if (previous && previous.date === today) {
      events.push(...growth(siteId, todayCounts, previous));
    } else if (previous && previous.date < today) {
      // The day changed since the last check. Send what came in on the
      // stored day after that check (from its final counts), then any full
      // days missed in between, then today so far.
      for (const day of endedDays(previous.date, today)) {
        const counts = await countsOn(token, siteId, goalId, day);
        events.push(
          ...growth(
            siteId,
            counts,
            day === previous.date ? previous : undefined
          )
        );
      }
      events.push(...growth(siteId, todayCounts, undefined));
    }
    // With no stored counts (first run), or a stored day later than today
    // (the site moved to a timezone further west), today's counts only
    // become the new starting point.

    // Saved last, so a failed request leaves the old counts in place and
    // the next check picks up from there.
    await context.store.put<Snapshot>(
      STORE_KEY,
      toSnapshot(todayCounts),
      StoreScope.FLOW
    );
    return events;
  },
});
