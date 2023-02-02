import { Property } from "../../../framework/property/property"

interface IZoomMeeting {
  agenda: string
  topic?: string
  type: number
  start_time: string
  password?: string
  default_password?: boolean
  duration?: number
  pre_schedule?: boolean
  schedule_for?: string
  timezone?: string
  
  settings?: {
    allow_multiple_devices: boolean,
    alternative_hosts: string,
    alternative_hosts_email_notification: boolean,
    approval_type: number,
    calendar_type: number,
    close_registration: boolean,
    contact_email: string,
    contact_name: string,
    email_notification: boolean,
    meeting_authentication?: boolean
    meeting_invitees?: Map<string, string>
    mute_upon_entry?: boolean
    participant_video?: boolean
    private_meeting?: boolean
    registrants_confirmation_email?: boolean
    registrants_email_notification?: boolean
    registration_type?: number
    show_share_button?: boolean
    waiting_room?: boolean
  }
}
