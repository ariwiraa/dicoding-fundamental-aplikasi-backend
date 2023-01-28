const nodeMailer = require('nodemailer');
const config = require('../../utils/config');

class MailSender {
  constructor() {
    this._transporter = nodeMailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }

  sendEmail(targetEmail, content) {
    const message = {
      from: 'Open Music',
      to: targetEmail,
      subject: 'Daftar lagu pada Playlist',
      text: 'Terlampir hasil dari daftar lagu yang ada didalam playlist',
      attachments: [
        {
          filename: 'songs.json',
          content,
        },
      ],
    };

    return this._transporter.sendMail(message);
  }
}

module.exports = MailSender;
