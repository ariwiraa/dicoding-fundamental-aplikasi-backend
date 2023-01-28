/* eslint-disable object-curly-newline */
/* eslint-disable camelcase */
const mapDBtoAlbumModel = ({ id, name, year, cover_url }) => ({
  id,
  name,
  year,
  coverUrl: cover_url,
});

const mapDBtoSongsModel = ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  album_id,
  created_at,
  updated_at,
}) => ({
  id,
  title,
  year,
  genre,
  performer,
  duration,
  albumId: album_id,
  createdAt: created_at,
  updatedAt: updated_at,
});

module.exports = {
  mapDBtoAlbumModel,
  mapDBtoSongsModel,
};
