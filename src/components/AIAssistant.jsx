import React, { useState } from "react";
import api from "../api";

export default function AIAssistant({ onUseTask, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate(e) {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data } = await api.post("/ai/task", { prompt });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate the task.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="ai-card" onMouseDown={e => e.stopPropagation()}>
        <div className="ai-head">
          <div>
            <span className="ai-kicker">AI ASSISTANT</span>
            <h2>✨ Turn an idea into a task</h2>
            <p>Describe your goal and TaskFlow AI will structure it for you.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={generate}>
          <textarea
            className="ai-input"
            rows="4"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Example: Build JWT authentication for my MERN app..."
          />
          <button className="primary ai-generate" disabled={loading || !prompt.trim()}>
            {loading ? "✨ Thinking..." : "✨ Generate task"}
          </button>
        </form>

        {error && <div className="error ai-error">{error}</div>}

        {result && (
          <div className="ai-result">
            <div className="ai-result-top">
              <div>
                <span className={`badge ${result.priority.toLowerCase()}`}>{result.priority}</span>
                <h3>{result.title}</h3>
              </div>
              <span className="ai-hours">⏱ {result.estimatedHours}h</span>
            </div>

            <p className="ai-description">{result.description}</p>

            <div className="ai-subtasks">
              <strong>Suggested subtasks</strong>
              {result.subtasks.map((item, index) => (
                <div className="ai-subtask" key={index}>
                  <span>{index + 1}</span>{item}
                </div>
              ))}
            </div>

            <button
              className="primary full"
              onClick={() => onUseTask({
                title: result.title,
                description: result.description,
                priority: result.priority,
                status: "Pending",
                dueDate: ""
              })}
            >
              + Use as new task
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
