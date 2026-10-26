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

type Snapshot = {
  date: string;
  completions: Record<string, number>;
  conversions: Record<string, number>;
};

/** Today's date (YYYY-MM-DD) in the timezone of the site. */
function todayIn(timezone: string | null | undefined): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function takeSnapshot(
  token: string,
  siteId: string,
  goalId: string | undefined
): Promise<{ snapshot: Snapshot; goals: PrivatusGoal[] }> {
  const site = await privatusApiCall<{ timezone?: string | null }>({
    token,
    path: `/sites/${segment(siteId)}.json`,
  });
  const goals = (await listGoals(token, siteId, { period: 'today' })).filter(
    (goal) => !goalId || goal.id === goalId
  );
  const snapshot: Snapshot = {
    date: todayIn(site.timezone),
    completions: {},
    conversions: {},
  };
  for (const goal of goals) {
    snapshot.completions[goal.id] = goal.stats?.completions ?? 0;
    snapshot.conversions[goal.id] = goal.stats?.conversions ?? 0;
  }
  return { snapshot, goals };
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
    completions_today: goal.stats?.completions ?? 0,
    conversions_today: goal.stats?.conversions ?? 0,
    conversion_rate_today_percent: goal.stats?.conversion_rate ?? 0,
    value_today_cents: goal.stats?.value ?? 0,
    date,
    checked_at: new Date().toISOString(),
  };
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
      "Fires when the number of times a goal was completed today goes up since the last check, one event per goal that grew, with how many new completions there were. Counts restart at midnight in the site's timezone.",
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
    completions_today: 14,
    conversions_today: 13,
    conversion_rate_today_percent: 6.4,
    value_today_cents: 0,
    date: '2026-10-26',
    checked_at: '2026-10-26T09:15:00.000Z',
  },
  async onEnable(context) {
    const { snapshot } = await takeSnapshot(
      context.auth.secret_text,
      context.propsValue.site_id,
      context.propsValue.goal_id ?? undefined
    );
    await context.store.put<Snapshot>(STORE_KEY, snapshot, StoreScope.FLOW);
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY, StoreScope.FLOW);
  },
  async test(context) {
    const { snapshot, goals } = await takeSnapshot(
      context.auth.secret_text,
      context.propsValue.site_id,
      context.propsValue.goal_id ?? undefined
    );
    return goals
      .filter((goal) => (goal.stats?.completions ?? 0) > 0)
      .slice(0, 5)
      .map((goal) =>
        toEvent(
          context.propsValue.site_id,
          snapshot.date,
          goal,
          goal.stats?.completions ?? 0,
          goal.stats?.conversions ?? 0
        )
      );
  },
  async run(context) {
    const previous = await context.store.get<Snapshot>(
      STORE_KEY,
      StoreScope.FLOW
    );
    const { snapshot, goals } = await takeSnapshot(
      context.auth.secret_text,
      context.propsValue.site_id,
      context.propsValue.goal_id ?? undefined
    );
    await context.store.put<Snapshot>(STORE_KEY, snapshot, StoreScope.FLOW);
    if (!previous) {
      return [];
    }
    const sameDay = previous.date === snapshot.date;
    const events = [];
    for (const goal of goals) {
      const completions = snapshot.completions[goal.id] ?? 0;
      const conversions = snapshot.conversions[goal.id] ?? 0;
      const before = sameDay ? previous.completions[goal.id] ?? 0 : 0;
      const conversionsBefore = sameDay ? previous.conversions[goal.id] ?? 0 : 0;
      if (completions > before) {
        events.push(
          toEvent(
            context.propsValue.site_id,
            snapshot.date,
            goal,
            completions - before,
            Math.max(0, conversions - conversionsBefore)
          )
        );
      }
    }
    return events;
  },
});
