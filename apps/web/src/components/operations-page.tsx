import Link from "next/link";

type Metric = { label: string; value: string; detail: string };
type Row = {
  id: string;
  primary: string;
  secondary: string;
  owner: string;
  status: string;
  href?: string;
};

type OperationsPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  action: string;
  actionHref?: string;
  secondaryAction?: string;
  secondaryActionHref?: string;
  metrics: Metric[];
  sectionTitle: string;
  columns: [string, string, string, string, string];
  rows: Row[];
  scannerHref?: string;
  emptyMessage?: string;
};

export function OperationsPage({
  eyebrow,
  title,
  description,
  action,
  actionHref,
  secondaryAction,
  secondaryActionHref,
  metrics,
  sectionTitle,
  columns,
  rows,
  scannerHref,
  emptyMessage = "No records found.",
}: OperationsPageProps) {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="subtitle">{description}</p>
        </div>
        <div className="header-actions">
          {secondaryAction && secondaryActionHref && (
            <Link className="button button-secondary" href={secondaryActionHref}>
              {secondaryAction}
            </Link>
          )}
          {scannerHref && (
            <Link className="button button-secondary" href={scannerHref}>
              Open scanner
            </Link>
          )}
          {actionHref ? (
            <Link className="button button-primary" href={actionHref}>
              + {action}
            </Link>
          ) : (
            <button className="button button-primary">+ {action}</button>
          )}
        </div>
      </header>

      <section className="metric-grid" aria-label={`${title} metrics`}>
        {metrics.map((metric, index) => (
          <article className="metric-card compact" key={metric.label}>
            <div
              className={`metric-icon ${["blue", "green", "amber", "violet"][index]}`}
              aria-hidden="true"
            />
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.detail}</span>
          </article>
        ))}
      </section>

      <section className="panel list-panel">
        <div className="panel-heading">
          <div>
            <h2>{sectionTitle}</h2>
            <p>Updated just now · Seoul Fulfillment Center</p>
          </div>
          <div className="list-tools">
            <label className="search-field">
              <span>⌕</span>
              <input aria-label={`Search ${title}`} placeholder="Search" />
            </label>
            <button className="button button-secondary small">Filter</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const content = [
                  <strong key="id">{row.id}</strong>,
                  row.primary,
                  row.secondary,
                  row.owner,
                  <span
                    className={`status ${row.status.toLowerCase().replaceAll(" ", "-")}`}
                    key="status"
                  >
                    {row.status}
                  </span>,
                ];
                return (
                <tr className={row.href ? "clickable-row" : undefined} key={row.id}>
                  {content.map((cell, index) => (
                    <td key={index}>
                      {row.href ? (
                        <Link
                          aria-label={index === 0 ? `View ${row.id}` : undefined}
                          href={row.href}
                        >
                          {cell}
                        </Link>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
                );
              })}
              {rows.length === 0 && (
                <tr className="empty-table-row">
                  <td colSpan={5}>{emptyMessage}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {rows.length} records</span>
          <div>
            <button disabled>←</button>
            <b>1</b>
            <button disabled>→</button>
          </div>
        </div>
      </section>
    </div>
  );
}
