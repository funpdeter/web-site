const fs = require("fs");
const https = require("https");
const path = require("path");

function buildTextBody(opportunity, evaluation) {
  return `Se detecto una oportunidad compatible para FUNDETER.

Fuente: ${opportunity.sourceName}
Titulo: ${opportunity.title}
URL: ${opportunity.url}
Fecha limite: ${opportunity.deadlineIso || "No identificada"}
Monto estimado USD: ${
    typeof opportunity.amountUsd === "number" ? Math.round(opportunity.amountUsd) : "No identificado"
  }
Puntaje total: ${evaluation.matrix.total}
Recomendacion: ${evaluation.matrix.recommendation}

Se adjuntan:
1) Requisitos de la convocatoria
2) Concept note alineado a FUNDETER
3) Prompt para publicacion bilingue en web
`;
}

async function sendBySmtp(config, payload) {
  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (error) {
    throw new Error(
      "nodemailer no esta instalado. Ejecuta: npm install nodemailer o usa UCI_MAIL_TRANSPORT=resend/console."
    );
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  await transporter.sendMail({
    from: config.smtp.from || config.notifyEmail,
    to: config.notifyEmail,
    subject: payload.subject,
    text: payload.text,
    attachments: payload.attachments.map((filePath) => ({
      filename: path.basename(filePath),
      path: filePath,
    })),
  });
}

function requestResend(apiKey, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300) {
            resolve(text);
            return;
          }
          reject(new Error(`Resend respondio ${res.statusCode}: ${text}`));
        });
      }
    );
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function sendByResend(config, payload) {
  if (!config.resend.apiKey) {
    throw new Error("RESEND_API_KEY no configurado.");
  }
  if (!config.resend.from) {
    throw new Error("RESEND_FROM no configurado.");
  }

  const attachments = payload.attachments.map((filePath) => {
    const content = fs.readFileSync(filePath);
    return {
      filename: path.basename(filePath),
      content: content.toString("base64"),
    };
  });

  await requestResend(config.resend.apiKey, {
    from: config.resend.from,
    to: [config.notifyEmail],
    subject: payload.subject,
    text: payload.text,
    attachments,
  });
}

async function sendOpportunityEmail(config, logger, opportunity, evaluation, attachments) {
  const payload = {
    subject: `[UCI-F] Oportunidad detectada: ${opportunity.sourceName} | ${opportunity.title}`.slice(
      0,
      220
    ),
    text: buildTextBody(opportunity, evaluation),
    attachments,
  };

  if (config.transport === "console") {
    logger.info("Notificacion en modo console (sin envio real).", {
      to: config.notifyEmail,
      subject: payload.subject,
      attachments,
    });
    return { sent: false, mode: "console" };
  }

  if (config.transport === "smtp") {
    await sendBySmtp(config, payload);
    logger.info("Correo enviado por SMTP.", { to: config.notifyEmail });
    return { sent: true, mode: "smtp" };
  }

  if (config.transport === "resend") {
    await sendByResend(config, payload);
    logger.info("Correo enviado por Resend.", { to: config.notifyEmail });
    return { sent: true, mode: "resend" };
  }

  throw new Error(`Transporte de correo no soportado: ${config.transport}`);
}

module.exports = {
  sendOpportunityEmail,
};
