import { Album } from './album';
import { Episode, Show } from './catalog';
import { Track } from './track';

export interface LibraryModifyItemsRequest {
  uris: string[];
}

export interface SavedTrack {
  added_at: string;
  track: Track;
}

export interface SavedAlbum {
  added_at: string;
  album: Album;
}

export interface SavedShow {
  added_at: string;
  show: Show;
}

export interface SavedEpisode {
  added_at: string;
  episode: Episode;
}
