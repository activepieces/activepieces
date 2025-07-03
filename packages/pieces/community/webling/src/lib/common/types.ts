export interface MetaObject {
  created: string;
  createuser: {
    label: string;
    type: string;
  };
  lastmodified: string;
  lastmodifieduser: {
    label: string;
    type: string;
  };
}

export interface CalendarObject {
  type: string;
  meta: MetaObject;
  readonly: boolean;
  properties: {
    title: string;
    color: string;
    isPublic: boolean;
    publicHash: string;
    icsHash: string;
  };
  parents: [];
  children: {
    calendarevent: string[];
  };
  links: object;
  id: string;
}

export interface CalendarList {
  objects: CalendarObject[];
}

export interface WeblingCalendarEvent {
  type: 'calendarevent';
  meta: MetaObject;
  readonly: boolean;
  properties: {
    title: string;
    description: string;
    place: string;
    begin: string;
    end: string;
    duration: string;
    isAllDay: boolean;
    isRecurring: boolean;
    status: string;
    recurrencePattern: string | null;
    enableParticipantSignup: boolean;
    enableParticipantMaybeState: boolean;
    isSignupBinding: boolean;
    maxParticipants: string | null;
    signedupParticipants: string;
    signupAllowedUntil: string | null;
    doAutoAcceptParticipants: boolean;
    questionSchema: string | null;
    showParticipationsInPortal: boolean;
    showAllAnswersInPortal: boolean;
  };
  parents: string[];
  children: object;
  links: object;
}

export interface WeblingChanges {
  objects: WeblingObjectTypes;
  deleted: string[];
  context: object[];
  definitions: object[];
  settings: boolean;
  quota: boolean;
  subscription: boolean;
  revision: string;
  version: string;
}

// this list might be incomplete
export interface WeblingObjectTypes {
  account?: string[];
  accountgroup?: string[];
  accountgrouptemplate?: string[];
  accounttemplate?: string[];
  apikey?: string[];
  article?: string[];
  articlegroup?: string[];
  calendar?: string[];
  calendarevents?: string[];
  comment?: string[];
  debitor?: string[];
  debitorcategory?: string[];
  document?: string[];
  domain?: string[];
  email?: string[];
  entry?: string[];
  entrygroup?: string[];
  file?: string[];
  member?: string[];
  memberform?: string[];
  membergroup?: string[];
  page?: string[];
  participant?: string[];
  period?: string[];
  periodchain?: string[];
  periodgroup?: string[];
  settings?: string[];
  template?: string[];
  user?: string[];
}
