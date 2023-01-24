const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const AuthorizationError = require('../../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationsService, cacheService) {
    this._pool = new Pool();
    this._collaborationsService = collaborationsService;
    this._cacheService = cacheService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    this._cacheService.delete(`playlists:${owner}`);
    return result.rows[0].id;
  }

  async getPlaylistsByOwner(owner) {
    try {
      const cache = await this._cacheService.get(`playlists:${owner}`);
      return JSON.parse(cache);
    } catch (error) {
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username
        FROM playlists
        INNER JOIN users ON playlists.owner = users.id  
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
        values: [owner],
      };

      const { rows } = await this._pool.query(query);
      await this._cacheService.set(`playlists:${owner}`, JSON.stringify(rows));

      return rows;
    }
  }

  async deletePlaylistById(playlistId, owner) {
    await this.verifyPlaylistOwner(playlistId, owner);
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus playlist. Id tidak ditemukan');
    }

    this._cacheService.delete(`playlists:${owner}`);
    this._cacheService.delete(`playlists:${playlistId}`);
  }

  async getPlaylistById(userId, playlistId) {
    try {
      const cache = await this._cacheService.get(`playlists:${playlistId}`);
      return JSON.parse(cache);
    } catch (error) {
      const query = {
        text: `SELECT playlists.id, playlists.name, users.username
        FROM playlists
        INNER JOIN users ON playlists.owner = users.id  
        LEFT JOIN collaborations ON collaborations.playlist_id = playlists.id
        WHERE playlists.owner =  $1 AND playlists.id = $2 OR collaborations.user_id =  $1`,
        values: [userId, playlistId],
      };

      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Playlist tidak ditemukan');
      }

      await this._cacheService.set(
        `playlists:${playlistId}`,
        JSON.stringify(result.rows[0])
      );
      return result.rows[0];
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (result.rows.length === 0) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses playlist ini');
    }
  }

  async verifyPlaylistAccess(id, userId) {
    try {
      await this.verifyPlaylistOwner(id, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationsService.verifyCollaborator(id, userId);
      } catch {
        throw new AuthorizationError(
          'Anda bukan merupakan kolaborator dari playlist ini'
        );
      }
    }
  }
}

module.exports = PlaylistsService;
