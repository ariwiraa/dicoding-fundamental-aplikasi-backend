const { nanoid } = require('nanoid');

const { Pool } = require('pg');
const InvariantError = require('../../../exceptions/InvariantError');

class UserAlbumLikesService {
  constructor(albumsService, cacheService) {
    this._pool = new Pool();
    this._albumsService = albumsService;
    this._cacheService = cacheService;
  }

  async likeTheAlbum(albumId, userId) {
    await this._albumsService.isAlbumExist(albumId);

    const userLike = await this.verifyUserLike(albumId, userId);

    let message = '';
    if (!userLike) {
      await this.insertLike(albumId, userId);
      message = 'Berhasil menyukai album';
    } else {
      await this.deleteAlbumLikeById(albumId, userId);
      message = 'Batal menyukai album';
    }

    return message;
  }

  async insertLike(albumId, userId) {
    const id = `likes-${nanoid(16)}`;

    const query = {
      text: `INSERT INTO user_album_likes
        VALUES($1, $2, $3)
        RETURNING id`,
      values: [id, userId, albumId],
    };

    const { rowCount } = await this._pool.query(query);
    if (!rowCount) {
      throw new InvariantError('Gagal menyukai album');
    }
    await this._cacheService.delete(`user_album_likes:${albumId}`);
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this._cacheService.get(
        `user_album_likes:${albumId}`
      );
      return {
        likes: JSON.parse(result),
        isCache: 1,
      };
    } catch (error) {
      await this._albumsService.isAlbumExist(albumId);

      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };

      const { rows } = await this._pool.query(query);

      const likes = rows.length;

      await this._cacheService.set(
        `user_album_likes:${albumId}`,
        JSON.stringify(likes)
      );
      return { likes };
    }
  }

  async verifyUserLike(id, userId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [id, userId],
    };

    const { rows } = await this._pool.query(query);
    return rows.length;
  }

  async deleteAlbumLikeById(id, userId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2 RETURNING id',
      values: [id, userId],
    };

    const { rows } = await this._pool.query(query);

    if (!rows.length) {
      throw new InvariantError('Gagal membatalkan menyukai album');
    }
    await this._cacheService.delete(`user_album_likes:${id}`);
  }
}

module.exports = UserAlbumLikesService;
