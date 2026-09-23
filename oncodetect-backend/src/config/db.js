const mongoose = require('mongoose');

// ─── Conexión MongoDB Atlas ───────────────────────────────────────────────────
// En serverless (Vercel) NO se debe hacer process.exit(1): la función solo
// registra el error y sigue viva para reintentar en el siguiente request.
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Atlas conectado');
  } catch (err) {
    console.error('❌ MongoDB error:', err.message);
  }
}

module.exports = connectDB;