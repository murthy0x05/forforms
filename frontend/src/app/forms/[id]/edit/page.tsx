"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { formsApi, questionsApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import type { Form, Question, QuestionType, QuestionProperties } from "@/types";
import { QUESTION_TYPE_LABELS, QUESTION_TYPE_ICONS } from "@/types";
import { cn, copyToClipboard } from "@/lib/utils";

const QUESTION_TYPES: QuestionType[] = [
  "short_text", "long_text", "multiple_choice", "dropdown",
  "email", "number", "yes_no", "rating",
];

export default function FormBuilder() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dragItem, setDragItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedQuestion = form?.questions.find((q) => q.id === selectedQuestionId) || null;

  const loadForm = useCallback(async () => {
    try {
      const data = await formsApi.get(formId);
      setForm(data);
      if (data.questions.length > 0 && !selectedQuestionId) {
        setSelectedQuestionId(data.questions[0].id);
      }
    } catch {
      addToast("error", "Failed to load form");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [formId, addToast, router, selectedQuestionId]);

  useEffect(() => { loadForm(); }, [formId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save form title
  const saveTitle = useCallback(async (title: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await formsApi.update(formId, { title });
      } catch { /* silent */ }
    }, 800);
  }, [formId]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setForm((prev) => prev ? { ...prev, title } : null);
    saveTitle(title);
  };

  // Question CRUD
  const addQuestion = async (type: QuestionType) => {
    try {
      const q = await questionsApi.add(formId, {
        type,
        title: "",
        is_required: false,
      });
      await loadForm();
      setSelectedQuestionId(q.id);
      setShowTypeSelector(false);
      addToast("success", `${QUESTION_TYPE_LABELS[type]} question added`);
    } catch {
      addToast("error", "Failed to add question");
    }
  };

  const updateQuestion = useCallback(async (questionId: string, updates: Partial<Question>) => {
    // Optimistic update
    setForm((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      };
    });

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await questionsApi.update(formId, questionId, updates);
      } catch {
        addToast("error", "Failed to save question");
      }
    }, 600);
  }, [formId, addToast]);

  const deleteQuestion = async (questionId: string) => {
    try {
      await questionsApi.delete(formId, questionId);
      if (selectedQuestionId === questionId) {
        const remaining = form?.questions.filter((q) => q.id !== questionId) || [];
        setSelectedQuestionId(remaining.length > 0 ? remaining[0].id : null);
      }
      await loadForm();
      addToast("success", "Question deleted");
    } catch {
      addToast("error", "Failed to delete question");
    }
  };

  // Drag and Drop
  const handleDragStart = (index: number) => setDragItem(index);
  const handleDragEnter = (index: number) => setDragOverItem(index);
  const handleDragEnd = async () => {
    if (dragItem === null || dragOverItem === null || dragItem === dragOverItem || !form) {
      setDragItem(null);
      setDragOverItem(null);
      return;
    }

    const reordered = [...form.questions];
    const [removed] = reordered.splice(dragItem, 1);
    reordered.splice(dragOverItem, 0, removed);

    const updatedQuestions = reordered.map((q, i) => ({ ...q, order_index: i }));
    setForm({ ...form, questions: updatedQuestions });
    setDragItem(null);
    setDragOverItem(null);

    try {
      await questionsApi.reorder(formId, updatedQuestions.map((q, i) => ({ id: q.id, order_index: i })));
    } catch {
      addToast("error", "Failed to reorder");
      loadForm();
    }
  };

  // Publish / Unpublish
  const handlePublish = async () => {
    try {
      const result = await formsApi.publish(formId);
      setForm((prev) => prev ? { ...prev, status: "published", share_id: result.share_id } : null);
      const fullUrl = `${window.location.origin}/f/${result.share_id}`;
      await copyToClipboard(fullUrl);
      addToast("success", "Form published! Link copied to clipboard.");
    } catch (err: unknown) {
      addToast("error", err instanceof Error ? err.message : "Failed to publish");
    }
  };

  const handleUnpublish = async () => {
    try {
      await formsApi.unpublish(formId);
      setForm((prev) => prev ? { ...prev, status: "draft" } : null);
      addToast("info", "Form unpublished");
    } catch {
      addToast("error", "Failed to unpublish");
    }
  };

  if (loading || !form) {
    return (
      <div className="builder-layout">
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="editor-empty">
            <div className="icon" style={{ animation: "pulse 1.5s infinite" }}>🔧</div>
            <h3>Loading builder...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="builder-layout">
      {/* ─── Top Header ────────────────────────────────────── */}
      <header className="builder-header">
        <div className="builder-header-left">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push("/")}>← Back</button>
          <input
            ref={titleInputRef}
            className="builder-title-input"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Untitled Form"
          />
          <span className={`badge ${form.status === "published" ? "badge-published" : "badge-draft"}`}>
            {form.status === "published" ? "● Live" : "Draft"}
          </span>
        </div>
        <div className="builder-header-right">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)}>⚙️ Settings</button>
          {form.share_id && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => window.open(`/f/${form.share_id}`, "_blank")}
            >
              👁️ Preview
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => router.push(`/forms/${formId}/results`)}
          >
            📊 Results{form.response_count > 0 && ` (${form.response_count})`}
          </button>
          {form.status === "published" ? (
            <button className="btn btn-secondary btn-sm" onClick={handleUnpublish}>Unpublish</button>
          ) : (
            <button className="btn btn-primary" onClick={handlePublish}>Publish</button>
          )}
          {form.status === "published" && form.share_id && (
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                const url = `${window.location.origin}/f/${form.share_id}`;
                await copyToClipboard(url);
                addToast("success", "Link copied!");
              }}
            >
              🔗 Copy link
            </button>
          )}
        </div>
      </header>

      {/* ─── Builder Body ──────────────────────────────────── */}
      <div className="builder-body">
        {/* ─── Left Panel: Question List ───────────────────── */}
        <div className="builder-left">
          <div className="builder-left-header">
            <h3>Questions ({form.questions.length})</h3>
          </div>
          <div className="question-list">
            {form.questions.map((q, i) => (
              <div
                key={q.id}
                className={cn(
                  "question-list-item",
                  selectedQuestionId === q.id && "active",
                  dragItem === i && "dragging"
                )}
                onClick={() => setSelectedQuestionId(q.id)}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
              >
                <span className="drag-handle">⠿</span>
                <span className="q-number">{i + 1}</span>
                <span className="q-type-icon">{QUESTION_TYPE_ICONS[q.type]}</span>
                <span className="q-title">{q.title || "Untitled question"}</span>
                <button
                  className="q-delete"
                  onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                  title="Delete question"
                >✕</button>
              </div>
            ))}
          </div>
          <button className="add-question-btn" onClick={() => setShowTypeSelector(true)}>
            + Add question
          </button>
        </div>

        {/* ─── Center Panel: Question Editor ───────────────── */}
        <div className="builder-center">
          {selectedQuestion ? (
            <div className="editor-card">
              <div className="editor-question-number">
                Question {form.questions.findIndex((q) => q.id === selectedQuestion.id) + 1} of {form.questions.length}
                {selectedQuestion.is_required && <span style={{ color: "var(--color-error)", marginLeft: "8px" }}>Required</span>}
              </div>
              <textarea
                className="editor-question-title"
                value={selectedQuestion.title}
                onChange={(e) => updateQuestion(selectedQuestion.id, { title: e.target.value })}
                placeholder="Type your question here..."
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />
              <textarea
                className="editor-question-description"
                value={selectedQuestion.description || ""}
                onChange={(e) => updateQuestion(selectedQuestion.id, { description: e.target.value || null })}
                placeholder="Add a description (optional)"
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = target.scrollHeight + "px";
                }}
              />

              {/* Type-specific editor preview */}
              <div className="editor-preview-area">
                <div className="editor-preview-label">Answer Preview</div>
                <QuestionPreview question={selectedQuestion} />
              </div>
            </div>
          ) : (
            <div className="editor-empty">
              <div className="icon">📝</div>
              <h3>No question selected</h3>
              <p>Select a question from the left panel or add a new one to get started.</p>
              <button className="btn btn-primary mt-6" onClick={() => setShowTypeSelector(true)}>
                + Add your first question
              </button>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Question Settings ──────────────── */}
        <div className="builder-right">
          {selectedQuestion ? (
            <>
              <div className="builder-right-header">
                <h3>Question Settings</h3>
              </div>

              {/* Question Type */}
              <div className="settings-section">
                <label className="settings-label">Question Type</label>
                <select
                  className="input"
                  value={selectedQuestion.type}
                  onChange={(e) => updateQuestion(selectedQuestion.id, {
                    type: e.target.value as QuestionType,
                    properties: getDefaultProperties(e.target.value as QuestionType),
                  })}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_ICONS[t]} {QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Required Toggle */}
              <div className="settings-section">
                <div
                  className={cn("toggle", selectedQuestion.is_required && "active")}
                  onClick={() => updateQuestion(selectedQuestion.id, { is_required: !selectedQuestion.is_required })}
                >
                  <span className="settings-label" style={{ margin: 0 }}>Required</span>
                  <div className="toggle-switch" />
                </div>
              </div>

              {/* Type-specific Settings */}
              <TypeSpecificSettings
                question={selectedQuestion}
                onUpdate={(updates) => updateQuestion(selectedQuestion.id, updates)}
              />
            </>
          ) : (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-tertiary)" }}>
              <p>Select a question to edit its settings</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Type Selector Modal ───────────────────────────── */}
      <Modal
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        title="Add question"
        maxWidth="520px"
      >
        <div className="type-selector-grid">
          {QUESTION_TYPES.map((type) => (
            <button
              key={type}
              className="type-selector-item"
              onClick={() => addQuestion(type)}
            >
              <span className="type-icon">{QUESTION_TYPE_ICONS[type]}</span>
              <span>{QUESTION_TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </Modal>

      {/* ─── Form Settings Modal ───────────────────────────── */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Form Settings"
        maxWidth="560px"
        footer={<button className="btn btn-primary" onClick={() => setShowSettings(false)}>Done</button>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <label className="settings-label">Welcome Screen Title</label>
            <input
              className="input"
              value={form.welcome_screen_title || ""}
              onChange={(e) => {
                setForm((p) => p ? { ...p, welcome_screen_title: e.target.value } : null);
                formsApi.update(formId, { welcome_screen_title: e.target.value });
              }}
              placeholder="Welcome!"
            />
          </div>
          <div>
            <label className="settings-label">Welcome Screen Description</label>
            <textarea
              className="textarea"
              value={form.welcome_screen_description || ""}
              onChange={(e) => {
                setForm((p) => p ? { ...p, welcome_screen_description: e.target.value } : null);
                formsApi.update(formId, { welcome_screen_description: e.target.value });
              }}
              placeholder="A brief intro for your respondents..."
            />
          </div>
          <div>
            <label className="settings-label">Thank You Screen Title</label>
            <input
              className="input"
              value={form.thankyou_screen_title || ""}
              onChange={(e) => {
                setForm((p) => p ? { ...p, thankyou_screen_title: e.target.value } : null);
                formsApi.update(formId, { thankyou_screen_title: e.target.value });
              }}
              placeholder="Thank you!"
            />
          </div>
          <div>
            <label className="settings-label">Thank You Screen Description</label>
            <textarea
              className="textarea"
              value={form.thankyou_screen_description || ""}
              onChange={(e) => {
                setForm((p) => p ? { ...p, thankyou_screen_description: e.target.value } : null);
                formsApi.update(formId, { thankyou_screen_description: e.target.value });
              }}
              placeholder="Your response has been recorded."
            />
          </div>
          <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--space-4)" }}>
            <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-3)" }}>Theme</h4>
            <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
              <div>
                <label className="settings-sublabel">Primary Color</label>
                <input
                  type="color"
                  value={form.theme_settings?.primaryColor || "#6C5CE7"}
                  onChange={(e) => {
                    const theme = { ...(form.theme_settings || {}), primaryColor: e.target.value };
                    setForm((p) => p ? { ...p, theme_settings: theme } : null);
                    formsApi.update(formId, { theme_settings: theme });
                  }}
                  style={{ width: "48px", height: "36px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}
                />
              </div>
              <div>
                <label className="settings-sublabel">Background</label>
                <input
                  type="color"
                  value={form.theme_settings?.backgroundColor || "#FFFFFF"}
                  onChange={(e) => {
                    const theme = { ...(form.theme_settings || {}), backgroundColor: e.target.value };
                    setForm((p) => p ? { ...p, theme_settings: theme } : null);
                    formsApi.update(formId, { theme_settings: theme });
                  }}
                  style={{ width: "48px", height: "36px", border: "none", borderRadius: "var(--radius-md)", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--space-4)" }}>
            <h4 style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: "var(--space-2)", color: "var(--color-text-secondary)" }}>Coming Soon</h4>
            <p className="text-xs text-secondary">Logic jumps • File uploads • Integrations • Webhooks • Team collaboration</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Question Preview (Center Panel) ──────────────────────── */
function QuestionPreview({ question }: { question: Question }) {
  const props = question.properties || {};

  switch (question.type) {
    case "short_text":
      return <input className="input input-lg" placeholder={props.placeholder || "Type your answer here..."} disabled />;

    case "long_text":
      return <textarea className="textarea" placeholder={props.placeholder || "Type your answer here..."} disabled rows={3} />;

    case "email":
      return <input className="input input-lg" placeholder={props.placeholder || "name@example.com"} disabled />;

    case "number":
      return <input className="input input-lg" type="number" placeholder={props.placeholder || "0"} disabled />;

    case "multiple_choice":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {(props.choices || []).map((choice: string, i: number) => (
            <div key={i} style={{
              padding: "var(--space-3) var(--space-4)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              display: "flex", alignItems: "center", gap: "var(--space-3)",
              fontSize: "var(--font-size-sm)",
            }}>
              <span style={{
                width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-xs)", fontWeight: 600,
              }}>
                {String.fromCharCode(65 + i)}
              </span>
              {choice}
            </div>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <select className="input input-lg" disabled>
          <option>Select an option...</option>
          {(props.choices || []).map((c: string, i: number) => (
            <option key={i}>{c}</option>
          ))}
        </select>
      );

    case "yes_no":
      return (
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <div style={{
            flex: 1, padding: "var(--space-4)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", textAlign: "center", fontWeight: 600,
          }}>Yes</div>
          <div style={{
            flex: 1, padding: "var(--space-4)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", textAlign: "center", fontWeight: 600,
          }}>No</div>
        </div>
      );

    case "rating":
      return (
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {Array.from({ length: props.max_rating || 5 }).map((_, i) => (
            <span key={i} style={{ fontSize: "28px", color: "var(--color-border)", cursor: "default" }}>★</span>
          ))}
        </div>
      );

    default:
      return <p className="text-secondary text-sm">Preview not available</p>;
  }
}

/* ─── Type-Specific Settings (Right Panel) ─────────────────── */
function TypeSpecificSettings({
  question,
  onUpdate,
}: {
  question: Question;
  onUpdate: (updates: Partial<Question>) => void;
}) {
  const props = question.properties || {};

  const updateProp = (key: string, value: unknown) => {
    onUpdate({ properties: { ...props, [key]: value } } as Partial<Question>);
  };

  switch (question.type) {
    case "short_text":
    case "long_text":
    case "email":
      return (
        <div className="settings-section">
          <label className="settings-label">Placeholder</label>
          <input
            className="input"
            value={props.placeholder || ""}
            onChange={(e) => updateProp("placeholder", e.target.value)}
            placeholder="Enter placeholder text..."
          />
        </div>
      );

    case "number":
      return (
        <>
          <div className="settings-section">
            <label className="settings-label">Placeholder</label>
            <input
              className="input"
              value={props.placeholder || ""}
              onChange={(e) => updateProp("placeholder", e.target.value)}
            />
          </div>
          <div className="settings-section">
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <div style={{ flex: 1 }}>
                <label className="settings-label">Min</label>
                <input
                  className="input"
                  type="number"
                  value={props.min_value ?? ""}
                  onChange={(e) => updateProp("min_value", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="settings-label">Max</label>
                <input
                  className="input"
                  type="number"
                  value={props.max_value ?? ""}
                  onChange={(e) => updateProp("max_value", e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
          </div>
        </>
      );

    case "multiple_choice":
    case "dropdown":
      return (
        <div className="settings-section">
          <label className="settings-label">Choices</label>
          <div className="choice-list">
            {(props.choices || []).map((choice: string, i: number) => (
              <div key={i} className="choice-item">
                <input
                  className="input"
                  value={choice}
                  onChange={(e) => {
                    const newChoices = [...(props.choices || [])];
                    newChoices[i] = e.target.value;
                    updateProp("choices", newChoices);
                  }}
                />
                <button
                  className="remove-btn btn btn-icon btn-ghost btn-sm"
                  onClick={() => {
                    const newChoices = (props.choices || []).filter((_: string, idx: number) => idx !== i);
                    updateProp("choices", newChoices);
                  }}
                >✕</button>
              </div>
            ))}
            <button
              className="btn btn-ghost btn-sm w-full"
              onClick={() => {
                const newChoices = [...(props.choices || []), `Option ${(props.choices || []).length + 1}`];
                updateProp("choices", newChoices);
              }}
            >
              + Add choice
            </button>
          </div>
        </div>
      );

    case "rating":
      return (
        <div className="settings-section">
          <label className="settings-label">Max Rating</label>
          <select
            className="input"
            value={props.max_rating || 5}
            onChange={(e) => updateProp("max_rating", Number(e.target.value))}
          >
            {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>{n} stars</option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
}

function getDefaultProperties(type: QuestionType): QuestionProperties {
  const defaults: Record<QuestionType, QuestionProperties> = {
    short_text: { placeholder: "Type your answer here..." },
    long_text: { placeholder: "Type your answer here...", max_length: 1000 },
    multiple_choice: { choices: ["Option 1", "Option 2", "Option 3"], allow_multiple: false },
    dropdown: { choices: ["Option 1", "Option 2", "Option 3"] },
    email: { placeholder: "name@example.com" },
    number: { placeholder: "0", min_value: null, max_value: null },
    yes_no: {},
    rating: { max_rating: 5, shape: "star" },
  };
  return defaults[type] || {};
}
