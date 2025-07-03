import { HttpMessageBody } from '@activepieces/pieces-common';

export interface MeetingRegistrant {
  first_name: string;
  last_name?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  comments?: string;
  custom_questions?: {
    title: string;
    value: string;
  }[];
  industry?: string;
  job_title?: string;
  no_of_employees?: string;
  org?: string;
  purchasing_time_frame?: string;
  role_in_purchase_process?: string;
  language?: string;
  auto_approve?: boolean;
}

export interface RegistrationResponse extends HttpMessageBody {
  id: number;
  join_url: string;
  registrant_id: string;
  start_time: string;
  topic: string;
  occurrences: {
    duration: number;
    occurrence_id: string;
    start_time: string;
    status: string;
  }[];
  participant_pin_code: number;
}

export interface MeetingResponseBody extends HttpMessageBody {
  id?: number;
  assistant_id?: string;
  host_email?: string;
  registration_url?: string;
  agenda?: string;
  created_at?: string;
  duration?: number;
  join_url?: string;
  occurrences?: {
    duration?: number;
    occurrence_id?: string;
    start_time?: string;
    status?: string;
  }[];
  password?: string;
  pmi?: string;
  pre_schedule?: boolean;
  recurrence?: {
    end_date_time?: string;
    end_times?: number;
    monthly_day?: number;
    monthly_week?: number;
    monthly_week_day?: number;
    repeat_interval?: number;
    type: number;
    weekly_days?: string;
  };
  settings: {
    allow_multiple_devices: boolean;
    alternative_hosts: number;
    alternative_hosts_email_notification: boolean;
    alternative_host_update_polls: boolean;
    approval_type: number;
    approved_or_denied_countries_or_regions: {
      approved_list: string[];
      denied_list: string[];
      enable: boolean;
      method: string;
    };
    audio: string;
    authentication_domains: string;
    authentication_exception: {
      email: string;
      name: string;
      join_url: string;
    }[];
    authentication_name: string;
    authentication_option: string;
    auto_recording: string;
    breakout_room: {
      enable: boolean;
      rooms: {
        name: string;
        participants: string[];
      }[];
    };
    calendar_type: number;
    close_registration: boolean;
    contact_email: string;
    contact_name: string;
    custom_keys: {
      key: string;
      value: string;
    }[];
    email_notification: boolean;
    encryption_type: string;
    focus_mode: boolean;
    global_dial_in_countries: string[];
    global_dial_in_numbers: {
      city: string;
      country: string;
      country_name: string;
      number: string;
      type: string;
    }[];
    host_video: boolean;
    jbh_time: number;
    join_before_host: boolean;
    language_interpretation: {
      enable: boolean;
      interpreters: {
        email: string;
        languages: string;
      }[];
    };
    meeting_authentication: boolean;
    mute_upon_entry: boolean;
    participant_video: boolean;
    private_meeting: boolean;
    registrants_confirmation_email: boolean;
    registrants_email_notification: boolean;
    registration_type: number;
    show_share_button: boolean;
    use_pmi: boolean;
    waiting_room: boolean;
    watermark: boolean;
    host_save_video_order: boolean;
  };

  start_time: string;
  start_url: string;
  timezone: string;
  topic: string;
  type: number;
  tracking_fields: {
    field: string;
    value: string;
    visible: boolean;
  }[];
}

export interface MeetingMessageBody extends HttpMessageBody {
  agenda?: string;
  password?: string;
  duration?: number;
  pre_schedule?: boolean;
  recurrence?: {
    end_date_time: string;
    end_times: number;
    monthly_day: number;
    monthly_week: number;
    monthly_week_day: number;
    repeat_interval: number;
    type: number;
    weekly_days: string;
  };
  settings: {
    allow_multiple_devices?: boolean;
    alternative_hosts?: number;
    alternative_hosts_email_notification?: boolean;
    alternative_host_update_polls?: boolean;
    approval_type?: number;
    approved_or_denied_countries_or_regions?: {
      approved_list?: string[];
      denied_list?: string[];
      enable?: boolean;
      method?: string;
    };
    audio?: string;
    authentication_domains?: string;
    authentication_exception?: {
      email?: string;
      name?: string;
      join_url?: string;
    }[];
    authentication_name?: string;
    authentication_option?: string;
    auto_recording?: string;
    breakout_room?: {
      enable?: boolean;
      rooms?: {
        name: string;
        participants: string[];
      }[];
    };
    calendar_type?: number;
    close_registration?: boolean;
    contact_email?: string;
    contact_name?: string;
    custom_keys?: {
      key?: string;
      value?: string;
    }[];
    email_notification?: boolean;
    encryption_type?: string;
    focus_mode?: boolean;
    global_dial_in_countries?: string[];
    global_dial_in_numbers?: {
      city?: string;
      country?: string;
      country_name?: string;
      number?: string;
      type?: string;
    }[];
    host_video?: boolean;
    jbh_time?: number;
    join_before_host?: boolean;
    language_interpretation?: {
      enable?: boolean;
      interpreters?: {
        email?: string;
        languages?: string;
      }[];
    };
    meeting_authentication?: boolean;
    mute_upon_entry?: boolean;
    participant_video?: boolean;
    private_meeting?: boolean;
    registrants_confirmation_email?: boolean;
    registrants_email_notification?: boolean;
    registration_type?: number;
    show_share_button?: boolean;
    use_pmi?: boolean;
    waiting_room?: boolean;
    watermark?: boolean;
    host_save_video_order?: boolean;
  };

  start_time?: string;
  start_url?: string;
  timezone?: string;
  topic?: string;
  type?: number;
  tracking_fields?: {
    field: string;
    value?: string;
    visible?: boolean;
  }[];
}
