// By default, parcel puts all assets at the root of the output directory.
// This Namer plugin tries to preserve the original file structure.

import path from 'path';
import { Namer } from '@parcel/plugin';
import { SOURCE_DIR } from './common.mjs';

export default new Namer({

  async name ({ bundle, bundleGraph }) {

    // Get file path relative to main source directory
    const absoluteFilePath = bundle.getMainEntry().filePath;
    const relativeFilePath = path.relative(SOURCE_DIR, absoluteFilePath);

    // Get file details
    const { dir, name } = path.parse(relativeFilePath);

    // Get bundle details
    const { needsStableName, hashReference, type } = bundle;

    // Compute dist file path
    const filename = needsStableName
      ? `${name}.${type}`
      : `${name}.${hashReference}.${type}`;

    return path.join(dir, filename);
  },
});
