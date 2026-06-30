import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const UPLOAD_BASE = process.env.UPLOAD_PATH || './uploads';
export const dirs = {
  profiles: path.join(UPLOAD_BASE, 'profiles'),
  documents: path.join(UPLOAD_BASE, 'documents'),
  logos: path.join(UPLOAD_BASE, 'logos'),
};
Object.values(dirs).forEach(ensureDir);

// ─── Multer Memory Storage (we process before saving) ────────────────────────
const memoryStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only images are allowed (jpeg, png, webp)'), { statusCode: 400 }));
};

const documentFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(Object.assign(new Error('Only PDF and image files are allowed'), { statusCode: 400 }));
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024;

// ─── Upload Middlewares ───────────────────────────────────────────────────────
export const uploadProfileImage = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('profile_image');

export const uploadLogo = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_SIZE, files: 1 },
}).single('logo');

export const uploadDocuments = multer({
  storage: memoryStorage,
  fileFilter: documentFilter,
  limits: { fileSize: MAX_SIZE, files: 10 },
}).array('documents', 10);

// ─── Image Processing ─────────────────────────────────────────────────────────
export const processProfileImage = async (buffer, subdir = 'profiles') => {
  const filename = `${uuidv4()}.webp`;
  const outputPath = path.join(UPLOAD_BASE, subdir, filename);

  await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  return `/uploads/${subdir}/${filename}`;
};

export const processLogoImage = async (buffer) => {
  const filename = `${uuidv4()}.webp`;
  const outputPath = path.join(dirs.logos, filename);

  await sharp(buffer)
    .resize(300, 300, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .webp({ quality: 90 })
    .toFile(outputPath);

  return `/uploads/logos/${filename}`;
};

export const saveDocument = async (buffer, originalname, mimetype) => {
  const ext = path.extname(originalname) || '.pdf';
  const filename = `${uuidv4()}${ext}`;
  const outputPath = path.join(dirs.documents, filename);

  fs.writeFileSync(outputPath, buffer);

  return {
    url: `/uploads/documents/${filename}`,
    filename: originalname,
    size: buffer.length,
    mimetype,
  };
};

export const deleteFile = (fileUrl) => {
  try {
    const filePath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    // Non-critical
  }
};
export default {
  uploadProfileImage,
  uploadLogo,
  uploadDocuments,
  processProfileImage,
  processLogoImage,
  saveDocument,
  deleteFile,
  dirs,
};
