import search from "./search"
import getPlaybackState from "./get-playback-state"
import setVolume from "./set-volume"
import play from "./play"
import pause from "./pause"
import getPlaylistInfo from "./get-playlist-info"
import createPlaylist from "./create-playlist"
import updatePlaylist from "./update-playlist"
import addPlaylistItems from "./add-playlist-items"
import removePlaylistItems from "./remove-playlist-items"
import getPlaylistItems from "./get-playlist-items"
import reorderPlaylist from "./reorder-playlist"

export default [
    search,
    getPlaybackState,
    play,
    pause,
    setVolume,
    getPlaylistInfo,
    getPlaylistItems,
    createPlaylist,
    updatePlaylist,
    addPlaylistItems,
    removePlaylistItems,
    reorderPlaylist
]