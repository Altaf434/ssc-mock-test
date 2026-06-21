import { useState } from "react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Delhi (NCT)", "Jammu & Kashmir", "Ladakh", "Other",
];

export default function UserGate({ testName, onSubmit, onBack }) {
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [touched, setTouched] = useState(false);

  const canSubmit = name.trim().length > 0 && state.trim().length > 0;

  function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit(name.trim(), state);
  }

  return (
    <div style={styles.page}>
      <button style={styles.backLink} onClick={onBack}>
        &larr; All tests
      </button>

      <div style={styles.card}>
        <div style={styles.eyebrow}>Before you begin</div>
        <h2 style={styles.title}>{testName}</h2>
        <p style={styles.subtitle}>
          Just your name and state &mdash; this helps us track attempts.
          No account, no password.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Name
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Altaf Hussain"
              autoFocus
            />
          </label>

          {touched && !name.trim() && (
            <span style={styles.errorText}>Name is required</span>
          )}

          <label style={styles.label}>
            State
            <select
              style={styles.input}
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select your state</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {touched && !state.trim() && (
            <span style={styles.errorText}>State is required</span>
          )}

          <button type="submit" style={styles.startBtn}>
            Start test &rarr;
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "64px 24px",
  },
  backLink: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: 14,
    padding: 0,
    marginBottom: 32,
  },
  card: {
    background: "var(--paper-raised)",
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "32px 28px",
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "var(--accent)",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 26,
    fontWeight: 600,
    margin: "0 0 10px",
  },
  subtitle: {
    fontSize: 14.5,
    color: "var(--muted)",
    lineHeight: 1.5,
    margin: "0 0 28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13.5,
    fontWeight: 600,
    color: "var(--ink)",
    marginBottom: 14,
  },
  input: {
    fontFamily: "var(--font-body)",
    fontSize: 15,
    padding: "10px 12px",
    border: "1px solid var(--line)",
    borderRadius: 3,
    background: "var(--paper)",
    color: "var(--ink)",
  },
  errorText: {
    color: "var(--wrong)",
    fontSize: 12.5,
    marginTop: -10,
    marginBottom: 10,
  },
  startBtn: {
    marginTop: 12,
    background: "var(--ink)",
    color: "var(--paper)",
    border: "none",
    borderRadius: 3,
    padding: "13px 20px",
    fontSize: 15,
    fontWeight: 600,
  },
};
