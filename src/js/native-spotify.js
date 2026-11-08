import { Capacitor } from '@capacitor/core';
import { Spotify } from '@jacquesbeets/capacitor-spotify';

const CLIENT_ID = '50996311eb0f47fbad39cf57af4419e8';
const REDIRECT_URI = 'calismaalanim://spotify-callback';
const SCOPES = [
  'app-remote-control', 'streaming', 'user-read-email', 'user-read-private',
  'user-read-playback-state', 'user-modify-playback-state',
  'user-read-currently-playing', 'user-library-read',
  'user-read-recently-played', 'playlist-read-private',
  'playlist-read-collaborative', 'playlist-modify-private',
  'playlist-modify-public'
];

let initialized = false;
const nativeSpotify = {
  isNative: () => Capacitor.isNativePlatform(),
  async initialize() {
    if (!this.isNative()) return false;
    if (!initialized) {
      await Spotify.initialize({
        clientId: CLIENT_ID,
        redirectUri: REDIRECT_URI,
        scopes: SCOPES,
        playerName: 'Çalışma Alanım'
      });
      initialized = true;
    }
    return true;
  },
  async authorize() { await this.initialize(); return Spotify.authorize(); },
  async getAccessToken() { await this.initialize(); return Spotify.getAccessToken(); },
  async connect(playUri = '') { await this.initialize(); return Spotify.connect({ playUri }); },
  play(uri) { return Spotify.play({ uri }); },
  togglePlay() { return Spotify.togglePlay(); },
  skipNext() { return Spotify.skipNext(); },
  skipPrevious() { return Spotify.skipPrevious(); },
  seekTo(positionMs) { return Spotify.seekTo({ positionMs }); },
  getPlayerState() { return Spotify.getPlayerState(); },
  getImage(imageId) { return Spotify.getImage({ imageId, width: 240 }); },
  addListener(name, callback) { return Spotify.addListener(name, callback); },
  disconnect() { return Spotify.disconnect(); },
  logout() { return Spotify.logout(); }
};

window.NativeSpotify = nativeSpotify;

