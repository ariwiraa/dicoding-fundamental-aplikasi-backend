require('dotenv').config();
const amqp = require('amqplib');
const PlaylistSongsService = require('./services/postgres/playlistSongs/PlaylistSongsService');
const PlaylistsService = require('./services/postgres/playlists/PlaylistsService');
const MailSender = require('./services/mailSender/MailSender');
const Listener = require('./services/listener/Listener');
const CacheService = require('./services/redis/CacheServices');
const config = require('./utils/config');

const init = async () => {
  const cacheService = new CacheService();
  const playlistsService = new PlaylistsService();
  const playlistSongsService = new PlaylistSongsService(
    playlistsService,
    cacheService
  );
  const mailSender = new MailSender();
  const listener = new Listener(playlistSongsService, mailSender);

  const connection = await amqp.connect(config.rabbitMq.server);
  const channel = await connection.createChannel();

  await channel.assertQueue('export:songs', {
    durable: true,
  });

  channel.consume('export:songs', listener.listen, { noAck: true });

  console.log(`Consumer berjalan pada ${config.rabbitMq.server}`);
};

init();
