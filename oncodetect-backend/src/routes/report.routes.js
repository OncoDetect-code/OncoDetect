const express   = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

// Configuración SMTP explícita de Gmail (más estable en la nube que "service: gmail").
// El App Password se limpia de espacios (Gmail lo muestra en bloques de 4).
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  },
});

// Registro en memoria de envíos ya procesados (clave: requestId del cliente).
// Evita correos duplicados cuando el frontend reintenta un envío de la cola
// offline tras haber agotado su timeout (p. ej. cold start).
const processedRequests = new Map();
const PROCESSED_REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function pruneProcessedRequests() {
  const cutoff = Date.now() - PROCESSED_REQUEST_TTL_MS;
  for (const [id, ts] of processedRequests) {
    if (ts < cutoff) processedRequests.delete(id);
  }
}


// ─── POST /send-report ────────────────────────────────────────────────────────
/**
 * @swagger
 * /send-report:
 *   post:
 *     summary: Enviar reporte por correo
 *     description: Endpoint **público**. Envía el reporte HTML de una evaluación al(los) correo(s) indicado(s). Acepta uno o varios destinatarios separados por coma.
 *     tags: [Evaluación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientEmail, reportHtml]
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 description: "Uno o varios correos separados por coma"
 *                 example: "medico@hospital.hn, admin@fhnc.hn"
 *               patientName:
 *                 type: string
 *                 example: "Juan Pérez"
 *               patientAge:
 *                 type: number
 *                 example: 7
 *               userMode:
 *                 type: string
 *                 example: "medico"
 *               evaluationDate:
 *                 type: string
 *                 example: "2026-06-01"
 *               reportHtml:
 *                 type: string
 *                 example: "<h1>Reporte OncoDetect</h1>..."
 *     responses:
 *       200:
 *         description: Correo enviado correctamente
 *       400:
 *         description: Faltan campos requeridos
 *       500:
 *         description: Error al enviar el correo
 */
router.post('/', async (req, res) => {
  const { recipientEmail, patientName, patientAge, userMode, evaluationDate, reportHtml, requestId } = req.body;
  if (!recipientEmail) return res.status(400).json({ error: 'recipientEmail es requerido.' });
  if (!reportHtml)     return res.status(400).json({ error: 'reportHtml es requerido.' });
  const recipientCount = recipientEmail.split(',').length;

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Falta GMAIL_USER / GMAIL_APP_PASSWORD en las variables de entorno.' });
  }

  pruneProcessedRequests();
  const isDuplicate = requestId && processedRequests.has(requestId);
  if (!isDuplicate && requestId) processedRequests.set(requestId, Date.now());

  try {
    if (isDuplicate) {
      // El cliente reintenta un envío que ya se procesó (timeout de cold start): no duplicar.
      return res.json({ ok: true, duplicated: true, message: `Reporte ya enviado a ${recipientCount} destinatario(s).` });
    }
    await transporter.sendMail({
      from:    `OncoDetect <${process.env.GMAIL_USER}>`,
      to:      recipientEmail,
      subject: `OncoDetect — Reporte de ${patientName || 'Paciente'} (${evaluationDate || ''})`,
      html:    reportHtml,
    });
    console.log(`[/send-report] Correo enviado a ${recipientCount} destinatario(s) (requestId: ${requestId || 'n/a'}): ${recipientEmail}`);
    res.json({ ok: true, message: `Reporte enviado a ${recipientCount} destinatario(s)` });
  } catch (err) {
    if (requestId) processedRequests.delete(requestId);
    console.error('[/send-report] Error:', err.message);
    res.status(500).json({ error: 'Error al enviar el correo.', detail: err.message });
  }
});

module.exports = router;