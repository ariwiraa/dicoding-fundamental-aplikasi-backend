const autoBind = require('auto-bind');
const { Pool } = require('pg');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');

class PlaylistSongsService {
  constructor(playlistService) {
    this._pool = new Pool();
    this._playlistService = playlistService;

    autoBind(this);
  }

  async addSongToPlaylist(id, userId, songId) {
    await this._playlistService.verifyPlaylistAccess(id, userId);
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal menambahkan lagu ke dalam playlist');
    }
  }

  async getSongsFromPlaylistId(playlistId, userId) {
    // await this._playlistService.verifyPlaylistIsExist(playlistId);
    await this._playlistService.verifyPlaylistAccess(playlistId, userId);

    const query = {
      text: 'SELECT songs.id, songs.title, songs.performer FROM playlists INNER JOIN playlistsongs ON playlistsongs.playlist_id = playlists.id INNER JOIN songs ON playlistsongs.song_id = songs.id WHERE playlists.id = $1',
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    if (!result.rows) {
      throw new InvariantError('Gagal mengambil lagu dari playlist');
    }

    return result.rows;
  }

  async deleteSongFromPlaylistId(playlistId, userId, songId) {
    // await this._playlistService.verifyPlaylistIsExist(playlistId);
    await this._playlistService.verifyPlaylistAccess(playlistId, userId);

    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError(
        'Gagal menghapus lagu dari playlist. Id tidak ditemukan'
      );
    }
  }
}

module.exports = PlaylistSongsService;
