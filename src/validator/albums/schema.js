const Joi = require('joi');

const currentYear = new Date().getFullYear();

const AlbumsSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().min(1900).max(currentYear).required(),
});

module.exports = { AlbumsSchema };
