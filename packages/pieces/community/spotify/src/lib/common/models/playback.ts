import { Track } from './track';

export enum RepeatState {
  OFF = 'off',
  TRACK = 'track',
  CONTEXT = 'context',
}

export enum PlayingType {
  TRACK = 'track',
  EPISODE = 'episode',
  AD = 'ad',
  UNKNOWN = 'unknown',
}

export interface PlaybackActions {
  interrupting_playback: boolean;
  pausing: boolean;
  resuming: boolean;
  seeking: boolean;
  skipping_next: boolean;
  skipping_prev: boolean;
  toggling_repeat_context: boolean;
  toggling_shuffle: boolean;
  toggling_repeat_track: boolean;
  transferring_playback: boolean;
}

export interface PlaybackState {
  device: Device;
  timestamp: number;
  progress_ms?: number;
  is_playing: boolean;
  shuffle_state: boolean;
  repeat_state: RepeatState;
  item?: Track;
  current_playing_type: PlayingType;
  actions: PlaybackActions;
}

export interface PlaybackVolumeRequest {
  volume_percent: number;
  device_id?: string;
}

export interface PlaybackPauseRequest {
  device_id?: string;
}

export interface PlaybackPlayRequest {
  device_id?: string;
  context_uri?: string;
  uris?: string[];
  position_ms?: number;
}

export interface PlaybackSeekRequest {
  device_id?: string;
  position_ms: number;
}

export enum DeviceType {
  COMPUTER = 'computer',
  SMARTPHONE = 'smartphone',
  SPEAKER = 'speaker',
}

export interface Device {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: DeviceType;
  volume_percent: number;
}

export interface DeviceListResponse {
  devices: Device[];
}
