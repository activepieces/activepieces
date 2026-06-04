export type AddEventPagination = {
  current_page: number;
  next_page: number;
  previous_page: number;
  total_items: number;
  total_pages: number;
  page_size: number;
};

export type AddEventLinks = {
  next_page_url: string;
  previous_page_url: string;
};

export type AddEventGeoLocation = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  location?: string;
  postal?: string;
};

export type AddEventCalendarStats = {
  subscriber_active_count: number;
  subscribers_all_count: number;
  events_count: number;
};

export type AddEventCalendar = {
  id: string;
  unique_key: string;
  title: string;
  timezone: string;
  weekday_begin: string;
  is_default_calendar: boolean;
  description: string;
  internal_name: string;
  calendar_color: number;
  palette_id: string;
  landing_page_template_id: string;
  embeddable_calendar_template_id: string;
  stats: AddEventCalendarStats;
  custom_data: Record<string, unknown>;
  link_long: string;
  link_short: string;
  created: string;
  modified: string;
};

export type AddEventEvent = {
  id: string;
  unique_key: string;
  title: string;
  calendar_id: string;
  datetime_start: string;
  datetime_end: string;
  all_day_event: boolean;
  timezone: string;
  recurring_rule: string;
  description: string;
  internal_name: string;
  location: string;
  location_id: number;
  organizer_name: string;
  organizer_email: string;
  reminder: number;
  color: number;
  free_busy: string;
  landing_page_template_id: string;
  rsvp_enabled: boolean;
  rsvp: Record<string, unknown>;
  custom_data: Record<string, unknown>;
  link_long: string;
  link_short: string;
  created: string;
  modified: string;
};

export type AddEventRsvpAttendee = {
  id: string;
  event_id: string;
  email: string;
  attending: string;
  rsvp_form_data: Record<string, unknown>;
  rsvp_form_labels: Record<string, unknown>;
  geo_location: AddEventGeoLocation;
  created: string;
  modified: string;
};

export type AddEventSubscriber = {
  id: string;
  calendar_id: string;
  subscriber_status: string;
  calendar_type: string;
  sync_count: number;
  synced: string;
  subscriber_form_data: Record<string, unknown>;
  subscriber_form_labels: Record<string, unknown>;
  geo_location: AddEventGeoLocation;
  created: string;
};

export type AddEventTimezone = {
  name: string;
  local_time: string;
  is_dst: boolean;
  utc_offset: number;
  utc_offset_hours: string;
  tzid_abbr: string;
};

export type AddEventPage = {
  pagination: AddEventPagination;
  links: AddEventLinks;
  calendars?: AddEventCalendar[];
  events?: AddEventEvent[];
  subscribers?: AddEventSubscriber[];
  rsvps?: AddEventRsvpAttendee[];
};
