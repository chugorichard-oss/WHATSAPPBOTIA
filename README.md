# 🤖 KurtBot — WhatsApp Chatbot para Campaña Política & Servicio Ciudadano

[![Node.js](https://img.shields.io/badge/Node.js-22-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Business-25D366?style=flat-square&logo=whatsapp)](https://web.whatsapp.com/)
[![Claude AI](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat-square)](https://www.anthropic.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

> **WhatsApp es la herramienta de comunicación #1 en Bolivia.** Este proyecto nació con la convicción de que la tecnología debe acercar a los ciudadanos con quienes los representan — y también servir como herramienta de digitalización real para cualquier organización, empresa o candidato.

---

## 🌎 El Contexto

Este bot fue desarrollado para la campaña de **Kurt Reintsch**, candidato a Gobernador de La Paz por el partido **LIBRE** en las elecciones del 22 de marzo de 2026 en Bolivia.

Su propósito era doble:

1. **Comunicación ciudadana directa** — responder preguntas sobre propuestas, salud, caminos, educación y seguridad, disponible 24/7 vía WhatsApp.
2. **Demostrar en la práctica** la propuesta de digitalización del sistema de salud (SEDES) y servicios del departamento de La Paz.

Aunque la campaña no resultó ganadora, el proyecto queda **abierto y disponible** para cualquier organización, municipio, empresa o emprendedor boliviano que quiera implementar un chatbot de WhatsApp con IA.

> 💬 **¿Quieres implementarlo?** Escríbeme: [linkedin.com/in/hugo-ramirez-cloud](https://linkedin.com/in/hugo-ramirez-cloud)

---

## ✨ Funcionalidades

| Feature | Descripción |
|---|---|
| 🧠 **IA Conversacional** | Powered by Claude AI (Anthropic) — respuestas naturales e inteligentes |
| 📱 **WhatsApp nativo** | Integración via Baileys — sin API oficial de pago |
| 🗄️ **Base de conocimiento** | JSON editable con FAQs, propuestas y contenido personalizado |
| 🖥️ **Panel de administración** | Web UI para gestionar preguntas, respuestas y estadísticas |
| 📢 **Broadcast masivo** | Envío de mensajes a múltiples contactos desde el panel admin |
| 🐳 **Docker Ready** | Deploy en un solo comando — funciona en cualquier Linux |
| 🔄 **Auto-restart** | Reinicio automático ante caídas del sistema |
| 💾 **Sesión persistente** | No necesitas escanear el QR cada vez que reinicia |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO FINAL                         │
│              (WhatsApp en su celular)                    │
└─────────────────────┬───────────────────────────────────┘
                      │ Mensaje WhatsApp
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   KURTBOT SERVER                         │
│                  (Node.js + Express)                     │
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────┐  │
│  │   Baileys    │───▶│  Procesador  │───▶│ Claude AI │  │
│  │  (WhatsApp   │    │  de Mensajes │    │(Anthropic)│  │
│  │   Client)    │    │              │    │           │  │
│  └──────────────┘    └──────┬───────┘    └───────────┘  │
│                             │                            │
│                      ┌──────▼───────┐                   │
│                      │  Knowledge   │                   │
│                      │     Base     │                   │
│                      │  (JSON/FAQs) │                   │
│                      └──────────────┘                   │
└─────────────────────┬───────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │    PANEL DE ADMIN     │
          │   (Web UI - Port 3000)│
          │  • Gestionar FAQs     │
          │  • Ver conversaciones │
          │  • Enviar broadcasts  │
          │  • Ver estadísticas   │
          └───────────────────────┘
```

---

## 🚀 Instalación Rápida

### Pre-requisitos
- Ubuntu 20.04+ / Debian / cualquier Linux
- Docker + Docker Compose instalado
- Cuenta de WhatsApp Business o personal
- API Key de Anthropic (Claude)

### Deploy en 3 pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/kurtbot.git
cd kurtbot

# 2. Configurar variables de entorno
cp .env.example .env
nano .env   # Agregar tu ANTHROPIC_API_KEY y ADMIN_PASSWORD

# 3. Levantar con Docker
docker-compose up -d

# Escanear QR para conectar WhatsApp
./bot.sh qr
```

¡Listo! El bot estará corriendo en `http://localhost:3000`

---

## ⚙️ Configuración (.env)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxx
ADMIN_PASSWORD=tu_password_seguro
PORT=3000
BOT_NAME=KurtBot
```

---

## 📋 Comandos de Gestión

```bash
./bot.sh start      # Iniciar el bot
./bot.sh stop       # Detener el bot
./bot.sh restart    # Reiniciar
./bot.sh status     # Ver estado
./bot.sh logs       # Ver logs en tiempo real
./bot.sh qr         # Mostrar QR para conectar WhatsApp
./bot.sh update     # Actualizar a última versión
./bot.sh reset-wa   # Resetear sesión de WhatsApp
```

---

## 🗄️ Personalizar la Base de Conocimiento

Edita `data/knowledge_base.json` o usa el Panel de Administración:

```json
{
  "faqs": [
    {
      "id": "1",
      "question": "¿Cuáles son las propuestas de salud?",
      "answer": "Digitalizaremos los 337 centros de salud de La Paz...",
      "category": "salud"
    }
  ]
}
```

---

## 🖥️ Panel de Administración

Accede en: `http://localhost:3000/admin`

- ✅ Agregar / editar / eliminar FAQs
- ✅ Ver historial de conversaciones
- ✅ Enviar mensajes broadcast
- ✅ Estadísticas de uso en tiempo real

---

## 🔧 Stack Tecnológico

| Tecnología | Uso |
|---|---|
| **Node.js 22** | Runtime principal |
| **Express.js** | Servidor web y API REST |
| **Baileys** | Cliente WhatsApp Web (no oficial) |
| **Claude AI** | Motor de inteligencia artificial |
| **Docker** | Contenedorización y deploy |
| **Chromium** | Headless browser para WhatsApp Web |

---

## 📊 Casos de Uso

Este mismo bot puede adaptarse para:

- 🏥 **Centros de salud** — turnos, consultas, información de servicios
- 🏛️ **Municipios** — trámites, noticias, alertas ciudadanas
- 🏪 **Comercios** — catálogo, pedidos, atención al cliente 24/7
- 🎓 **Instituciones educativas** — horarios, tareas, comunicados
- 🏢 **Empresas** — soporte al cliente, FAQ automatizado
- 🗳️ **Campañas políticas** — comunicación directa con ciudadanos

---

## 🤝 Contribuir

¿Quieres mejorar el proyecto? Los PRs son bienvenidos.

1. Fork el repositorio
2. Crea tu rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agrega nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 👨‍💻 Autor

**Hugo Ramírez**
Cloud & Infrastructure Engineer | Bolivia 🇧🇴

- 💼 [linkedin.com/in/hugo-ramirez-cloud](https://linkedin.com/in/hugo-ramirez-cloud)
- 🐙 GitHub: [@chugorichard-oss](https://github.com/chugorichard-oss)

> *Este proyecto fue desarrollado con asistencia de **Claude AI** (Anthropic) — un ejemplo real de cómo la IA puede acelerar el desarrollo de soluciones con impacto social.*

---

## 📄 Licencia

MIT License — libre para usar, modificar y distribuir con atribución.

---

<div align="center">

**Hecho con ❤️ para Bolivia 🇧🇴**

*"El Boliviano Puede" —  La Paz 2026*

</div>
