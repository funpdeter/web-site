const fs = require("fs");
const path = require("path");
const { slugify } = require("./parsers.cjs");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function fmtAmountFromOpportunity(opportunity) {
  const detectedCurrency = String(opportunity?.detectedCurrency || "").toUpperCase();
  const detectedAmount = Number(opportunity?.detectedAmount);
  if (Number.isFinite(detectedAmount) && ["USD", "EUR"].includes(detectedCurrency)) {
    return `${detectedCurrency} ${Math.round(detectedAmount).toLocaleString("en-US")}`;
  }
  const amountUsd = opportunity?.amountUsd;
  if (typeof amountUsd !== "number") {
    return "No identificado";
  }
  return `USD ${Math.round(amountUsd).toLocaleString("en-US")}`;
}

function fmtDate(iso) {
  if (!iso) {
    return "No identificada";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "No identificada";
  }
  return date.toISOString().slice(0, 10);
}

function buildRequirementsDoc(opportunity, evaluation) {
  return `# Requisitos de Convocatoria

## Resumen
- Fuente: ${opportunity.sourceName}
- URL: ${opportunity.url}
- Titulo detectado: ${opportunity.title}
- Fecha limite detectada: ${fmtDate(opportunity.deadlineIso)}
- Monto detectado: ${fmtAmountFromOpportunity(opportunity)}

## Filtros automaticos UCI-F
- ESAL elegible: ${evaluation.filters.esalEligible ? "SI" : "NO"}
- Monto entre USD/EUR 5.000 y 5.000.000: ${evaluation.filters.amountEligible ? "SI" : "NO"}
- Experiencia requerida compatible: ${evaluation.filters.experienceRequiredCompatible ? "SI" : "NO"}
- Enfoque territorial o social: ${evaluation.filters.territorialOrSocialFocus ? "SI" : "NO"}
- No exige presencia internacional previa obligatoria: ${
    evaluation.filters.noInternationalPresenceMandatory ? "SI" : "NO"
  }

## Matriz de Elegibilidad FUNDETER
| Criterio | Puntaje |
|---|---:|
| Alineacion con objeto social | ${evaluation.matrix.criteria.alineacionObjetoSocial} |
| Coherencia con CIIU 9499 / 7020 / 7490 | ${evaluation.matrix.criteria.coherenciaCiiu} |
| Experiencia demostrable | ${evaluation.matrix.criteria.experienciaDemostrable} |
| Competencia estimada | ${evaluation.matrix.criteria.competenciaEstimada} |
| Complejidad tecnica | ${evaluation.matrix.criteria.complejidadTecnica} |
| **Total** | **${evaluation.matrix.total}** |

## Recomendacion
**${evaluation.matrix.recommendation}**

## Evidencia textual detectada
${opportunity.summary}
`;
}

function buildConceptNoteDoc(opportunity, evaluation) {
  const recommendationNote =
    evaluation.matrix.recommendation === "Aplicar con alianza"
      ? "Se recomienda articular una alianza internacional o academia para fortalecer la postulacion."
      : "La convocatoria es compatible para postulacion directa de FUNDETER.";

  return `# Concept Note - FUNDETER

## Convocatoria Objetivo
- Fuente: ${opportunity.sourceName}
- URL: ${opportunity.url}
- Recomendacion: ${evaluation.matrix.recommendation}

## Problema territorial
Los territorios con brechas sociales y de capacidades institucionales requieren intervenciones tecnicas integrales para formular, ejecutar y monitorear proyectos de alto impacto.

## Justificacion tecnica
FUNDETER cuenta con experiencia en planeacion territorial, formulacion y gestion de proyectos, fortalecimiento institucional, inclusion social, innovacion y tecnologia aplicada al desarrollo.

## Marco ODS
- ODS 4: Educacion de calidad
- ODS 9: Industria, innovacion e infraestructura
- ODS 10: Reduccion de desigualdades
- ODS 11: Ciudades y comunidades sostenibles
- ODS 13: Accion por el clima
- ODS 17: Alianzas para lograr los objetivos

## Metodologia
1. Diagnostico territorial y mapeo de actores.
2. Diseno participativo del plan de accion.
3. Implementacion por paquetes de trabajo.
4. Monitoreo de indicadores y mejora continua.
5. Cierre con transferencia de capacidades.

## Resultados esperados
- Fortalecimiento de capacidades institucionales y comunitarias.
- Hoja de ruta operativa para proyectos priorizados.
- Sistema de seguimiento con indicadores verificables.
- Evidencia de impacto social y territorial.

## Indicadores sugeridos
- Numero de beneficiarios directos e indirectos.
- Porcentaje de metas de implementacion cumplidas.
- Recursos movilizados para ejecucion territorial.
- Numero de actores institucionales fortalecidos.

## Presupuesto estimado
${fmtAmountFromOpportunity(opportunity)}

## Ventaja comparativa FUNDETER
- Trayectoria en planeacion y desarrollo territorial.
- Enfoque social con capacidad tecnica multidisciplinaria.
- Experiencia en articulacion con entidades publicas y privadas.
- Conocimiento del contexto colombiano y regional.

## Nota estrategica
${recommendationNote}
`;
}

function buildPublicationPromptDoc(opportunity) {
  return `# Prompt para Publicacion Bilingue (ES/EN)

Usa este prompt para generar una publicacion en la web de FUNDETER para aliados estrategicos:

---
Eres un redactor experto en cooperacion internacional.
Genera una publicacion breve en ESPANOL e INGLES sobre la oportunidad detectada.

Datos de entrada:
- Fuente: ${opportunity.sourceName}
- Titulo: ${opportunity.title}
- URL oficial: ${opportunity.url}
- Fecha limite: ${fmtDate(opportunity.deadlineIso)}
- Monto estimado: ${fmtAmountFromOpportunity(opportunity)}
- Resumen detectado: ${opportunity.summary}

Requisitos de salida:
1. Entregar seccion en ESPANOL y en INGLES.
2. Usar tono claro, institucional y orientado a aliados estrategicos.
3. Incluir: objetivo, quienes pueden aplicar, fecha limite, monto (si aplica), enlace oficial, llamado a accion.
4. Maximo 220 palabras por idioma.
5. Incluir al final 5 hashtags relevantes por idioma.
---
`;
}

function writeOpportunityPackage(baseOutputDir, opportunity, evaluation) {
  ensureDir(baseOutputDir);
  const datePart = new Date().toISOString().replace(/[:.]/g, "-");
  const folderName = `${datePart}_${slugify(opportunity.sourceName)}_${slugify(
    opportunity.title
  ).slice(0, 50) || "oportunidad"}`;
  const packageDir = path.join(baseOutputDir, folderName);
  ensureDir(packageDir);

  const requirementsPath = path.join(packageDir, "01_requisitos_convocatoria.md");
  const conceptPath = path.join(packageDir, "02_concept_note_fundeter.md");
  const promptPath = path.join(packageDir, "03_prompt_publicacion_bilingue.md");
  const metadataPath = path.join(packageDir, "metadata.json");

  fs.writeFileSync(requirementsPath, buildRequirementsDoc(opportunity, evaluation), "utf-8");
  fs.writeFileSync(conceptPath, buildConceptNoteDoc(opportunity, evaluation), "utf-8");
  fs.writeFileSync(promptPath, buildPublicationPromptDoc(opportunity), "utf-8");
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        opportunity,
        evaluation,
      },
      null,
      2
    ),
    "utf-8"
  );

  return {
    packageDir,
    files: [requirementsPath, conceptPath, promptPath, metadataPath],
    emailAttachments: [requirementsPath, conceptPath, promptPath],
  };
}

function writePublicOpportunitySnapshot(filePath, snapshot) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

function writePublicOpportunityHistory(filePath, history) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), "utf-8");
}

module.exports = {
  writeOpportunityPackage,
  writePublicOpportunitySnapshot,
  writePublicOpportunityHistory,
};
