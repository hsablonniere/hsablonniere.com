// While we wait for this issue to get fixed
// https://github.com/parcel-bundler/parcel/issues/4178

const { Transformer } = require('@parcel/plugin');

module.exports = new Transformer({
  transform ({ asset }) {
    return [asset];
  },
});
