import dayjs from 'dayjs';
import { t } from 'i18next';

import type {
  SelfServeTrial,
  SeatGrace,
} from '../hooks/self-serve-trial-hooks';

function daysLeftLabel(trial: SelfServeTrial): string {
  if (trial.endsToday) {
    return t('Ends today');
  }
  if (trial.ending) {
    return t('Ends tomorrow');
  }
  return t('{count, plural, =1 {1 day left} other {# days left}}', {
    count: trial.daysLeft,
  });
}

function cardStatus(
  trial: Pick<SelfServeTrial, 'endsToday' | 'ending' | 'daysLeft'>,
): string {
  if (trial.endsToday) {
    return t('last day');
  }
  return t('{count, plural, =1 {1 day left} other {# days left}}', {
    count: trial.ending ? 1 : trial.daysLeft,
  });
}

function sidebarDetail(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  if (trial.endsToday) {
    return t('Ends today at {time}', { time: end.format('h:mm A') });
  }
  if (trial.ending) {
    return t('Ends tomorrow at {time}', { time: end.format('h:mm A') });
  }
  return t(
    '{count, plural, =1 {1 day left} other {# days left}}, ends {date}',
    { count: trial.daysLeft, date: end.format('MMM D') },
  );
}

function endsSentence(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  const time = end.format('h:mm A');
  if (trial.endsToday) {
    return t('Your Enterprise plan trial ends today at {time}.', { time });
  }
  if (trial.ending) {
    return t('Your Enterprise plan trial ends tomorrow at {time}.', { time });
  }
  return t('Your Enterprise plan trial ends on {date}.', {
    date: end.format('MMM D'),
  });
}

function details(trial: SelfServeTrial): string {
  const end = dayjs(trial.endsAt);
  const plan = trial.basePlanName;
  if (trial.endsToday) {
    return t(
      'Every Enterprise plan feature is on until today at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
      { time: end.format('h:mm A'), plan },
    );
  }
  if (trial.ending) {
    return t(
      'Every Enterprise plan feature is on until tomorrow at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
      { time: end.format('h:mm A'), plan },
    );
  }
  return t(
    'Every Enterprise plan feature is on until {date}. Then you are back on the {plan} plan. Your credits are not affected.',
    { date: end.format('MMM D'), plan },
  );
}

function seatGraceTooltip(grace: SeatGrace): string {
  const params = {
    seats: grace.seats,
    date: dayjs(grace.endsAt).format('MMM D'),
  };
  if (grace.isPlatformAdmin) {
    return t(
      "Users added during the trial beyond the plan's {seats, plural, =1 {1 seat} other {# seats}} will be deactivated on {date}. Manage seats, or upgrade to keep them.",
      params,
    );
  }
  return t(
    "Your Enterprise trial has ended. Users added during it beyond the plan's {seats, plural, =1 {1 seat} other {# seats}} lose access on {date} unless an admin upgrades.",
    params,
  );
}

function seatGraceSidebarDetail(grace: SeatGrace): string {
  return t('Extra users lose access {date}', {
    date: dayjs(grace.endsAt).format('MMM D'),
  });
}

function seatGraceNotice({
  count,
  plan,
  endsAt,
}: SeatGraceNoticeParams): string {
  return t(
    "{count, plural, =1 {1 user} other {# users}} added during the trial {count, plural, =1 {is} other {are}} over the {plan} plan's seats and will be deactivated on {date}.",
    { count, plan, date: dayjs(endsAt).format('MMM D') },
  );
}

export const selfServeTrialCopy = {
  daysLeftLabel,
  sidebarDetail,
  cardStatus,
  endsSentence,
  details,
  seatGraceTooltip,
  seatGraceSidebarDetail,
  seatGraceNotice,
};

type SeatGraceNoticeParams = {
  count: number;
  plan: string;
  endsAt: Date;
};
