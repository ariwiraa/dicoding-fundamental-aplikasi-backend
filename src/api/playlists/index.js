const PlaylistHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'playlists',
  version: '1.0.0',
  register: async (
    server,
    { playlistService, playlistSongsService, validator }
  ) => {
    const playlistsHandler = new PlaylistHandler(
      playlistService,
      playlistSongsService,
      validator
    );
    server.route(routes(playlistsHandler));
  },
};
