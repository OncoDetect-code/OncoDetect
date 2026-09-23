// Entry point serverless para Vercel.
// Vercel NO ejecuta app.listen(): cada request llega a esta función.
// Todos los requests se redirigen aquí vía vercel.json.
const app = require('../app');

module.exports = app;