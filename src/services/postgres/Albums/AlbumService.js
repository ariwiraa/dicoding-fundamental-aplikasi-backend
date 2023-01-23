const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../../exceptions/InvariantError');
const NotFoundError = require('../../../exceptions/NotFoundError');
const { mapDBtoAlbumModel } = require('../../../utils');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    this._cacheService.delete('albums:all-albums');
    return result.rows[0].id;
  }

  async getSongsFromAlbumId(albumId) {
    try {
      const cache = await this._cacheService.get('albums:album-songs');
      return JSON.parse(cache);
    } catch (error) {
      const album = await this.getAlbumById(albumId);
      const query = {
        text: `SELECT songs.id, songs.title, songs.performer
        FROM albums
        INNER JOIN songs ON songs.album_id = albums.id
        WHERE albums.id = $1`,
        values: [albumId],
      };

      const result = await this._pool.query(query);

      await this._cacheService.set(
        'albums:album-songs',
        JSON.stringify({ ...album, songs: result.rows })
      );
      return { ...album, songs: result.rows };
    }
  }

  async getAlbumById(id) {
    try {
      const cache = await this._cacheService.get(`albums:${id}`);
      return JSON.parse(cache);
    } catch (error) {
      const query = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rowCount) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      await this._cacheService.set(
        `albums:${id}`,
        JSON.stringify(mapDBtoAlbumModel(result.rows[0]))
      );
      return mapDBtoAlbumModel(result.rows[0]);
    }
  }

  async editAlbumById(id, { name, year }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    this._cacheService.delete(`albums:${id}`);
    this._cacheService.delete('albums:all-albums');
    this._cacheService.delete('albums:album-songs');
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menghapus album. Id tidak ditemukan');
    }

    this._cacheService.delete(`albums:${id}`);
    this._cacheService.delete('albums:all-albums');
    this._cacheService.delete('albums:album-songs');
  }
}

module.exports = AlbumsService;
