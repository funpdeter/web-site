const FUNDTER_SERVICE_KEYWORDS = [
  "proyecto",
  "planeacion",
  "territorial",
  "social",
  "educacion",
  "innovacion",
  "tecnologia",
  "cambio climatico",
  "infraestructura",
  "desarrollo rural",
  "comunidad",
  "fortalecimiento institucional",
];

const EXCLUDE_PATTERNS = [
  "for profit only",
  "private equity only",
  "only universities",
  "only municipalities",
  "must be based in united states",
  "must be headquartered in europe",
  "consorcio obligatorio internacional",
];

const ESAL_PATTERNS = [
  "esal",
  "ong",
  "nonprofit",
  "non-profit",
  "fundacion",
  "organizacion sin animo de lucro",
  "civil society organization",
  "cso",
  "charity",
];

const TERRITORIAL_SOCIAL_PATTERNS = [
  "territorial",
  "social",
  "comunit",
  "rural",
  "inclusion",
  "equidad",
  "educacion",
  "salud",
  "clima",
  "ambient",
];

const EXPERIENCE_PATTERNS = [
  "experiencia",
  "experience",
  "track record",
  "antecedentes",
  "institutional capacity",
  "technical capacity",
];

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function containsAny(text, patterns) {
  return patterns.some((pattern) => text.includes(pattern));
}

function countMatches(text, patterns) {
  return patterns.reduce((acc, pattern) => (text.includes(pattern) ? acc + 1 : acc), 0);
}

function scoreFromMatches(matches, maxMatches) {
  if (matches <= 0) {
    return 1;
  }
  const ratio = Math.min(1, matches / maxMatches);
  return Math.max(1, Math.min(5, Math.round(1 + ratio * 4)));
}

function evaluateFilters(opportunity, config) {
  const text = normalize(`${opportunity.title} ${opportunity.summary} ${opportunity.detailsText}`);

  const esalEligible = containsAny(text, ESAL_PATTERNS) || !containsAny(text, EXCLUDE_PATTERNS);
  const detectedCurrency = String(opportunity.detectedCurrency || "").toUpperCase();
  const detectedAmount = Number(opportunity.detectedAmount);
  const amountUsd = opportunity.amountUsd;
  const amountEligibleByDetected =
    Number.isFinite(detectedAmount) &&
    ["USD", "EUR"].includes(detectedCurrency) &&
    detectedAmount >= config.minAmountUsd &&
    detectedAmount <= config.maxAmountUsd;
  const amountEligibleByUsd =
    typeof amountUsd === "number" &&
    amountUsd >= config.minAmountUsd &&
    amountUsd <= config.maxAmountUsd;
  const amountEligible = amountEligibleByDetected || amountEligibleByUsd;
  const experienceRequiredCompatible =
    !text.includes("minimum 15 years") &&
    !text.includes("at least 10 years") &&
    !text.includes("solo entidades gubernamentales");
  const territorialOrSocialFocus = containsAny(text, TERRITORIAL_SOCIAL_PATTERNS);
  const noInternationalPresenceMandatory =
    !text.includes("must have international presence") &&
    !text.includes("presencia internacional obligatoria") &&
    !text.includes("headquartered outside");

  return {
    esalEligible,
    amountEligible,
    experienceRequiredCompatible,
    territorialOrSocialFocus,
    noInternationalPresenceMandatory,
  };
}

function evaluateMatrix(opportunity) {
  const text = normalize(`${opportunity.title} ${opportunity.summary} ${opportunity.detailsText}`);
  const alignmentMatches = countMatches(text, FUNDTER_SERVICE_KEYWORDS);
  const ciiuMatches = countMatches(text, [
    "consultoria",
    "asesoria",
    "servicios",
    "gestion",
    "project management",
    "technical assistance",
    "innovation",
    "data",
    "investigacion",
  ]);
  const experienceMatches = countMatches(text, EXPERIENCE_PATTERNS);
  const competitionMatches = countMatches(text, [
    "global call",
    "worldwide",
    "open to all countries",
    "international consortium",
    "multinational",
  ]);
  const complexityMatches = countMatches(text, [
    "multi-country",
    "highly specialized",
    "phd required",
    "advanced financial structuring",
    "complex procurement",
  ]);

  const criteria = {
    alineacionObjetoSocial: scoreFromMatches(alignmentMatches, 6),
    coherenciaCiiu: scoreFromMatches(ciiuMatches, 6),
    experienciaDemostrable: scoreFromMatches(experienceMatches, 5),
    competenciaEstimada: Math.max(1, 6 - Math.min(5, competitionMatches + 1)),
    complejidadTecnica: Math.max(1, 6 - Math.min(5, complexityMatches + 1)),
  };

  const total =
    criteria.alineacionObjetoSocial +
    criteria.coherenciaCiiu +
    criteria.experienciaDemostrable +
    criteria.competenciaEstimada +
    criteria.complejidadTecnica;

  let recommendation = "No aplicar";
  if (total >= 20) {
    recommendation = "Aplicar inmediatamente";
  } else if (total >= 15) {
    recommendation = "Aplicar con alianza";
  }

  return {
    criteria,
    total,
    recommendation,
  };
}

function isViable(filterResult, matrixResult) {
  const allFiltersPass =
    filterResult.esalEligible &&
    filterResult.amountEligible &&
    filterResult.experienceRequiredCompatible &&
    filterResult.territorialOrSocialFocus &&
    filterResult.noInternationalPresenceMandatory;

  return allFiltersPass && matrixResult.total >= 15;
}

module.exports = {
  evaluateFilters,
  evaluateMatrix,
  isViable,
};
