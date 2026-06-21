import { useState } from "react";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export default function ResultsView({ result, onBackToTests }) {
  const [filter, setFilter] = useState("all"); // all | correct | wrong | unattempted

  const filteredQuestions = result.questions.filter((q) => {
    if (filter === "correct") return q.is_correct === 1;
    if (filter === "wrong") return q.is_correct === 0;
    if (filter === "unattempted") return q.selected_option === null;
    return true;
  });

  const sections = Object.entries(result.section_scores);

  return (
    <div style={styles.page}>
      <div style={styles.scoreCard}>
        <div style={styles.eyebrow}>Result</div>
        <div style={styles.scoreRow}>
          <div style={styles.scoreBig}>{result.total_score}</div>
          <div style={styles.scoreLabel}>
            marks<br />
            <span style={styles.scoreSub}>
              {result.total_correct} correct &middot; {result.total_wrong} wrong &middot;{" "}
              {result.total_unattempted} unattempted
            </span>
          </div>
        </div>

        <div style={styles.sectionGrid}>
          {sections.map(([section, s]) => (
            <div key={section} style={styles.sectionStat}>
              <div style={styles.sectionStatName}>{section}</div>
              <div style={styles.sectionStatNumbers}>
                <span style={{ color: "var(--correct)" }}>{s.correct}✓</span>{" "}
                <span style={{ color: "var(--wrong)" }}>{s.wrong}✗</span>{" "}
                <span style={{ color: "var(--muted)" }}>{s.unattempted}&minus;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.reviewHeader}>
        <h2 style={styles.reviewTitle}>Review Answers</h2>
        <div style={styles.filterRow}>
          {["all", "correct", "wrong", "unattempted"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.questionList}>
        {filteredQuestions.map((q) => (
          <QuestionReview key={q.question_id} q={q} />
        ))}
      </div>

      <button style={styles.backBtn} onClick={onBackToTests}>
        &larr; Back to all tests
      </button>
    </div>
  );
}

function QuestionReview({ q }) {
  const status =
    q.selected_option === null
      ? "unattempted"
      : q.is_correct
      ? "correct"
      : "wrong";

  return (
    <div style={styles.qCard}>
      <div style={styles.qCardTop}>
        <span style={styles.qCardNumber}>Q{q.question_number}</span>
        <span style={{ ...styles.statusTag, ...statusStyles[status] }}>
          {status}
        </span>
      </div>
      <p style={styles.qCardText}>{q.question_text}</p>

      <div style={styles.qOptions}>
        {q.options.map((opt, i) => {
          const optionNumber = i + 1;
          const isCorrectOpt = optionNumber === q.correct_option;
          const isSelectedOpt = optionNumber === q.selected_option;

          let optStyle = styles.qOption;
          if (isCorrectOpt) optStyle = { ...optStyle, ...styles.qOptionCorrect };
          if (isSelectedOpt && !isCorrectOpt)
            optStyle = { ...optStyle, ...styles.qOptionWrong };

          return (
            <div key={i} style={optStyle}>
              <span style={styles.qOptionLetter}>{OPTION_LETTERS[i]}</span>
              <span>{opt}</span>
              {isCorrectOpt && <span style={styles.tagSmall}>correct</span>}
              {isSelectedOpt && !isCorrectOpt && (
                <span style={styles.tagSmall}>your answer</span>
              )}
            </div>
          );
        })}
      </div>

      {q.explanation && (
        <div style={styles.explanation}>
          <span style={styles.explanationLabel}>Explanation</span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

const statusStyles = {
  correct: { background: "var(--correct-soft)", color: "var(--correct)" },
  wrong: { background: "var(--wrong-soft)", color: "var(--wrong)" },
  unattempted: { background: "var(--line)", color: "var(--muted)" },
};

const styles = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "56px 24px 80px",
  },
  scoreCard: {
    background: "var(--ink)",
    color: "var(--paper)",
    borderRadius: 6,
    padding: "32px 32px",
    marginBottom: 40,
  },
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--accent-soft)",
    marginBottom: 16,
  },
  scoreRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 16,
    marginBottom: 28,
  },
  scoreBig: {
    fontFamily: "var(--font-mono)",
    fontSize: 56,
    fontWeight: 700,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#C9C5B8",
    lineHeight: 1.6,
  },
  scoreSub: {
    fontSize: 13,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: 12,
    borderTop: "1px solid rgba(255,255,255,0.15)",
    paddingTop: 20,
  },
  sectionStat: {
    fontSize: 13,
  },
  sectionStatName: {
    color: "#C9C5B8",
    marginBottom: 4,
  },
  sectionStatNumbers: {
    fontFamily: "var(--font-mono)",
    fontWeight: 600,
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  reviewTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 24,
    margin: 0,
  },
  filterRow: {
    display: "flex",
    gap: 6,
  },
  filterBtn: {
    background: "var(--paper-raised)",
    border: "1px solid var(--line)",
    borderRadius: 3,
    padding: "6px 14px",
    fontSize: 13,
    color: "var(--muted)",
    textTransform: "capitalize",
  },
  filterBtnActive: {
    background: "var(--ink)",
    color: "var(--paper)",
    borderColor: "var(--ink)",
  },
  questionList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 40,
  },
  qCard: {
    background: "var(--paper-raised)",
    border: "1px solid var(--line)",
    borderRadius: 4,
    padding: "20px 24px",
  },
  qCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  qCardNumber: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
  },
  statusTag: {
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    padding: "3px 9px",
    borderRadius: 12,
  },
  qCardText: {
    fontFamily: "var(--font-display)",
    fontSize: 16.5,
    lineHeight: 1.5,
    margin: "0 0 16px",
  },
  qOptions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 14,
  },
  qOption: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    padding: "9px 12px",
    border: "1px solid var(--line)",
    borderRadius: 3,
  },
  qOptionCorrect: {
    background: "var(--correct-soft)",
    borderColor: "var(--correct)",
  },
  qOptionWrong: {
    background: "var(--wrong-soft)",
    borderColor: "var(--wrong)",
  },
  qOptionLetter: {
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 12,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "1px solid currentColor",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tagSmall: {
    marginLeft: "auto",
    fontSize: 10.5,
    fontWeight: 700,
    textTransform: "uppercase",
    opacity: 0.7,
  },
  explanation: {
    fontSize: 13.5,
    color: "var(--muted)",
    lineHeight: 1.6,
    borderTop: "1px solid var(--line)",
    paddingTop: 12,
  },
  explanationLabel: {
    display: "block",
    fontWeight: 700,
    color: "var(--ink)",
    marginBottom: 4,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  backBtn: {
    background: "none",
    border: "1px solid var(--line)",
    borderRadius: 3,
    padding: "12px 20px",
    fontSize: 14,
    color: "var(--ink)",
  },
};
