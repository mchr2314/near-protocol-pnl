import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';
import type { ProvenanceRecord } from '../types.js';

interface ChartCardProps {
  title: string;
  plainSentence: string;
  badgeText?: string;
  badgeVariant?: 'green' | 'amber' | 'red' | 'blue' | 'neutral';
  provenance?: ProvenanceRecord;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function ChartCard({
  title,
  plainSentence,
  badgeText,
  badgeVariant = 'neutral',
  provenance,
  headerRight,
  children,
}: ChartCardProps) {
  const [open, setOpen] = useState(false);

  const badgeClass =
    badgeVariant === 'green'
      ? 'badge badge-green'
      : badgeVariant === 'amber'
        ? 'badge badge-amber'
        : badgeVariant === 'red'
          ? 'badge badge-red'
          : badgeVariant === 'blue'
            ? 'badge badge-blue'
            : 'badge';

  return (
    <section className="card">
      <div className="card-header">
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="card-title">{title}</h2>
            {badgeText && <span className={badgeClass}>{badgeText}</span>}
          </div>
          <p className="card-sentence">{plainSentence}</p>
        </div>
        {headerRight}
      </div>

      <div>{children}</div>

      {provenance && (
        <div>
          <button
            type="button"
            className="provenance-toggle"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
          >
            <Database size={14} />
            Inspect Query &amp; Live Endpoints
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {open && (
            <div className="provenance-drawer" style={{ marginTop: '10px' }}>
              <div>
                <strong>BigQuery Reference:</strong>{' '}
                <code className="mono">{provenance.bigqueryFile}</code>
              </div>
              <div>
                <strong>Methodology:</strong> {provenance.methodology}
              </div>
              <div>
                <strong>Live Unauthenticated Sources Rebuilt By ETL:</strong>
                <div className="provenance-code" style={{ marginTop: '4px' }}>
                  {provenance.endpoints.join('\n')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
