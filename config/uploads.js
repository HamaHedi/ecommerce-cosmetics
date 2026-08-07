// Shared upload limits, used by the express-fileupload middleware and by the
// controllers that need to explain *why* a file was rejected.
const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 10;

module.exports = {
	MAX_UPLOAD_MB,
	MAX_UPLOAD_BYTES: MAX_UPLOAD_MB * 1024 * 1024,
	ALLOWED_IMAGE_MIMETYPES: ['image/png', 'image/jpg', 'image/jpeg'],
};
