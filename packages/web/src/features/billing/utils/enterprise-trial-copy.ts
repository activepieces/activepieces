import dayjs from 'dayjs';
import { t } from 'i18next';

import type { EnterpriseTrial } from '../hooks/enterprise-trial-hooks';

function daysLeftLabel(trial: EnterpriseTrial): string {
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

function cardStatus(trial: EnterpriseTrial): string {
  if (trial.endsToday) {
    return t('last day');
  }
  return t('{count, plural, =1 {1 day left} other {# days left}}', {
    count: trial.ending ? 1 : trial.daysLeft,
  });
}

function sidebarDetail(trial: EnterpriseTrial): string {
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

function endsSentence(trial: EnterpriseTrial): string {
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

function details(trial: EnterpriseTrial): string {
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

export const enterpriseTrialCopy = {
  daysLeftLabel,
  sidebarDetail,
  cardStatus,
  endsSentence,
  details,
};
