/**
 * ========================================================
 * KURT REINTSCH - LIBRE | BOT WHATSAPP CON IA
 * ========================================================
 * Stack: whatsapp-web.js + Claude (Anthropic) + Express
 * ========================================================
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const Anthropic = require('@anthropic-ai/sdk');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ── Config ────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kurtalapaz2026';
const KB_PATH = path.join(__dirname, '../data/knowledge_base.json');
const CONVERSATIONS_PATH = path.join(__dirname, '../data/conversations.json');
const STATS_PATH = path.join(__dirname, '../data/stats.json');

// ── Anthropic Client ──────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Express App ───────────────────────────────────────────
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── State ─────────────────────────────────────────────────
let qrCodeData = null;
let clientReady = false;
const conversationHistory = {};  // { phoneNumber: [{ role, content }] }

// ── Load / Save helpers ───────────────────────────────────
function loadKB() {
  return fs.readJsonSync(KB_PATH);
}

function saveKB(data) {
  fs.writeJsonSync(KB_PATH, data, { spaces: 2 });
}

function loadStats() {
  if (!fs.existsSync(STATS_PATH)) {
    fs.writeJsonSync(STATS_PATH, { totalMessages: 0, uniqueUsers: [], joinRequests: 0, topQuestions: {} });
  }
  return fs.readJsonSync(STATS_PATH);
}

function saveStats(stats) {
  fs.writeJsonSync(STATS_PATH, stats, { spaces: 2 });
}

function updateStats(phone, message) {
  const stats = loadStats();
  stats.totalMessages++;
  if (!stats.uniqueUsers.includes(phone)) stats.uniqueUsers.push(phone);
  const lower = message.toLowerCase();
  if (lower.includes('unirme') || lower.includes('voluntario') || lower.includes('quiero unirme')) {
    stats.joinRequests++;
  }
  // Track common topics
  const topics = ['salud', 'educación', 'empleo', 'votar', 'propuestas', 'kurt'];
  topics.forEach(t => {
    if (lower.includes(t)) {
      stats.topQuestions[t] = (stats.topQuestions[t] || 0) + 1;
    }
  });
  saveStats(stats);
}

// ── Build system prompt from knowledge base ───────────────
function buildSystemPrompt() {
  const kb = loadKB();
  const faqsText = kb.faqs.map(f =>
    `Q: ${f.question}\nA: ${f.answer}`
  ).join('\n\n');

  return `Eres KurtBot, el asistente digital oficial de la campaña de Kurt Reintsch para la Gobernación de La Paz, Bolivia. Postula por el partido Libertad y República (LIBRE) en las elecciones del 22 de marzo de 2026.

TU PERSONALIDAD:
- Eres entusiasta, amigable, cálido y motivador
- Crees genuinamente en que "El Boliviano Puede" y lo transmites con orgullo
- Hablas en español boliviano natural, cercano, sin ser demasiado formal
- Usas emojis con moderación para hacer la conversación más dinámica 🔵🔴⚪
- Eres honesto: si no sabes algo, lo dices y ofreces conectar con el equipo humano
- Siempre terminas invitando a la persona a participar o a compartir la propuesta

TU MISIÓN:
1. Informar sobre las propuestas de Kurt de manera entusiasta y clara
2. Inspirar a las personas a unirse a la campaña como voluntarios
3. Motivar a votar por Kurt el 22 de marzo de 2026
4. Responder preguntas con base en la información de campaña
5. Derivar a humanos cuando la pregunta es muy específica o hay interés en voluntariado activo

INFORMACIÓN CLAVE DE LA CAMPAÑA:
Candidato: Kurt Reintsch
Partido: Libertad y República (LIBRE)
Cargo: Gobernador de La Paz
Fecha elecciones: 22 de marzo de 2026
Slogan: "El Boliviano Puede"

PROPUESTAS PRINCIPALES:
1. SALUD DIGITAL: Modernizar el SEDES La Paz con ENTEL Cloud + Starlink para dar acceso a salud digital a los 2.9 millones de paceños, incluyendo municipios rurales. Historia clínica digital, telemedicina, cero papel.
2. COOPERACIÓN INTERNACIONAL: Traer inversión sin endeudar a La Paz. Alianzas con el sector privado y fondos internacionales.
3. DESARROLLO PRODUCTIVO: Empleo real a través de alianzas público-privadas en turismo, tecnología y agroindustria.
4. TRANSPARENCIA: Gestión con resultados medibles y rendición de cuentas ciudadana.

PREGUNTAS FRECUENTES DE LA BASE DE CONOCIMIENTOS:
${faqsText}

REGLAS IMPORTANTES:
- NUNCA inventes datos que no estén en la información proporcionada
- Si alguien dice "QUIERO UNIRME" o "CONTACTO HUMANO", responde con entusiasmo y diles que el equipo los contactará pronto
- Mantén las respuestas concisas (máximo 3-4 párrafos) para WhatsApp
- Si alguien es crítico o negativo, responde con respeto y datos concretos
- Siempre cierra con una invitación a participar o compartir
- Recuerda que estás en WhatsApp: respuestas cortas y directas funcionan mejor`;
}

// ── Generate AI response ──────────────────────────────────
async function generateAIResponse(phone, userMessage) {
  // Init conversation history
  if (!conversationHistory[phone]) {
    conversationHistory[phone] = [];
  }

  // Add user message
  conversationHistory[phone].push({
    role: 'user',
    content: userMessage
  });

  // Keep only last 10 messages to avoid token overflow
  if (conversationHistory[phone].length > 10) {
    conversationHistory[phone] = conversationHistory[phone].slice(-10);
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: buildSystemPrompt(),
      messages: conversationHistory[phone],
    });

    const assistantMessage = response.content[0].text;

    // Save assistant response to history
    conversationHistory[phone].push({
      role: 'assistant',
      content: assistantMessage
    });

    return assistantMessage;
  } catch (error) {
    console.error('Error con Claude API:', error.message);
    return '¡Ups! Tuve un pequeño problema técnico. Por favor intenta de nuevo en un momento. Si necesitas ayuda urgente, escribe "CONTACTO HUMANO" y te conectamos con el equipo. 🙏';
  }
}

// ════════════════════════════════════════════════════════════
// WHATSAPP CLIENT
// ════════════════════════════════════════════════════════════
// En Docker/Linux usa Chromium del sistema; en Windows usa bundled
const puppeteerConfig = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
};
if (process.env.PUPPETEER_EXECUTABLE_PATH) {
  puppeteerConfig.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
}

const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(__dirname, '../.wwebjs_auth')
  }),
  puppeteer: puppeteerConfig
});

// QR Code event
whatsappClient.on('qr', async (qr) => {
  console.log('\n📱 ESCANEA ESTE QR CON TU WHATSAPP BUSINESS:\n');
  qrcode.generate(qr, { small: true });
  // Also save as image for the web panel
  try {
    qrCodeData = await QRCode.toDataURL(qr);
  } catch (e) {
    console.error('Error generando QR imagen:', e);
  }
});

// Ready event
whatsappClient.on('ready', () => {
  clientReady = true;
  qrCodeData = null;
  console.log('\n✅ WhatsApp Bot de Kurt LISTO y conectado!\n');
});

// Disconnected event
whatsappClient.on('disconnected', (reason) => {
  clientReady = false;
  console.log('❌ WhatsApp desconectado:', reason);
});

// Auth failure
whatsappClient.on('auth_failure', () => {
  clientReady = false;
  console.log('❌ Error de autenticación WhatsApp');
});

// ── Message handler ───────────────────────────────────────
whatsappClient.on('message', async (message) => {
  // Ignore group messages, status updates, etc.
  if (message.isGroupMsg || message.type !== 'chat') return;
  if (message.from === 'status@broadcast') return;

  const phone = message.from;
  const text = message.body?.trim();

  if (!text) return;

  console.log(`📨 Mensaje de ${phone}: ${text.substring(0, 50)}...`);

  // Update stats
  updateStats(phone, text);

  // Special commands
  const lower = text.toLowerCase();

  if (lower === 'hola' || lower === 'hi' || lower === 'inicio' || lower === 'start' || lower === 'menu') {
    const kb = loadKB();
    await message.reply(kb.conversation_starters[0]);
    return;
  }

  if (lower.includes('contacto humano') || lower.includes('quiero hablar con alguien')) {
    await message.reply(
      '¡Perfecto! Un miembro del equipo de Kurt se pondrá en contacto contigo muy pronto. 🤝\n\n' +
      'Mientras tanto, cuéntame: ¿en qué área te gustaría contribuir a la campaña?\n\n' +
      '• 📣 Difusión en redes sociales\n' +
      '• 🚶 Puerta a puerta en tu barrio\n' +
      '• 💻 Apoyo técnico/digital\n' +
      '• 🎤 Organización de eventos\n' +
      '• 🗳️ Testigo electoral el 22 de marzo\n\n' +
      '¡El Boliviano Puede y tú eres parte del cambio! 🔵🔴⚪'
    );
    return;
  }

  // Generate AI response
  try {
    const aiResponse = await generateAIResponse(phone, text);
    await message.reply(aiResponse);
    console.log(`✅ Respondido a ${phone}`);
  } catch (error) {
    console.error('Error respondiendo:', error);
    await message.reply(
      'Lo siento, tuve un pequeño error. ¡Intenta de nuevo! Si el problema persiste, escribe "CONTACTO HUMANO" 🙏'
    );
  }
});

// ════════════════════════════════════════════════════════════
// REST API — PANEL DE ADMINISTRACIÓN
// ════════════════════════════════════════════════════════════

// Middleware de autenticación básica para admin
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// GET /api/status — Estado del bot
app.get('/api/status', (req, res) => {
  res.json({
    connected: clientReady,
    hasQR: !!qrCodeData,
    timestamp: new Date().toISOString()
  });
});

// GET /api/qr — Obtener QR code para escanear
app.get('/api/qr', (req, res) => {
  if (clientReady) return res.json({ status: 'already_connected' });
  if (!qrCodeData) return res.json({ status: 'loading', message: 'Esperando QR...' });
  res.json({ status: 'pending', qr: qrCodeData });
});

// GET /api/stats — Estadísticas
app.get('/api/stats', requireAdmin, (req, res) => {
  const stats = loadStats();
  res.json({
    ...stats,
    uniqueUsersCount: stats.uniqueUsers.length,
    activeConversations: Object.keys(conversationHistory).length
  });
});

// GET /api/knowledge — Obtener base de conocimientos
app.get('/api/knowledge', requireAdmin, (req, res) => {
  res.json(loadKB());
});

// POST /api/knowledge/faq — Agregar nueva pregunta/respuesta
app.post('/api/knowledge/faq', requireAdmin, (req, res) => {
  const { question, answer, category, keywords } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: 'question y answer son requeridos' });
  }
  const kb = loadKB();
  const newFaq = {
    id: uuidv4(),
    category: category || 'general',
    question,
    answer,
    keywords: keywords || []
  };
  kb.faqs.push(newFaq);
  saveKB(kb);
  res.json({ success: true, faq: newFaq });
});

// PUT /api/knowledge/faq/:id — Editar pregunta
app.put('/api/knowledge/faq/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { question, answer, category, keywords } = req.body;
  const kb = loadKB();
  const idx = kb.faqs.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: 'FAQ no encontrada' });
  kb.faqs[idx] = { ...kb.faqs[idx], question, answer, category, keywords };
  saveKB(kb);
  res.json({ success: true, faq: kb.faqs[idx] });
});

// DELETE /api/knowledge/faq/:id — Eliminar pregunta
app.delete('/api/knowledge/faq/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const kb = loadKB();
  kb.faqs = kb.faqs.filter(f => f.id !== id);
  saveKB(kb);
  res.json({ success: true });
});

// POST /api/broadcast — Enviar mensaje a todos los usuarios (¡con cuidado!)
app.post('/api/broadcast', requireAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message requerido' });
  if (!clientReady) return res.status(503).json({ error: 'WhatsApp no conectado' });

  const stats = loadStats();
  const users = stats.uniqueUsers;
  let sent = 0, failed = 0;

  for (const phone of users) {
    try {
      await whatsappClient.sendMessage(phone, message);
      sent++;
      await new Promise(r => setTimeout(r, 1000)); // 1s delay between messages
    } catch (e) {
      failed++;
    }
  }

  res.json({ success: true, sent, failed, total: users.length });
});

// POST /api/test-message — Probar el bot sin WhatsApp
app.post('/api/test-message', requireAdmin, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message requerido' });
  const response = await generateAIResponse('test-user', message);
  res.json({ response });
});

// ── Serve admin panel ─────────────────────────────────────
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ════════════════════════════════════════════════════════════
// START
// ════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor KurtBot iniciado en puerto ${PORT}`);
  console.log(`📊 Panel admin: http://localhost:${PORT}/admin`);
  console.log(`🔑 Password admin: ${ADMIN_PASSWORD}\n`);
});

console.log('📱 Iniciando cliente WhatsApp...');
whatsappClient.initialize();
