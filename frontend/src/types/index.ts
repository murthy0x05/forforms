/* ============================================================
   ForForms — TypeScript Type Definitions
   ============================================================ */

// ─── Question Types ───────────────────────────────────────────
export type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

export interface QuestionProperties {
  placeholder?: string;
  max_length?: number;
  choices?: string[];
  allow_multiple?: boolean;
  max_rating?: number;
  shape?: string;
  min_value?: number | null;
  max_value?: number | null;
}

// ─── Question ─────────────────────────────────────────────────
export interface Question {
  id: string;
  form_id: string;
  type: QuestionType;
  title: string;
  description?: string | null;
  order_index: number;
  is_required: boolean;
  properties: QuestionProperties;
  created_at: string;
  updated_at: string;
}

// ─── Form ─────────────────────────────────────────────────────
export interface ThemeSettings {
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  status: "draft" | "published";
  share_id?: string | null;
  theme_settings?: ThemeSettings | null;
  welcome_screen_title?: string | null;
  welcome_screen_description?: string | null;
  welcome_screen_enabled?: string | null;
  thankyou_screen_title?: string | null;
  thankyou_screen_description?: string | null;
  created_at: string;
  updated_at: string;
  questions: Question[];
  response_count: number;
}

export interface FormListItem {
  id: string;
  title: string;
  description?: string | null;
  status: "draft" | "published";
  share_id?: string | null;
  created_at: string;
  updated_at: string;
  response_count: number;
  question_count: number;
}

// ─── Responses ────────────────────────────────────────────────
export interface Answer {
  id: string;
  question_id: string;
  value?: string | null;
}

export interface AnswerWithInfo extends Answer {
  question_title: string;
  question_type: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  submitted_at: string;
  answers: Answer[];
}

export interface ResponseDetail {
  id: string;
  form_id: string;
  form_title: string;
  submitted_at: string;
  answers: AnswerWithInfo[];
}

export interface ResponseList {
  form_id: string;
  form_title: string;
  total: number;
  responses: FormResponse[];
}

// ─── Summary ──────────────────────────────────────────────────
export interface QuestionSummary {
  question_id: string;
  question_title: string;
  question_type: string;
  total_answers: number;
  summary: {
    counts?: Record<string, number>;
    total?: number;
    average?: number;
    min?: number;
    max?: number;
    sum?: number;
    distribution?: Record<string, number>;
    sample_answers?: string[];
    avg_length?: number;
    empty?: boolean;
  };
}

export interface FormSummary {
  form_id: string;
  form_title: string;
  total_responses: number;
  questions: QuestionSummary[];
}

// ─── API Request Types ────────────────────────────────────────
export interface FormCreateRequest {
  title?: string;
  description?: string;
}

export interface FormUpdateRequest {
  title?: string;
  description?: string;
  theme_settings?: ThemeSettings;
  welcome_screen_title?: string;
  welcome_screen_description?: string;
  welcome_screen_enabled?: string;
  thankyou_screen_title?: string;
  thankyou_screen_description?: string;
}

export interface QuestionCreateRequest {
  type: QuestionType;
  title?: string;
  description?: string;
  order_index?: number;
  is_required?: boolean;
  properties?: QuestionProperties;
}

export interface QuestionUpdateRequest {
  type?: QuestionType;
  title?: string;
  description?: string | null;
  order_index?: number;
  is_required?: boolean;
  properties?: QuestionProperties;
}

export interface SubmissionRequest {
  answers: { question_id: string; value?: string }[];
  metadata?: Record<string, unknown>;
}

// ─── Public Form (for respondent) ─────────────────────────────
export interface PublicForm {
  id: string;
  title: string;
  description?: string | null;
  theme_settings?: ThemeSettings | null;
  welcome_screen_title?: string | null;
  welcome_screen_description?: string | null;
  welcome_screen_enabled?: string | null;
  thankyou_screen_title?: string | null;
  thankyou_screen_description?: string | null;
  questions: Question[];
}

// ─── UI State Types ───────────────────────────────────────────
export type ViewMode = "grid" | "list";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  multiple_choice: "Multiple Choice",
  dropdown: "Dropdown",
  email: "Email",
  number: "Number",
  yes_no: "Yes / No",
  rating: "Rating",
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  short_text: "Aa",
  long_text: "¶",
  multiple_choice: "☰",
  dropdown: "▾",
  email: "@",
  number: "#",
  yes_no: "✓✗",
  rating: "★",
};
