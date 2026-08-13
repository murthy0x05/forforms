"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { publicApi } from "@/lib/api";
import type { PublicForm, Question } from "@/types";
import { isValidEmail, isValidNumber } from "@/lib/utils";

type FlowState = "loading" | "welcome" | "questions" | "submitting" | "thankyou" | "error";

export default function RespondentFlow() {
  const params = useParams();
  const shareId = params.shareId as string;

  const [form, setForm] = useState<PublicForm | null>(null);
  const [state, setState] = useState<FlowState>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isAnimating, setIsAnimating] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const questions = useMemo(() => form?.questions || [], [form]);
  const currentQuestion: Question | null = questions[currentIndex] || null;
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const primaryColor = form?.theme_settings?.primaryColor || "#6C5CE7";
  const bgColor = form?.theme_settings?.backgroundColor || "#FFFFFF";

  // Load form
  useEffect(() => {
    (async () => {
      try {
        const data = await publicApi.getForm(shareId);
        setForm(data);
        setState(data.welcome_screen_enabled === "true" ? "welcome" : "questions");
      } catch {
        setError("This form is not available.");
        setState("error");
      }
    })();
  }, [shareId]);

  // Auto-focus input
  useEffect(() => {
    if (state === "questions" && inputRef.current && !isAnimating) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [currentIndex, state, isAnimating]);

  // Validate current answer
  const validateCurrent = useCallback((): boolean => {
    if (!currentQuestion) return true;
    const value = answers[currentQuestion.id] || "";

    if (currentQuestion.is_required && !value.trim()) {
      setValidationError("This question is required");
      return false;
    }

    if (value && currentQuestion.type === "email" && !isValidEmail(value)) {
      setValidationError("Please enter a valid email address");
      return false;
    }

    if (value && currentQuestion.type === "number" && !isValidNumber(value)) {
      setValidationError("Please enter a valid number");
      return false;
    }

    setValidationError("");
    return true;
  }, [currentQuestion, answers]);

  // Navigation
  const goNext = useCallback(() => {
    if (isAnimating) return;
    if (!validateCurrent()) return;

    if (currentIndex >= questions.length - 1) {
      handleSubmit();
      return;
    }

    setIsAnimating(true);
    setDirection("forward");
    setValidationError("");
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsAnimating(false);
    }, 400);
  }, [currentIndex, questions.length, isAnimating, validateCurrent]); // eslint-disable-line

  const goPrev = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;

    setIsAnimating(true);
    setDirection("backward");
    setValidationError("");
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setIsAnimating(false);
    }, 400);
  }, [currentIndex, isAnimating]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state !== "questions") return;

      if (e.key === "Enter" && !e.shiftKey) {
        if (currentQuestion?.type !== "long_text") {
          e.preventDefault();
          goNext();
        }
      }
      if (e.key === "ArrowDown" && e.ctrlKey) {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowUp" && e.ctrlKey) {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, goNext, goPrev, currentQuestion]);

  // Submit
  const handleSubmit = async () => {
    if (!form) return;
    setState("submitting");

    try {
      const answersList = questions.map((q) => ({
        question_id: q.id,
        value: answers[q.id] || "",
      }));

      await publicApi.submitResponse(shareId, { answers: answersList });
      setState("thankyou");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setValidationError(message);
      setState("questions");
    }
  };

  // Update answer
  const setAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setValidationError("");
  };

  // Slide animation style
  const slideStyle: React.CSSProperties = {
    animation: isAnimating
      ? direction === "forward"
        ? "questionSlideOut 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
        : "questionSlideOut 400ms cubic-bezier(0.4, 0, 0.2, 1) forwards"
      : "questionSlideIn 500ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  };

  // ─── LOADING ────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="respondent-container" style={{ background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", animation: "pulse 1.5s infinite" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <p style={{ color: "var(--color-text-secondary)" }}>Loading form...</p>
        </div>
      </div>
    );
  }

  // ─── ERROR ──────────────────────────────────────────────────
  if (state === "error") {
    return (
      <div className="respondent-container" style={{ background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "24px" }}>😕</div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "12px" }}>Form not available</h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-lg)" }}>{error}</p>
        </div>
      </div>
    );
  }

  // ─── WELCOME ────────────────────────────────────────────────
  if (state === "welcome" && form) {
    return (
      <div className="respondent-container" style={{ background: bgColor }}>
        <div className="welcome-screen" style={{ animation: "fadeIn 800ms ease" }}>
          <h1 style={{ color: "var(--color-text)" }}>
            {form.welcome_screen_title || form.title}
          </h1>
          <p>{form.welcome_screen_description || form.description || "Press start to begin"}</p>
          <button
            className="welcome-start-btn"
            style={{ background: primaryColor, boxShadow: `0 4px 14px ${primaryColor}66` }}
            onClick={() => setState("questions")}
          >
            Start →
          </button>
        </div>
      </div>
    );
  }

  // ─── SUBMITTING ─────────────────────────────────────────────
  if (state === "submitting") {
    return (
      <div className="respondent-container" style={{ background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", animation: "pulse 1.5s infinite" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📤</div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-lg)" }}>Submitting your responses...</p>
        </div>
      </div>
    );
  }

  // ─── THANK YOU ──────────────────────────────────────────────
  if (state === "thankyou" && form) {
    return (
      <div className="respondent-container" style={{ background: bgColor }}>
        <div className="thankyou-screen" style={{ animation: "fadeIn 600ms ease" }}>
          <div className="thankyou-check" style={{ background: "var(--color-success)" }}>✓</div>
          <h1>{form.thankyou_screen_title || "Thank you!"}</h1>
          <p>{form.thankyou_screen_description || "Your response has been recorded."}</p>
        </div>
      </div>
    );
  }

  // ─── QUESTIONS FLOW ─────────────────────────────────────────
  if (state === "questions" && currentQuestion && form) {
    const currentValue = answers[currentQuestion.id] || "";
    const isLast = currentIndex === questions.length - 1;

    return (
      <div className="respondent-container" style={{ background: bgColor }}>
        {/* Progress Bar */}
        <div className="respondent-progress">
          <div className="respondent-progress-bar" style={{ width: `${progress}%`, background: primaryColor }} />
        </div>

        {/* Question Slide */}
        <div className="respondent-slide" key={currentIndex} style={slideStyle}>
          <div className="respondent-slide-content">
            <div className="respondent-question-number">
              {currentIndex + 1} <span>→</span>
            </div>
            <h2 className="respondent-question-title">
              {currentQuestion.title || "Untitled question"}
              {currentQuestion.is_required && <span className="respondent-required">*</span>}
            </h2>
            {currentQuestion.description && (
              <p className="respondent-question-description">{currentQuestion.description}</p>
            )}

            {/* ─── Field Renderers ────────────────────────── */}
            {currentQuestion.type === "short_text" && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="respondent-input"
                type="text"
                value={currentValue}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.properties?.placeholder || "Type your answer here..."}
                autoFocus
              />
            )}

            {currentQuestion.type === "long_text" && (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                className="respondent-textarea"
                value={currentValue}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.properties?.placeholder || "Type your answer here..."}
                rows={3}
                autoFocus
              />
            )}

            {currentQuestion.type === "email" && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="respondent-input"
                type="email"
                value={currentValue}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.properties?.placeholder || "name@example.com"}
                autoFocus
              />
            )}

            {currentQuestion.type === "number" && (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className="respondent-input"
                type="number"
                value={currentValue}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={currentQuestion.properties?.placeholder || "0"}
                autoFocus
              />
            )}

            {currentQuestion.type === "multiple_choice" && (
              <div className="respondent-choices">
                {(currentQuestion.properties?.choices || []).map((choice: string, i: number) => (
                  <button
                    key={i}
                    className={`respondent-choice ${currentValue === choice ? "selected" : ""}`}
                    onClick={() => { setAnswer(choice); setTimeout(() => goNext(), 400); }}
                    style={currentValue === choice ? { borderColor: primaryColor, background: `${primaryColor}15`, color: primaryColor } : {}}
                  >
                    <span className="choice-key" style={currentValue === choice ? { background: primaryColor, borderColor: primaryColor, color: "white" } : {}}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === "dropdown" && (
              <div className="respondent-dropdown">
                <button
                  className={`respondent-dropdown-trigger ${currentValue ? "has-value" : ""}`}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span style={{ color: currentValue ? "var(--color-text)" : "var(--color-text-tertiary)" }}>
                    {currentValue || "Select an option..."}
                  </span>
                  <span>{dropdownOpen ? "▲" : "▼"}</span>
                </button>
                {dropdownOpen && (
                  <div className="respondent-dropdown-list">
                    {(currentQuestion.properties?.choices || []).map((choice: string, i: number) => (
                      <button
                        key={i}
                        className={`respondent-dropdown-option ${currentValue === choice ? "selected" : ""}`}
                        onClick={() => { setAnswer(choice); setDropdownOpen(false); }}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === "yes_no" && (
              <div className="respondent-yesno">
                <button
                  className={`respondent-yesno-btn ${currentValue === "Yes" ? "selected" : ""}`}
                  onClick={() => { setAnswer("Yes"); setTimeout(() => goNext(), 400); }}
                  style={currentValue === "Yes" ? { borderColor: primaryColor, background: primaryColor } : {}}
                >
                  👍 Yes
                </button>
                <button
                  className={`respondent-yesno-btn ${currentValue === "No" ? "selected" : ""}`}
                  onClick={() => { setAnswer("No"); setTimeout(() => goNext(), 400); }}
                  style={currentValue === "No" ? { borderColor: primaryColor, background: primaryColor } : {}}
                >
                  👎 No
                </button>
              </div>
            )}

            {currentQuestion.type === "rating" && (
              <div className="respondent-rating">
                {Array.from({ length: currentQuestion.properties?.max_rating || 5 }).map((_, i) => {
                  const starValue = i + 1;
                  const isActive = starValue <= parseInt(currentValue || "0");
                  const isHovered = starValue <= ratingHover;
                  return (
                    <span
                      key={i}
                      className={`respondent-rating-star ${isActive ? "active" : ""} ${isHovered ? "hovered" : ""}`}
                      onMouseEnter={() => setRatingHover(starValue)}
                      onMouseLeave={() => setRatingHover(0)}
                      onClick={() => { setAnswer(String(starValue)); setTimeout(() => goNext(), 500); }}
                    >
                      ★
                    </span>
                  );
                })}
              </div>
            )}

            {/* Validation Error */}
            {validationError && (
              <div className="validation-error">⚠ {validationError}</div>
            )}

            {/* OK / Submit Button */}
            {!["multiple_choice", "yes_no", "rating"].includes(currentQuestion.type) && (
              <>
                <button
                  className="respondent-submit-btn"
                  style={{ background: primaryColor }}
                  onClick={goNext}
                >
                  {isLast ? "Submit" : "OK"} ✓
                </button>
                <p className="respondent-submit-hint">
                  press <strong>Enter ↵</strong>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="respondent-nav">
          <button className="respondent-nav-btn" onClick={goPrev} disabled={currentIndex === 0}>▲</button>
          <button className="respondent-nav-btn" onClick={goNext}>▼</button>
        </div>
      </div>
    );
  }

  return null;
}
