const imageminMozjpeg = require('imagemin-mozjpeg');
const { Transformer } = require('@parcel/plugin');

module.exports = new Transformer({
  async transform ({ asset, options }) {

    if (asset.type === 'jpg') {
      const inputBuffer = await asset.getBuffer();
      const optimizedBuffer = await imageminMozjpeg({ quality: 80 })(inputBuffer);
      asset.setBuffer(optimizedBuffer);
    }

    return [asset];
  },
});
