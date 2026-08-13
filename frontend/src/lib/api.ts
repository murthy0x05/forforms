/* ============================================================
   ForForms — API Client
   Centralized fetch wrapper for all backend API calls.
   ============================================================ */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  // Handle 204 No Content or empty responses
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

// ─── Forms API ────────────────────────────────────────────────
import type {
  Form,
  FormListItem,
  FormCreateRequest,
  FormUpdateRequest,
  PublicForm,
  Question,
  QuestionCreateRequest,
  QuestionUpdateRequest,
  ResponseList,
  ResponseDetail,
  FormSummary,
  SubmissionRequest,
  FormResponse,
} from "@/types";

export const formsApi = {
  list: () => request<FormListItem[]>("/api/forms"),

  get: (id: string) => request<Form>(`/api/forms/${id}`),

  create: (data: FormCreateRequest = {}) =>
    request<Form>("/api/forms", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: FormUpdateRequest) =>
    request<Form>(`/api/forms/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/api/forms/${id}`, { method: "DELETE" }),

  duplicate: (id: string) =>
    request<Form>(`/api/forms/${id}/duplicate`, { method: "POST" }),

  publish: (id: string) =>
    request<{ id: string; status: string; share_id: string; share_url: string }>(
      `/api/forms/${id}/publish`,
      { method: "POST" }
    ),

  unpublish: (id: string) =>
    request<Form>(`/api/forms/${id}/unpublish`, { method: "POST" }),
};

// ─── Questions API ────────────────────────────────────────────
export const questionsApi = {
  add: (formId: string, data: QuestionCreateRequest) =>
    request<Question>(`/api/forms/${formId}/questions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (formId: string, questionId: string, data: QuestionUpdateRequest) =>
    request<Question>(`/api/forms/${formId}/questions/${questionId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (formId: string, questionId: string) =>
    request<{ message: string }>(`/api/forms/${formId}/questions/${questionId}`, {
      method: "DELETE",
    }),

  reorder: (formId: string, questions: { id: string; order_index: number }[]) =>
    request<Question[]>(`/api/forms/${formId}/questions/reorder`, {
      method: "PUT",
      body: JSON.stringify({ questions }),
    }),
};

// ─── Public API ───────────────────────────────────────────────
export const publicApi = {
  getForm: (shareId: string) =>
    request<PublicForm>(`/api/public/forms/${shareId}`),

  submitResponse: (shareId: string, data: SubmissionRequest) =>
    request<FormResponse>(`/api/public/forms/${shareId}/responses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Responses API ────────────────────────────────────────────
export const responsesApi = {
  list: (formId: string) =>
    request<ResponseList>(`/api/forms/${formId}/responses`),

  get: (formId: string, responseId: string) =>
    request<ResponseDetail>(`/api/forms/${formId}/responses/${responseId}`),

  summary: (formId: string) =>
    request<FormSummary>(`/api/forms/${formId}/responses/summary`),

  delete: (formId: string, responseId: string) =>
    request<{ message: string }>(`/api/forms/${formId}/responses/${responseId}`, {
      method: "DELETE",
    }),

  exportUrl: (formId: string) =>
    `${API_BASE}/api/forms/${formId}/responses/export`,
};
