// Waiting for https://github.com/parcel-bundler/parcel/issues/3362

const { Transformer } = require('@parcel/plugin');

module.exports = new Transformer({

  async transform ({ asset }) {

    const manifest = JSON.parse(await asset.getCode());
    for (const icon of manifest.icons) {
      icon.src = asset.addURLDependency(icon.src);
    }

    asset.isIsolated = true;
    asset.setCode(JSON.stringify(manifest));

    return [asset];
  },
});
