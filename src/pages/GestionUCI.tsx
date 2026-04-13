import React, { useEffect, useMemo, useState } from 'react';
import './GestionUCI.css';

interface OpportunityCardData {
  id?: string;
  sourceId?: string;
  title?: string;
  source?: string;
  sourceTier?: string;
  region?: string;
  deadline?: string;
  amount?: number | null;
  currency?: string;
  amountUsd?: number | null;
  scoreTotal?: number;
  recommendation?: string;
  isViable?: boolean;
  url?: string;
  publicationNumber?: string | null;
  firstSeenAt?: string;
  lastSeenAt?: string;
  lastPublishedAt?: string;
  isArchived?: boolean;
}

interface OpportunitySnapshot {
  hasOpportunities?: boolean;
  updatedAt?: string;
  opportunities?: OpportunityCardData[];
  message?: string;
  hasOpportunity?: boolean;
  title?: string;
  source?: string;
  sourceTier?: string;
  deadline?: string;
  amountUsd?: number | null;
  scoreTotal?: number;
  recommendation?: string;
  isViable?: boolean;
  url?: string;
}

const fallbackUSA: OpportunityCardData = {
  title: 'Tribal Colleges and Universities Program',
  source: 'USAID',
  region: 'USA',
  deadline: '2026-04-01T00:00:00.000Z',
  amount: 3500000,
  currency: 'USD',
  amountUsd: 3500000,
  scoreTotal: 16,
  recommendation: 'Aplicar con alianza',
  isViable: true,
  url: 'https://www.grants.gov/search-results-detail/334326',
};

const fallbackEurope: OpportunityCardData = {
  title: 'Emerging Technologies in Digital Policing',
  source: 'TED Europa',
  region: 'Europa',
  deadline: '2026-05-09T00:00:00.000Z',
  amount: 238328245,
  currency: 'EUR',
  amountUsd: 257394504,
  scoreTotal: 16,
  recommendation: 'Aplicar con alianza',
  isViable: true,
  url: 'https://ted.europa.eu/en/notice/-/detail/183121-2026',
};

const fallbackColombia: OpportunityCardData = {
  title: 'Convocatoria nacional en evaluación',
  source: 'Fuentes Colombia',
  region: 'Colombia',
  deadline: '',
  amount: null,
  currency: 'COP',
  amountUsd: null,
  scoreTotal: 0,
  recommendation: 'En monitoreo',
  isViable: false,
  url: '',
};

function normalizeRegion(value?: string): string {
  const raw = String(value || '').trim().toUpperCase();
  if (raw.includes('COLOMBIA') || raw.includes('NACIONAL') || raw.includes('CO')) {
    return 'Colombia';
  }
  if (raw.includes('USA') || raw.includes('UNITED')) {
    return 'USA';
  }
  if (raw.includes('EUROPA') || raw.includes('EUROPE') || raw.includes('EU')) {
    return 'Europa';
  }
  return raw ? value || 'Internacional' : 'Internacional';
}

function formatDate(dateIso?: string): string {
  if (!dateIso) {
    return 'No identificada';
  }
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) {
    return 'No identificada';
  }
  return date.toISOString().slice(0, 10);
}

function makeOpportunityKey(opportunity: OpportunityCardData): string {
  return String(
    opportunity.id ||
      opportunity.publicationNumber ||
      opportunity.url ||
      `${opportunity.source || ''}|${opportunity.title || ''}`
  ).trim();
}

function formatAmount(opportunity: OpportunityCardData): string {
  const currency = String(opportunity.currency || '').toUpperCase();
  const amount = opportunity.amount;
  if (typeof amount === 'number' && !Number.isNaN(amount)) {
    const safeCurrency = currency || 'USD';
    return `${safeCurrency} ${Math.round(amount).toLocaleString('en-US')}`;
  }

  if (typeof opportunity.amountUsd === 'number' && !Number.isNaN(opportunity.amountUsd)) {
    return `USD ${Math.round(opportunity.amountUsd).toLocaleString('en-US')}`;
  }

  return 'No identificado';
}

function normalizeLegacySnapshot(data: OpportunitySnapshot): OpportunityCardData[] {
  if (data.hasOpportunity && data.title) {
    const source = String(data.source || '').toLowerCase();
    const region = source.includes('usa')
      ? 'USA'
      : source.includes('europa') || source.includes('europe')
      ? 'Europa'
      : 'Colombia';
    return [
      {
        title: data.title,
        source: data.source,
        sourceTier: data.sourceTier,
        region,
        deadline: data.deadline,
        amount: data.amountUsd,
        currency: 'USD',
        amountUsd: data.amountUsd,
        scoreTotal: data.scoreTotal,
        recommendation: data.recommendation,
        isViable: data.isViable,
        url: data.url,
      },
    ];
  }

  return [];
}

const GestionUCI: React.FC = () => {
  const [snapshot, setSnapshot] = useState<OpportunitySnapshot | null>(null);
  const [historySnapshot, setHistorySnapshot] = useState<OpportunitySnapshot | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSnapshot = async () => {
      try {
        const response = await fetch(`${process.env.PUBLIC_URL}/uci-opportunity.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as OpportunitySnapshot;
        if (mounted && data && typeof data === 'object') {
          setSnapshot(data);
        }
      } catch (_error) {
        // Fallback silencioso al contenido base.
      }

      try {
        const historyResponse = await fetch(
          `${process.env.PUBLIC_URL}/uci-opportunity-history.json?ts=${Date.now()}`,
          {
            cache: 'no-store',
          }
        );

        if (!historyResponse.ok) {
          return;
        }

        const historyData = (await historyResponse.json()) as OpportunitySnapshot;
        if (mounted && historyData && typeof historyData === 'object') {
          setHistorySnapshot(historyData);
        }
      } catch (_error) {
        // Fallback silencioso al contenido base.
      }
    };

    loadSnapshot();

    return () => {
      mounted = false;
    };
  }, []);

  const liveOpportunities = useMemo(() => {
    const fromSnapshot = Array.isArray(snapshot?.opportunities)
      ? snapshot?.opportunities || []
      : snapshot
      ? normalizeLegacySnapshot(snapshot)
      : [];

    const normalized: OpportunityCardData[] = fromSnapshot.map((item) => ({
      ...item,
      region: normalizeRegion(item.region),
    }));

    const priority = (region?: string): number => {
      const normalizedRegion = normalizeRegion(region);
      if (normalizedRegion === 'Colombia') {
        return 0;
      }
      if (normalizedRegion === 'USA') {
        return 1;
      }
      if (normalizedRegion === 'Europa') {
        return 2;
      }
      return 3;
    };

    const prioritized = normalized
      .slice()
      .sort((a, b) => priority(a.region) - priority(b.region));

    return prioritized;
  }, [snapshot]);

  const opportunities = useMemo(() => {
    if (liveOpportunities.length) {
      const output: OpportunityCardData[] = liveOpportunities.slice();
      if (!output.some((item) => normalizeRegion(item.region) === 'Colombia')) {
        output.unshift(fallbackColombia);
      }
      if (!output.some((item) => normalizeRegion(item.region) === 'USA')) {
        output.push(fallbackUSA);
      }
      if (!output.some((item) => normalizeRegion(item.region) === 'Europa')) {
        output.push(fallbackEurope);
      }
      return output;
    }

    return [fallbackColombia, fallbackUSA, fallbackEurope];
  }, [liveOpportunities]);

  const historyOpportunities = useMemo(() => {
    const historyItems = historySnapshot?.opportunities;

    if (!Array.isArray(historyItems)) {
      return [];
    }

    return historyItems.map((item) => ({
      ...item,
      region: normalizeRegion(item.region),
    }));
  }, [historySnapshot]);

  const archivedOpportunities = useMemo(() => {
    const currentKeys = new Set(liveOpportunities.map(makeOpportunityKey).filter(Boolean));

    return historyOpportunities.filter((item) => {
      const key = makeOpportunityKey(item);
      if (!key) {
        return false;
      }
      return Boolean(item.isArchived) || !currentKeys.has(key);
    });
  }, [historyOpportunities, liveOpportunities]);

  return (
    <div className="gestion-uci">
      <section className="page-hero">
        <div className="page-hero-content gestion-uci-hero-content">
          <h1>Gestión de Proyectos</h1>
          <div className="gestion-uci-brand">FUNDETER</div>
          <p>Unidad de Cooperación Internacional</p>
        </div>
      </section>

      <section className="uci-opportunities">
        <div className="container">
          <div className="uci-heading">
            <h2>Oportunidades recomendadas</h2>
            <p>
              Aquí publicaremos oportunidades reales detectadas y evaluadas por nuestros agentes especializados
            </p>
          </div>

          <div className="opportunity-list">
            {opportunities.map((opportunity, index) => (
              <article className="opportunity-card" key={`${opportunity.title || 'op'}-${index}`}>
                <div className="opportunity-status">Oportunidad recomendada</div>
                <h3>{opportunity.title || 'Sin título disponible'}</h3>
                <p className="opportunity-note">
                  Detectada por el agente UCI-F y evaluada con la matriz de elegibilidad.
                </p>

                <div className="opportunity-meta">
                  <p>
                    <strong>Región:</strong> {normalizeRegion(opportunity.region)}
                  </p>
                  <p>
                    <strong>Fuente:</strong> {opportunity.source || 'No identificada'}
                  </p>
                  <p>
                    <strong>Fecha límite:</strong> {formatDate(opportunity.deadline)}
                  </p>
                  <p>
                    <strong>Monto detectado:</strong> {formatAmount(opportunity)}
                  </p>
                  <p>
                    <strong>Puntaje de elegibilidad:</strong> {opportunity.scoreTotal ?? 'No disponible'}
                  </p>
                  <p>
                    <strong>Resultado de evaluación:</strong> {opportunity.recommendation || 'No disponible'}
                  </p>
                </div>

                <div className="hero-actions opportunity-actions">
                  {opportunity.url ? (
                    <a
                      href={opportunity.url}
                      className="cta-button"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver oportunidad oficial
                    </a>
                  ) : (
                    <span className="cta-button secondary disabled">Enlace no disponible</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {showHistory ? (
            <div className="uci-history-shell">
              <div className="uci-history-heading">
                <h3>Histórico de convocatorias</h3>
                <p>
                  Aquí puedes consultar oportunidades que ya salieron del listado principal pero quedaron
                  registradas por el agente UCI-F.
                </p>
              </div>

              {archivedOpportunities.length ? (
                <div className="uci-history-list">
                  {archivedOpportunities.map((opportunity, index) => (
                    <article className="uci-history-card" key={`${makeOpportunityKey(opportunity)}-${index}`}>
                      <div className="uci-history-status">Convocatoria archivada</div>
                      <h3>{opportunity.title || 'Sin título disponible'}</h3>

                      <div className="uci-history-meta">
                        <p>
                          <strong>Región:</strong> {normalizeRegion(opportunity.region)}
                        </p>
                        <p>
                          <strong>Fuente:</strong> {opportunity.source || 'No identificada'}
                        </p>
                        <p>
                          <strong>Fecha límite:</strong> {formatDate(opportunity.deadline)}
                        </p>
                        <p>
                          <strong>Monto detectado:</strong> {formatAmount(opportunity)}
                        </p>
                        <p>
                          <strong>Resultado:</strong> {opportunity.recommendation || 'No disponible'}
                        </p>
                        <p>
                          <strong>Última aparición:</strong> {formatDate(opportunity.lastSeenAt)}
                        </p>
                      </div>

                      <div className="hero-actions opportunity-actions history-actions">
                        {opportunity.url ? (
                          <a
                            href={opportunity.url}
                            className="cta-button"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ver convocatoria
                          </a>
                        ) : (
                          <span className="cta-button secondary disabled">Enlace no disponible</span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="uci-history-empty">
                  Aún no hay convocatorias archivadas fuera del listado principal.
                </div>
              )}
            </div>
          ) : null}

          <div className="hero-actions uci-footer-actions">
            <button
              type="button"
              className="cta-button history-toggle-button"
              onClick={() => setShowHistory((current) => !current)}
            >
              {showHistory
                ? 'Ocultar histórico'
                : `Ver histórico de convocatorias${archivedOpportunities.length ? ` (${archivedOpportunities.length})` : ''}`}
            </button>
          </div>
        </div>
      </section>

      <section className="home-footer-bottom gestion-uci-footer">
        <div className="container home-footer-bottom-content">
          <div className="home-footer-col">
            <h4>FUNDETER-ORG</h4>
            <p>
              Somos una entidad sin ánimo de lucro con sede en Santa Marta - Magdalena, con más de 12 años de
              trayectoria institucional. Planeamos y transformamos territorios con sentido social.
            </p>
          </div>
          <div className="home-footer-col">
            <h4>Información de contacto</h4>
            <p>✉️ info@fundeter.org</p>
            <p>📲+57 313 744 9160</p>
            <p>📍 Carrera 66 # 48 - 106 Casa M3 Urbanización San Lorenzo, Santa Marta D.T.C.H. - Colombia.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GestionUCI;
