import search from './search';
import getPlaybackState from './get-playback-state';
import setVolume from './set-volume';
import play from './play';
import pause from './pause';
import getPlaylistInfo from './get-playlist-info';
import createPlaylist from './create-playlist';
import updatePlaylist from './update-playlist';
import updatePlaylistDetails from './update-playlist-details';
import addPlaylistItems from './add-playlist-items';
import removePlaylistItems from './remove-playlist-items';
import replacePlaylistItems from './replace-playlist-items';
import getPlaylistItems from './get-playlist-items';
import getPlaylistCoverImage from './get-playlist-cover-image';
import getSavedTracks from './get-saved-tracks';
import getSavedItems from './get-saved-items';
import reorderPlaylist from './reorder-playlist';
import getPlaylists from './get-playlists';
import addLibraryItems from './add-library-items';
import removeLibraryItems from './remove-library-items';
import checkLibraryItems from './check-library-items';
import getFollowedArtists from './get-followed-artists';
import getCurrentUser from './get-current-user';
import getTrack from './get-track';
import getAlbum from './get-album';
import getAlbumTracks from './get-album-tracks';
import getArtist from './get-artist';
import getArtistAlbums from './get-artist-albums';
import getShow from './get-show';
import getShowEpisodes from './get-show-episodes';
import getEpisode from './get-episode';
import getDevices from './get-devices';
import getQueue from './get-queue';
import getRecentlyPlayed from './get-recently-played';
import addToQueue from './add-to-queue';
import skipToNext from './skip-to-next';
import skipToPrevious from './skip-to-previous';
import seek from './seek';
import setRepeatMode from './set-repeat-mode';
import setShuffle from './set-shuffle';
import transferPlayback from './transfer-playback';

export default [
  search,
  getPlaybackState,
  play,
  pause,
  setVolume,
  getPlaylists,
  getPlaylistInfo,
  getPlaylistItems,
  getSavedTracks,
  createPlaylist,
  updatePlaylist,
  updatePlaylistDetails,
  addPlaylistItems,
  removePlaylistItems,
  reorderPlaylist,
  replacePlaylistItems,
  getPlaylistCoverImage,
  addLibraryItems,
  removeLibraryItems,
  checkLibraryItems,
  getSavedItems,
  getFollowedArtists,
  getCurrentUser,
  getTrack,
  getAlbum,
  getAlbumTracks,
  getArtist,
  getArtistAlbums,
  getShow,
  getShowEpisodes,
  getEpisode,
  getDevices,
  getQueue,
  getRecentlyPlayed,
  addToQueue,
  skipToNext,
  skipToPrevious,
  seek,
  setRepeatMode,
  setShuffle,
  transferPlayback,
];
