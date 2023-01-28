const autoBind = require('auto-bind');

class UserAlbumLikesHandler {
  constructor(userAlbumLikesService) {
    this._service = userAlbumLikesService;
    autoBind(this);
  }

  async postLikeTheAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    const message = await this._service.likeTheAlbum(id, credentialId);
    const response = h.response({
      status: 'success',
      message,
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id } = request.params;
    const { likes, isCache } = await this._service.getAlbumLikesById(id);
    const response = h.response({
      status: 'success',
      data: {
        likes,
      },
    });
    if (isCache) {
      response.header('X-Data-Source', 'cache');
    }
    response.code(200);
    return response;
  }
}

module.exports = UserAlbumLikesHandler;
