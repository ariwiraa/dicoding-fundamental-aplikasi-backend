const Joi = require('joi');

const AlbumsSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().required(),
});

module.exports = { AlbumsSchema };
