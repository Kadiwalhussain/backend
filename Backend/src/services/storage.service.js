const ImageKit = require('@imagekit/nodejs');
const config = require('../../config/env');

const imagekit = new ImageKit({
  publicKey: config.imagekit.publicKey,
  privateKey: config.imagekit.privateKey,
  urlEndpoint: config.imagekit.urlEndpoint
});

async function uploadFile(buffer, fileName = null) {
  try {
    const fileName_final = fileName || `image-${Date.now()}.jpg`;
    const result = await imagekit.files.upload({
      file: buffer.toString('base64'),
      fileName: fileName_final
    });
    return result;
  } catch (error) {
    console.error('ImageKit upload error:', error.message);
    throw error;
  }
}

module.exports = { uploadFile };
