"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formsApi, responsesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import type { Form, ResponseList, FormResponse, ResponseDetail, FormSummary, QuestionSummary } from "@/types";
import { formatFullDate, cn } from "@/lib/utils";
import { QUESTION_TYPE_LABELS } from "@/types";

type Tab = "summary" | "responses";

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [tab, setTab] = useState<Tab>("summary");
  const [responses, setResponses] = useState<ResponseList | null>(null);
  const [summary, setSummary] = useState<FormSummary | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ResponseDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [formData, respData, sumData] = await Promise.all([
        formsApi.get(formId),
        responsesApi.list(formId),
        responsesApi.summary(formId),
      ]);
      setForm(formData);
      setResponses(respData);
      setSummary(sumData);
    } catch {
      addToast("error", "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [formId, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const viewResponse = async (responseId: string) => {
    try {
      const detail = await responsesApi.get(formId, responseId);
      setSelectedResponse(detail);
      setShowDetailModal(true);
    } catch {
      addToast("error", "Failed to load response");
    }
  };

  const deleteResponse = async (responseId: string) => {
    try {
      await responsesApi.delete(formId, responseId);
      addToast("success", "Response deleted");
      loadData();
      setShowDetailModal(false);
    } catch {
      addToast("error", "Failed to delete response");
    }
  };

  const handleExport = () => {
    window.open(responsesApi.exportUrl(formId), "_blank");
    addToast("success", "Downloading CSV...");
  };

  if (loading) {
    return (
      <div className="results-layout" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="editor-empty">
          <div className="icon" style={{ animation: "pulse 1.5s infinite" }}>📊</div>
          <h3>Loading results...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="results-layout">
      {/* Header */}
      <div className="results-header">
        <div className="results-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/forms/${formId}/edit`)}>← Builder</button>
          <h1>{form?.title || "Results"}</h1>
          <span className={`badge ${form?.status === "published" ? "badge-published" : "badge-draft"}`}>
            {form?.status === "published" ? "● Live" : "Draft"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <div className="results-tabs">
            <button className={cn("results-tab", tab === "summary" && "active")} onClick={() => setTab("summary")}>Summary</button>
            <button className={cn("results-tab", tab === "responses" && "active")} onClick={() => setTab("responses")}>Responses</button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>📥 Export CSV</button>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/")}>🏠 Dashboard</button>
        </div>
      </div>

      {/* Content */}
      <div className="results-content">
        {/* Stats Row */}
        <div className="results-stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Responses</div>
            <div className="stat-value">{summary?.total_responses || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Questions</div>
            <div className="stat-value">{form?.questions.length || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Status</div>
            <div className="stat-value" style={{ fontSize: "var(--font-size-xl)" }}>
              {form?.status === "published" ? "🟢 Live" : "⚪ Draft"}
            </div>
          </div>
        </div>

        {/* Summary Tab */}
        {tab === "summary" && summary && (
          <div>
            {summary.total_responses === 0 ? (
              <div className="editor-empty" style={{ marginTop: "40px" }}>
                <div className="icon">📭</div>
                <h3>No responses yet</h3>
                <p>Share your form to start collecting responses.</p>
              </div>
            ) : (
              summary.questions.map((qs) => (
                <SummaryCard key={qs.question_id} question={qs} totalResponses={summary.total_responses} />
              ))
            )}
          </div>
        )}

        {/* Responses Tab */}
        {tab === "responses" && responses && (
          <div>
            {responses.total === 0 ? (
              <div className="editor-empty" style={{ marginTop: "40px" }}>
                <div className="icon">📭</div>
                <h3>No responses yet</h3>
                <p>Share your form to start collecting responses.</p>
              </div>
            ) : (
              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Submitted</th>
                      {form?.questions.map((q) => (
                        <th key={q.id} title={q.title}>{q.title ? q.title.substring(0, 25) + (q.title.length > 25 ? "..." : "") : "—"}</th>
                      ))}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.responses.map((resp, i) => {
                      const answerMap: Record<string, string> = {};
                      resp.answers.forEach((a) => { answerMap[a.question_id] = a.value || ""; });
                      return (
                        <tr key={resp.id}>
                          <td style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{i + 1}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{formatFullDate(resp.submitted_at)}</td>
                          {form?.questions.map((q) => (
                            <td key={q.id}>{answerMap[q.id] || "—"}</td>
                          ))}
                          <td>
                            <div style={{ display: "flex", gap: "var(--space-2)" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => viewResponse(resp.id)}>👁️</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => deleteResponse(resp.id)} style={{ color: "var(--color-error)" }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Response Detail"
        maxWidth="600px"
        footer={
          <div style={{ display: "flex", gap: "var(--space-3)", width: "100%", justifyContent: "space-between" }}>
            <button className="btn btn-danger btn-sm" onClick={() => selectedResponse && deleteResponse(selectedResponse.id)}>Delete Response</button>
            <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
          </div>
        }
      >
        {selectedResponse && (
          <div className="response-detail">
            <p className="text-xs text-secondary mb-4">
              Submitted: {formatFullDate(selectedResponse.submitted_at)}
            </p>
            {selectedResponse.answers.map((a) => (
              <div key={a.id} className="response-detail-item">
                <div className="response-detail-question">{a.question_title}</div>
                <div className="response-detail-answer">{a.value || "—"}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── Summary Card Component ───────────────────────────────── */
function SummaryCard({ question, totalResponses }: { question: QuestionSummary; totalResponses: number }) {
  const { summary } = question;

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div>
          <div className="summary-card-title">{question.question_title || "Untitled"}</div>
          <div className="text-xs text-secondary mt-2">{question.total_answers} of {totalResponses} answered</div>
        </div>
        <span className="summary-card-type">{QUESTION_TYPE_LABELS[question.question_type as keyof typeof QUESTION_TYPE_LABELS] || question.question_type}</span>
      </div>

      {summary.empty ? (
        <p className="text-secondary text-sm">No answers yet</p>
      ) : summary.counts ? (
        /* Choice / Yes-No / Dropdown */
        <div>
          {Object.entries(summary.counts).map(([label, count]) => {
            const pct = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
            return (
              <div key={label} className="summary-bar">
                <span className="summary-bar-label">{label}</span>
                <div className="summary-bar-track">
                  <div className="summary-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="summary-bar-count">{count} ({Math.round(pct)}%)</span>
              </div>
            );
          })}
        </div>
      ) : summary.average !== undefined ? (
        /* Number / Rating */
        <div>
          <div className="summary-stat-inline">
            <span className="summary-stat-value">{summary.average}</span>
            <span className="summary-stat-label">average</span>
          </div>
          {summary.min !== undefined && (
            <div className="text-sm text-secondary mt-2">
              Min: {summary.min} · Max: {summary.max}
              {summary.sum !== undefined && ` · Sum: ${summary.sum}`}
            </div>
          )}
          {summary.distribution && (
            <div style={{ marginTop: "var(--space-4)" }}>
              {Object.entries(summary.distribution).sort(([a], [b]) => Number(a) - Number(b)).map(([label, count]) => {
                const pct = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
                return (
                  <div key={label} className="summary-bar">
                    <span className="summary-bar-label">{"★".repeat(Number(label))}</span>
                    <div className="summary-bar-track">
                      <div className="summary-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="summary-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Text answers */
        <div>
          <div className="summary-stat-inline mb-4">
            <span className="summary-stat-value">{summary.total}</span>
            <span className="summary-stat-label">answers (avg. {summary.avg_length} chars)</span>
          </div>
          {summary.sample_answers && summary.sample_answers.length > 0 && (
            <div>
              <p className="text-xs text-secondary mb-2">Sample answers:</p>
              {summary.sample_answers.map((ans, i) => (
                <div key={i} style={{
                  padding: "var(--space-3)",
                  background: "var(--color-bg-secondary)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--font-size-sm)",
                }}>
                  &ldquo;{ans}&rdquo;
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
