import { useState, useEffect, useRef, useCallback } from "react";

const OPTION_LETTERS = ["A", "B", "C", "D"];
const TEST_DURATION_SECONDS = 15 * 60; // 15 minutes

export default function TestTaking({ test, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // question_id -> selected_option (exactly one value, never an array)
  const [secondsLeft, setSecondsLeft] = useState(TEST_DURATION_SECONDS);
  const submittedRef = useRef(false);

  const questions = test.questions;
  const current = questions[currentIndex];

  const handleSubmit = useCallback(() => {
    if (submittedRef.current) return; // guard against double-submit (timer + manual click)
    submittedRef.current = true;
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_option: answers[q.id] ?? null,
    }));
    onSubmit(payload);
  }, [questions, answers, onSubmit]);

  // Countdown timer - ticks once per second, auto-submits at zero
  useEffect(() => {
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft, handleSubmit]);

  function selectOption(optionIndex) {
    // Replaces whatever was selected before for this question -- a plain
    // object value (not an array/set), so only one option can ever be
    // recorded per question by construction.
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  }

  function clearAnswer() {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[current.id];
      return next;
    });
  }

  function goTo(index) {
    setCurrentIndex(Math.max(0, Math.min(questions.length - 1, index)));
  }

  const attemptedCount = Object.keys(answers).length;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isLowTime = secondsLeft <= 60;

  return (
    <div style={styles.shell}>
      {/* OMR-style answer rail */}
      <aside style={styles.rail}>
        <div style={{ ...styles.timer, ...(isLowTime ? styles.timerLow : {}) }}>
          <span style={styles.timerLabel}>Time Left</span>
          <span style={styles.timerValue}>{timeStr}</span>
        </div>

        <div style={styles.railHeader}>
          <span style={styles.railHeaderLabel}>Answer Sheet</span>
          <span style={styles.railHeaderCount}>
            {attemptedCount}/{questions.length}
          </span>
        </div>

        <div style={styles.railGrid}>
          {questions.map((q, i) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                style={{
                  ...styles.railCell,
                  ...(isAnswered ? styles.railCellAnswered : {}),
                  ...(isCurrent ? styles.railCellCurrent : {}),
                }}
                title={`Question ${q.question_number}`}
              >
                {q.question_number}
              </button>
            );
          })}
        </div>

        <div style={styles.railLegend}>
          <span><i style={{ ...styles.legendDot, background: "var(--correct-soft)", borderColor: "var(--correct)" }} /> Answered</span>
          <span><i style={{ ...styles.legendDot, borderColor: "var(--line)" }} /> Unanswered</span>
        </div>

        <button style={styles.submitBtn} onClick={handleSubmit}>
          Submit Test
        </button>
      </aside>

      {/* Main question area */}
      <main style={styles.main}>
        <div style={styles.sectionTag}>{current.section}</div>

        <div style={styles.questionBlock}>
          <div style={styles.qNumber}>Q{current.question_number}</div>
          <p style={styles.qText}>{current.question_text}</p>

          <div style={styles.options} role="radiogroup">
            {current.options.map((opt, i) => {
              const optionNumber = i + 1;
              const isSelected = answers[current.id] === optionNumber;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => selectOption(optionNumber)}
                  style={{
                    ...styles.option,
                    ...(isSelected ? styles.optionSelected : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.optionLetter,
                      ...(isSelected ? styles.optionLetterSelected : {}),
                    }}
                  >
                    {isSelected ? "\u2713" : OPTION_LETTERS[i]}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>

          <button style={styles.clearBtn} onClick={clearAnswer}>
            Clear response
          </button>
        </div>

        <div style={styles.navRow}>
          <button
            style={styles.navBtn}
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            &larr; Previous
          </button>
          <button
            style={{ ...styles.navBtn, ...styles.navBtnPrimary }}
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === questions.length - 1}
          >
            Next &rarr;
          </button>
        </div>
      </main>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
  },
  rail: {
    width: 320,
    flexShrink: 0,
    background: "var(--paper-raised)",
    borderRight: "1px solid var(--line)",
    padding: "20px 20px 24px",
    display: "flex",
    flexDirection: "column",
    position: "sticky",
    top: 0,
    height: "100vh",
  },
  timer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--ink)",
    color: "var(--paper)",
    borderRadius: 4,
    padding: "12px 16px",
    marginBottom: 20,
  },
  timerLow: {
    background: "var(--wrong)",
  },
  timerLabel: {
    fontSize: 12,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    opacity: 0.75,
  },
  timerValue: {
    fontFamily: "var(--font-mono)",
    fontSize: 22,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  },
  railHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 14,
  },
  railHeaderLabel: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 600,
  },
  railHeaderCount: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
  },
  railGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 8,
    overflowY: "auto",
    flex: 1,
    paddingRight: 4,
    alignContent: "start",
  },
  railCell: {
    fontFamily: "var(--font-mono)",
    fontSize: 14,
    fontWeight: 700,
    aspectRatio: "1",
    minHeight: 36,
    border: "1.5px solid var(--line)",
    borderRadius: 4,
    background: "var(--paper)",
    color: "var(--muted)",
  },
  railCellAnswered: {
    background: "var(--correct-soft)",
    borderColor: "var(--correct)",
    color: "var(--correct)",
  },
  railCellCurrent: {
    borderColor: "var(--ink)",
    borderWidth: 2.5,
    color: "var(--ink)",
    boxShadow: "0 0 0 2px var(--paper-raised), 0 0 0 3.5px var(--ink)",
  },
  railLegend: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 11.5,
    color: "var(--muted)",
    marginTop: 14,
    marginBottom: 14,
  },
  legendDot: {
    display: "inline-block",
    width: 9,
    height: 9,
    borderRadius: 2,
    border: "1.5px solid var(--line)",
    marginRight: 6,
    verticalAlign: "middle",
  },
  submitBtn: {
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: 3,
    padding: "13px",
    fontSize: 14.5,
    fontWeight: 700,
  },
  main: {
    flex: 1,
    padding: "48px 56px",
    maxWidth: 720,
  },
  sectionTag: {
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--accent)",
    marginBottom: 24,
  },
  questionBlock: {
    marginBottom: 32,
  },
  qNumber: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--muted)",
    marginBottom: 8,
  },
  qText: {
    fontFamily: "var(--font-display)",
    fontSize: 19,
    lineHeight: 1.5,
    color: "var(--ink)",
    margin: "0 0 28px",
  },
  options: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 16,
  },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    textAlign: "left",
    padding: "14px 16px",
    border: "1.5px solid var(--line)",
    borderRadius: 4,
    background: "var(--paper-raised)",
    fontSize: 15,
    color: "var(--ink)",
  },
  optionSelected: {
    borderColor: "var(--ink)",
    borderWidth: 2,
    background: "var(--accent-soft)",
  },
  optionLetter: {
    fontFamily: "var(--font-mono)",
    fontWeight: 700,
    fontSize: 13,
    width: 22,
    height: 22,
    borderRadius: "50%",
    border: "1.5px solid var(--line)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionLetterSelected: {
    background: "var(--ink)",
    borderColor: "var(--ink)",
    color: "var(--paper)",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "var(--muted)",
    fontSize: 13.5,
    padding: 0,
    textDecoration: "underline",
  },
  navRow: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid var(--line)",
    paddingTop: 24,
  },
  navBtn: {
    background: "var(--paper-raised)",
    border: "1px solid var(--line)",
    borderRadius: 3,
    padding: "11px 20px",
    fontSize: 14.5,
    fontWeight: 600,
    color: "var(--ink)",
  },
  navBtnPrimary: {
    background: "var(--ink)",
    color: "var(--paper)",
    borderColor: "var(--ink)",
  },
};
