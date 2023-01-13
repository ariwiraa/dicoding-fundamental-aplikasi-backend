const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistsService, playlistSongsService, validator) {
    this._playlistsService = playlistsService;
    this._playlistSongsService = playlistSongsService;
    this._validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: owner } = request.auth.credentials;

    const result = await this._playlistsService.addPlaylist(name, owner);

    const response = h.response({
      status: 'success',
      data: {
        playlistId: result,
      },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: owner } = request.auth.credentials;
    const result = await this._playlistsService.getPlaylistsByOwner(owner);
    return {
      status: 'success',
      data: {
        playlists: result,
      },
    };
  }

  async deletePlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { id: owner } = request.auth.credentials;

    await this._playlistsService.deletePlaylistById(playlistId, owner);
    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request) {
    this._validator.validatePostSongToPlaylistPayload(request.payload);
    const { id: userId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    console.log(userId, playlistId, songId);

    await this._playlistSongsService.addSongToPlaylist({
      playlistId,
      userId,
      songId,
    });

    return {
      status: 'success',
      message: 'Berhasil menambahkan lagu',
    };
  }

  async getSongsFromPlaylistHandler(request, h) {
    const { id: userId } = request.auth.credentials;
    const { id: playlistId } = request.params;

    const songsFromPlaylist =
      await this._playlistSongsService.getSongsFromPlaylistId(
        playlistId,
        userId
      );

    const response = h.response({
      status: 'success',
      data: {
        playlist: songsFromPlaylist,
      },
    });
    response.code(200);
    return response;
  }

  async deleteSongFromPlaylistHandler(request) {
    this._validator.validateDeleteSongFromPlaylistPayload(request.payload);
    const { id: userId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;

    await this._playlistSongsService.deleteSongFromPlaylistId({
      playlistId,
      userId,
      songId,
    });

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = PlaylistsHandler;
