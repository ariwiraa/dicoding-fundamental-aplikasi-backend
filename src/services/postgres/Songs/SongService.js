/* eslint-disable object-curly-newline */
const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const { mapDBtoSongsModel } = require('../../../utils');

class SongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addSong({ title, year, genre, performer, duration, albumId }) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      values: [
        id,
        title,
        year,
        genre,
        performer,
        duration,
        albumId,
        createdAt,
        updatedAt,
      ],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('lagu gagal ditambahkan');
    }

    this._cacheService.delete('songs:all-songs');
    this._cacheService.delete('albums:album-songs');
    return result.rows[0].id;
  }

  async getSongs(title = '', performer = '') {
    try {
      const cache = await this._cacheService.get('songs:all-songs');
      return JSON.parse(cache);
    } catch (error) {
      const query = {
        text: 'SELECT id, title, performer FROM songs WHERE title ILIKE $1 and performer ILIKE $2',
        values: [`%${title}%`, `%${performer}%`],
      };
      const { rows } = await this.pool.query(query);
      await this._cacheService.set('songs:all-songs', JSON.stringify(rows));
      return rows;
    }
  }

  async getSongById(id) {
    try {
      const cache = await this._cacheService.get(`songs:${id}`);
      return JSON.parse(cache);
    } catch (error) {
      const query = {
        text: 'SELECT * FROM songs WHERE id = $1',
        values: [id],
      };
      const { rows, rowCount } = await this._pool.query(query);

      if (!rowCount) {
        throw new NotFoundError('Lagu tidak ditemukan');
      }

      await this._cacheService.set(
        `songs:${id}`,
        JSON.stringify(mapDBtoSongsModel(rows[0]))
      );
      return mapDBtoSongsModel(rows[0]);
    }
  }

  async editSongById(id, { title, year, genre, performer, duration, albumId }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE songs SET title = $1, year = $2, genre = $3, performer = $4, duration = $5, album_id = $6, updated_at = $7 WHERE id = $8 RETURNING id',
      values: [title, year, genre, performer, duration, albumId, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    this._cacheService.delete('songs:all-songs');
    this._cacheService.delete('albums:album-songs');
    this._cacheService.delete(`songs:${id}`);
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus lagu. Id tidak ditemukan');
    }
    this._cacheService.delete('songs:all-songs');
    this._cacheService.delete('albums:album-songs');
    this._cacheService.delete(`songs:${id}`);
  }

  async verifySongIsExist(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu yang Anda cari tidak ditemukan');
    }
  }
}

module.exports = SongsService;
