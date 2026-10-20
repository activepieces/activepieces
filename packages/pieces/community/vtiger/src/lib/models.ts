export interface Challenge {
  token: string;
  serverTime: string;
  expireTime: string;
}

export interface Instance {
  sessionId: string;
  sessionName: string;
  userId: string;
  version: string;
  vtigerVersion: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  time_zone: string;
  hour_format: string;
  date_format: string;
  is_admin: string;
  call_duration: string;
  other_event_duration: string;
}
