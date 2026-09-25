import multer from 'multer';

// Express 4 async xatolarni o'zi ushlamaydi — ularni umumiy xato ishlovchisiga uzatadi
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError || err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  console.error(`${req.method} ${req.originalUrl} xatosi:`, err);
  res.status(500).json({ error: 'server_error' });
}
