import addPlaylistItems from './add-playlist-items'
import createPlaylist from './create-playlist'
import getPlaybackState from './get-playback-state'
import getPlaylistInfo from './get-playlist-info'
import getPlaylistItems from './get-playlist-items'
import getPlaylists from './get-playlists'
import getSavedTracks from './get-saved-tracks'
import pause from './pause'
import play from './play'
import removePlaylistItems from './remove-playlist-items'
import reorderPlaylist from './reorder-playlist'
import search from './search'
import setVolume from './set-volume'
import updatePlaylist from './update-playlist'

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
  addPlaylistItems,
  removePlaylistItems,
  reorderPlaylist,
]
