require('dotenv').config();
const path         = require('path');
const express      = require('express');
const cors         = require('cors');
const swaggerUi    = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const connectDB          = require('./src/config/db');
const authRoutes         = require('./src/routes/auth.routes');
const evaluateRoutes     = require('./src/routes/evaluate.routes');
const reportRoutes       = require('./src/routes/report.routes');
const evaluationsRoutes  = require('./src/routes/evaluations.routes');

// ─── Conexión base de datos (safe para serverless: no mata el proceso) ───────
connectDB();

// ─── App Express ──────────────────────────────────────────────────────────────
const app  = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ─── Swagger ──────────────────────────────────────────────────────────────────
// Ruta absoluta para que swagger-jsdoc funcione igual en local y en Vercel.
const apiGlob = path.join(__dirname, 'src', 'routes', '*.routes.js').replace(/\\/g, '/');
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OncoDetect API V5',
      version: '5.0.0',
      description: `
## OncoDetect — Sistema de Tamizaje Oncológico Pediátrico
**UNITEC | San Pedro Sula, Honduras | 2026**

Diseñado por: Luis Velásquez y Fernando Hernández

### Instrucciones de uso
1. Usa **POST /auth/login** para obtener un token JWT.
2. Haz clic en el botón **Authorize 🔒** (arriba a la derecha).
3. Escribe \`Bearer <tu_token>\` y confirma.
4. Ahora puedes probar los endpoints protegidos.
      `,
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Pega aquí el token obtenido de POST /auth/login',
        },
      },
    },
  },
  apis: [apiGlob],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'OncoDetect API Docs',
  customCss: `
    .topbar { background-color: #0b2545 !important; }
    .topbar-wrapper img { display: none; }
    .topbar-wrapper::before { content: '🔬 OncoDetect API V5'; color: white; font-size: 18px; font-weight: bold; }
  `,
}));

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    version: 'V5',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/auth',         authRoutes);
app.use('/evaluate',     evaluateRoutes);
app.use('/send-report',  reportRoutes);
app.use('/evaluations',  evaluationsRoutes);

module.exports = app;