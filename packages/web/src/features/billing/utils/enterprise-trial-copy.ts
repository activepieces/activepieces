import dayjs from 'dayjs';
import { t } from 'i18next';

import type { EnterpriseTrial } from '../hooks/enterprise-trial-hooks';

function statusLine(trial: EnterpriseTrial): string {
  if (trial.endsToday) {
    return t('Enterprise plan · trial ends today');
  }
  if (trial.ending) {
    return t('Enterprise plan · trial ends tomorrow');
  }
  return t(
    'Enterprise plan · trial, {count, plural, =1 {1 day left} other {# days left}}',
    { count: trial.daysLeft },
  );
}

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
  statusLine,
  daysLeftLabel,
  endsSentence,
  details,
};
