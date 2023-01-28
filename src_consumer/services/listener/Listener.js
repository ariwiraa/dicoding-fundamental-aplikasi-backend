/* eslint-disable import/no-extraneous-dependencies */
const autoBind = require('auto-bind');

class Listener {
  constructor(playlistSongsService, mailSender) {
    this._playlistSongsService = playlistSongsService;
    this._mailSender = mailSender;

    autoBind(this);
  }

  async listen(message) {
    try {
      const { playlistId, targetEmail } = JSON.parse(
        message.content.toString()
      );
      console.log(playlistId, targetEmail);

      const songs = await this._playlistSongsService.getSongsFromPlaylistId(
        playlistId
      );
      const result = await this._mailSender.sendEmail(
        targetEmail,
        JSON.stringify(songs)
      );
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = Listener;
