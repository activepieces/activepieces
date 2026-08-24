export const DEFAULT_USE_CASES: ExampleCardData[] = [
  { id: 'do-research', title: 'Do my research', prompt: 'Do my research' },
  { id: 'write-emails', title: 'Write my emails', prompt: 'Write my emails' },
  {
    id: 'prep-meetings',
    title: 'Prep me for meetings',
    prompt: 'Prep me for meetings',
  },
  { id: 'plan-week', title: 'Plan my week', prompt: 'Plan my week' },
  { id: 'make-slides', title: 'Make my slides', prompt: 'Make my slides' },
  {
    id: 'write-reports',
    title: 'Write my reports',
    prompt: 'Write my reports',
  },
  { id: 'write-posts', title: 'Write my posts', prompt: 'Write my posts' },
  { id: 'tame-inbox', title: 'Tame my inbox', prompt: 'Tame my inbox' },
  { id: 'run-my-day', title: 'Run my day', prompt: 'Run my day' },
  { id: 'run-socials', title: 'Run my socials', prompt: 'Run my socials' },
  {
    id: 'grow-following',
    title: 'Grow my following',
    prompt: 'Grow my following',
  },
  {
    id: 'fill-pipeline',
    title: 'Fill my pipeline',
    prompt: 'Fill my pipeline',
  },
  { id: 'chase-leads', title: 'Chase my leads', prompt: 'Chase my leads' },
  { id: 'close-deals', title: 'Close my deals', prompt: 'Close my deals' },
  {
    id: 'answer-customers',
    title: 'Answer my customers',
    prompt: 'Answer my customers',
  },
  {
    id: 'onboard-signups',
    title: 'Onboard my new signups',
    prompt: 'Onboard my new signups',
  },
  {
    id: 'get-invoices-paid',
    title: 'Get my invoices paid',
    prompt: 'Get my invoices paid',
  },
  { id: 'do-my-hiring', title: 'Do my hiring', prompt: 'Do my hiring' },
];

export type ExampleCardData = {
  id: string;
  title: string;
  prompt: string;
};

export const GREETING_HEADLINES: GreetingHeadline[] = [
  { withName: 'Put me to work, {name}.', plain: 'Put me to work.' },
  { withName: "I'll handle it, {name}.", plain: "I'll handle it." },
  { withName: 'Consider it done, {name}.', plain: 'Consider it done.' },
  {
    withName: "Let's get things done, {name}.",
    plain: "Let's get things done.",
  },
  {
    withName: "Let's clear your plate, {name}.",
    plain: "Let's clear your plate.",
  },
];

export const CHAT_INTRO_LINE =
  "I don't just answer questions — I do the work, end to end, across every app you use. Whatever you're picturing, I can probably go further.";

export type GreetingHeadline = {
  withName: string;
  plain: string;
};
