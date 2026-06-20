const cloudinary = require('cloudinary').v2;
const { env } = require('../config/env');

function ensureCloudinary() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    const error = new Error('Cloudinary credentials are required for uploads');
    error.status = 503;
    throw error;
  }
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  });
}

async function uploadBuffer(file, folder = 'hospital-2050') {
  ensureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => error ? reject(error) : resolve({
        url: result.secure_url,
        publicId: result.public_id,
        type: result.resource_type,
        name: file.originalname
      })
    );
    stream.end(file.buffer);
  });
}

module.exports = { uploadBuffer };
