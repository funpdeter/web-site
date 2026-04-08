# UCI-F Agent (Automatizacion de Oportunidades)

Este agente busca oportunidades de cooperacion y convocatorias en internet de forma recurrente, aplica filtros y matriz de elegibilidad FUNDETER, genera 3 archivos y envia notificaciones por correo.

## Modulos implementados

1. Radar inteligente de convocatorias (fuentes nacionales e internacionales).
2. Matriz de elegibilidad FUNDETER (5 criterios, puntaje total y recomendacion).
3. Generador automatico de Concept Note y documentos de soporte.
4. Estrategia de activacion operativa (notificacion + adjuntos).

## Ejecucion

### Una sola corrida

```bash
npm run uci-agent:once
```

### Modo recurrente (constante)

```bash
npm run uci-agent:watch
```

### Automatizacion persistente en Windows (Task Scheduler)

```powershell
powershell -ExecutionPolicy Bypass -File automation/uci-agent/register-scheduled-task.ps1 -IntervalHours 6
```

Para eliminar la tarea:

```powershell
powershell -ExecutionPolicy Bypass -File automation/uci-agent/remove-scheduled-task.ps1
```

## Variables de entorno

Copiar `.env.uci-agent.example` y ajustar valores reales:

- `UCI_AGENT_ENABLED=true`
- `UCI_SCAN_INTERVAL_MINUTES=360`
- `UCI_NOTIFY_EMAIL=info@fundeter.org`
- `UCI_MAIL_TRANSPORT=console|smtp|resend`
- `SMTP_*` o `RESEND_*` segun transporte elegido
- `UCI_SOURCE_IDS=usaid,ted-europa` (opcional para limitar fuentes)
- `UCI_ALWAYS_INCLUDE_COLOMBIA=true` (por defecto activo: siempre incluye fuentes nacionales de Colombia en cada ciclo)
- Rango objetivo configurable: `UCI_MIN_AMOUNT_USD=5000` y `UCI_MAX_AMOUNT_USD=5000000` (USD/EUR)

## Salidas

- Paquetes generados: `automation/uci-agent/output/<anio>/<timestamp>_.../`
  - `01_requisitos_convocatoria.md`
  - `02_concept_note_fundeter.md`
  - `03_prompt_publicacion_bilingue.md`
- Estado y deduplicacion: `automation/uci-agent/state/processed-opportunities.json`
- Snapshot para web: `public/uci-opportunity.json` (consumido por la seccion Gestion-UCI con cobertura regional minima: USA + Europa + varias de Colombia, y un maximo de 10 oportunidades)

## Nota

En `UCI_MAIL_TRANSPORT=console` el agente no envia correo real; solo registra las oportunidades y genera archivos.

## Automatizacion en GitHub Actions

El repositorio puede ejecutar este agente automaticamente con el workflow
`.github/workflows/uci-agent.yml`.

Resumen del flujo:

1. Corre cada 6 horas en GitHub Actions y tambien permite ejecucion manual.
2. Instala dependencias y ejecuta `npm run uci-agent:once`.
3. Actualiza `public/uci-opportunity.json`.
4. Mantiene la deduplicacion en `automation/uci-agent/state/processed-opportunities.json`.
5. Sube `automation/uci-agent/output/` como artefacto del workflow.
6. Hace commit y push del snapshot publico y del estado para conservar historial operativo entre ciclos.

Configurar en GitHub:

- Variables recomendadas: `UCI_MAIL_TRANSPORT`, `UCI_NOTIFY_EMAIL`, `UCI_SOURCE_IDS`
- Secrets SMTP: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- Secrets Resend: `RESEND_API_KEY`, `RESEND_FROM`

Si el sitio en produccion se despliega automaticamente desde este repositorio,
la seccion Gestion-UCI reflejara cada nueva actualizacion tras el push del workflow.
