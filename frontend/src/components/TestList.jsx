import { useEffect, useState } from "react";
import { api } from "../api";

export default function TestList({ onSelectTest }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listTests()
      .then(setTests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.eyebrow}>SSC CGL &middot; Practice Series</div>
        <h1 style={styles.title}>Mock Test Hall</h1>
        <p style={styles.subtitle}>
          Full-length papers built from past exam patterns. Pick a test,
          attempt it under timed conditions, and get a section-wise
          breakdown the moment you submit.
        </p>
      </header>

      {loading && <p style={styles.muted}>Loading tests&hellip;</p>}
      {error && <p style={styles.errorText}>Could not load tests: {error}</p>}

      <div style={styles.list}>
        {tests.map((t) => (
          <button
            key={t.id}
            style={styles.card}
            onClick={() => onSelectTest(t.id)}
          >
            <div style={styles.cardTop}>
              <span style={styles.cardNumber}>
                {String(t.id).padStart(2, "0")}
              </span>
              <span style={styles.cardQCount}>{t.question_count} Qs</span>
            </div>
            <div style={styles.cardName}>{t.name}</div>
            <div style={styles.cardCta}>Start test &rarr;</div>
          </button>
        ))}
      </div>

      {!loading && tests.length === 0 && !error && (
        <p style={styles.muted}>
          No tests available yet. Load a generated paper into the database
          to see it here.
        </p>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "64px 24px 80px",
  },
  header: {
    marginBottom: 48,
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "var(--accent)",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 40,
    fontWeight: 600,
    margin: "0 0 12px",
    color: "var(--ink)",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 1.6,
    color: "var(--muted)",
    maxWidth: 540,
    margin: 0,
  },
  muted: {
    color: "var(--muted)",
    fontSize: 15,
  },
  errorText: {
    color: "var(--wrong)",
    fontSize: 15,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "left",
    background: "var(--paper-raised)",
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "20px 24px",
    transition: "border-color 0.15s, transform 0.15s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 8,
  },
  cardNumber: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
  },
  cardQCount: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
  },
  cardName: {
    fontFamily: "var(--font-display)",
    fontSize: 20,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 10,
  },
  cardCta: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--accent)",
  },
};
