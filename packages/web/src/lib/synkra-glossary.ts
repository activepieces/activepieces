/**
 * Synkra Flow glossary.
 *
 * Every user-facing technical term and its plain English explanation.
 * Feeds the inline info tips now, and the public /glossary page later.
 *
 * Copy rules:
 *   - South African English spelling (colour, organise, centre, favour).
 *   - Complete sentences.
 *   - No em or en dashes.
 *   - No fragments joined by full stops.
 *   - B2B friendly, not fluffy.
 */

export type GlossaryTerm = {
  term: string;
  short: string;
  long?: string;
  related?: string[];
};

export const SYNKRA_GLOSSARY: Record<string, GlossaryTerm> = {
  automation: {
    term: 'Automation',
    short: 'A saved set of steps that runs by itself.',
    long: 'An automation is a workflow you build once and then leave running. It starts when a trigger fires, and then runs every action you have added in the order you set.',
    related: ['trigger', 'action', 'run'],
  },
  trigger: {
    term: 'Trigger',
    short: 'The event that starts an automation.',
    long: 'The trigger is what tells Synkra to begin. It can be a new email, a form submission, a new row in a spreadsheet, or a schedule that you set.',
    related: ['automation', 'action', 'schedule'],
  },
  action: {
    term: 'Action',
    short: 'A single step inside an automation.',
    long: 'An action is one thing the automation does after the trigger fires. Sending an email, adding a row to a sheet, and calling a webhook are all actions.',
    related: ['automation', 'trigger', 'step'],
  },
  step: {
    term: 'Step',
    short: 'Another word for an action inside an automation.',
    related: ['action'],
  },
  webhook: {
    term: 'Webhook',
    short: 'A URL that another app calls when something happens on their side.',
    long: 'A webhook is a way for one app to tell another app that something just happened. You copy the URL from the other app and paste it into Synkra so we know when to run your automation.',
    related: ['trigger', 'automation'],
  },
  integration: {
    term: 'Integration',
    short: 'An app or service you have connected to Synkra.',
    long: 'An integration is a tool you have linked, such as Google Sheets, Slack, or Stripe. Once it is connected, you can use it from any automation in your workspace.',
    related: ['connection', 'workspace'],
  },
  connection: {
    term: 'Connection',
    short: 'See Integration.',
    related: ['integration'],
  },
  variable: {
    term: 'Variable',
    short: 'A reusable value you can use across your automations.',
    long: 'A variable is a small piece of information, such as an API key, an email address, or a project ID, that you set once and then use from anywhere in your workspace. Changing it in one place updates it everywhere.',
    related: ['workspace', 'automation'],
  },
  table: {
    term: 'Table',
    short: 'A simple database inside Synkra.',
    long: 'A table is a place to store rows of data inside Synkra. Your automations can read from a table and write to it, which makes it useful for storing submissions, queuing items, or logging events.',
    related: ['automation'],
  },
  run: {
    term: 'Run',
    short: 'One execution of an automation, from start to finish.',
    long: 'Every time an automation fires, Synkra records a run. The run shows each step, how long it took, and what happened at each point.',
    related: ['automation', 'history'],
  },
  execution: {
    term: 'Execution',
    short: 'See Run.',
    related: ['run'],
  },
  history: {
    term: 'History',
    short: 'The list of every time an automation has run.',
    long: 'History shows all past runs for a workspace. Open any entry to see what happened at each step and where a failure occurred, if one did.',
    related: ['run'],
  },
  workspace: {
    term: 'Workspace',
    short: 'A separate area that holds one team or one project.',
    long: 'A workspace is a self contained space with its own automations, integrations, variables, tables, and members. Larger plans can have several workspaces.',
    related: ['automation', 'integration'],
  },
  schedule: {
    term: 'Schedule',
    short: 'A trigger that runs on a time interval.',
    long: 'A schedule is a type of trigger that fires at a time you choose, such as every morning at eight or every Monday at noon.',
    related: ['trigger'],
  },
  folder: {
    term: 'Folder',
    short: 'A container that organises automations inside a workspace.',
    related: ['workspace', 'automation'],
  },
  field: {
    term: 'Field',
    short: 'A single piece of data inside a step.',
    long: 'A field is one item of information, such as an email address, a name, or an amount. Each action has fields you fill in to tell it what to do.',
    related: ['action', 'step'],
  },
  piece: {
    term: 'Piece',
    short: 'The developer term for an integration.',
    long: 'Piece is the internal name for an integration in Activepieces, the platform Synkra Flow is built on. In Synkra Flow, we call them integrations.',
    related: ['integration'],
  },
  'api-key': {
    term: 'API key',
    short: 'A secret code that lets one system talk to another.',
    long: 'An API key is a long string of letters and numbers that identifies your account to another service. You should treat it like a password and store it as a variable.',
    related: ['variable', 'integration'],
  },
  oauth: {
    term: 'OAuth',
    short: 'A way to connect an app without typing your password into Synkra.',
    long: 'OAuth lets you sign in to another service once, on their own page, and grant Synkra permission to act on your behalf. You never share your password with us.',
    related: ['integration', 'connection'],
  },
  quota: {
    term: 'Quota',
    short: 'A limit on how much of something your plan allows.',
    long: 'A quota is the maximum amount your plan allows in a period. You may have a quota on runs, storage, emails, or AI operations, depending on your tier.',
    related: ['run', 'variable'],
  },
};

export function getGlossaryTerm(key: string): GlossaryTerm | undefined {
  return SYNKRA_GLOSSARY[key];
}
