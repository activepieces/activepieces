import { HttpMessageBody } from "../../../common/http/core/http-message-body"

export interface MeetingRegistrant {
  first_name: string
  last_name?: string
  email: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  phone?: string
  comments?: string
  custom_questions?: {
    title: string
    value: string
  }[]
  industry?: string
  job_title?: string
  no_of_employees?: string
  org?: string
  purchasing_time_frame?: string
  role_in_purchase_process?: string
  language?: string
  auto_approve?: boolean
}

export interface RegistrationResponse extends HttpMessageBody{
  id: number,
  join_url: string,
  registrant_id: string,
  start_time: string,
  topic: string,
  occurrences: {
    duration: number,
    occurrence_id: string,
    start_time: string,
    status: string
  }[]
  participant_pin_code: number
}