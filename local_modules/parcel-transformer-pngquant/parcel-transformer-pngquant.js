const imageminPngquant = require('imagemin-pngquant');
const { Transformer } = require('@parcel/plugin');
const { md5FromString } = require('@parcel/utils');

module.exports = new Transformer({
  async transform ({ asset, options }) {

    if (asset.type === 'png') {
      const inputBuffer = await asset.getBuffer();
      const pngquantBuffer = await imageminPngquant()(inputBuffer);
      asset.setBuffer(pngquantBuffer);
    }

    return [asset];
  },
});
