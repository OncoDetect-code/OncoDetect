const app = require('./app');

const PORT = process.env.PORT || 3001;

// ─── Iniciar servidor (solo para desarrollo local / Render) ──────────────────
// En Vercel este archivo NO se usa: Vercel ejecuta api/index.js.
// app.js ya se conecta a MongoDB en el arranque; los queries quedan en buffer
// hasta que la conexión esté lista.
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ OncoDetect API V5 corriendo en http://0.0.0.0:${PORT}`);
  console.log(`📋 Documentación Swagger: http://0.0.0.0:${PORT}/api-docs`);
  console.log(`📧 Gmail configurado: ${process.env.GMAIL_USER ? process.env.GMAIL_USER : '⚠️ GMAIL_USER no configurado'}`);
  console.log(`🔐 Auth JWT activo`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI cargada' : '⚠️ MONGODB_URI no configurada'}`);
});