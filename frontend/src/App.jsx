import { useState } from "react";
import { api } from "./api";
import TestList from "./components/TestList";
import UserGate from "./components/UserGate";
import TestTaking from "./components/TestTaking";
import ResultsView from "./components/ResultsView";

// Screens: "list" -> "gate" -> "taking" -> "results"
export default function App() {
  const [screen, setScreen] = useState("list");
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [testData, setTestData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleSelectTest(testId) {
    setSelectedTestId(testId);
    setError(null);
    setScreen("gate");
  }

  async function handleUserSubmit(name, state) {
    try {
      const user = await api.createUser(name, state);

      const test = await api.getTest(selectedTestId);
      setTestData(test);

      const attempt = await api.startAttempt(user.user_id, selectedTestId);
      setAttemptId(attempt.attempt_id);

      setScreen("taking");
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmitAnswers(answers) {
    try {
      const res = await api.submitAttempt(attemptId, answers);
      setResult(res);
      setScreen("results");
    } catch (e) {
      setError(e.message);
    }
  }

  function handleBackToTests() {
    setScreen("list");
    setSelectedTestId(null);
    setTestData(null);
    setAttemptId(null);
    setResult(null);
    setError(null);
  }

  return (
    <div>
      {error && (
        <div style={errorBannerStyle}>
          Something went wrong: {error}
          <button onClick={() => setError(null)} style={dismissStyle}>
            dismiss
          </button>
        </div>
      )}

      {screen === "list" && <TestList onSelectTest={handleSelectTest} />}

      {screen === "gate" && (
        <UserGate
          testName={`Test #${selectedTestId}`}
          onSubmit={handleUserSubmit}
          onBack={handleBackToTests}
        />
      )}

      {screen === "taking" && testData && (
        <TestTaking test={testData} onSubmit={handleSubmitAnswers} />
      )}

      {screen === "results" && result && (
        <ResultsView result={result} onBackToTests={handleBackToTests} />
      )}
    </div>
  );
}

const errorBannerStyle = {
  background: "var(--wrong-soft)",
  color: "var(--wrong)",
  padding: "12px 24px",
  fontSize: 14,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const dismissStyle = {
  background: "none",
  border: "none",
  color: "var(--wrong)",
  textDecoration: "underline",
  fontSize: 13,
};
