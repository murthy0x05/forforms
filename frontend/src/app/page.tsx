"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formsApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import type { FormListItem, ViewMode } from "@/types";
import { formatDate, cn } from "@/lib/utils";

export default function Dashboard() {
  const router = useRouter();
  const { addToast } = useToast();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      const data = await formsApi.list();
      setForms(data);
    } catch (err) {
      addToast("error", "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreate = async () => {
    try {
      const form = await formsApi.create({ title: newFormTitle || "Untitled Form" });
      addToast("success", "Form created!");
      setShowCreateModal(false);
      setNewFormTitle("");
      router.push(`/forms/${form.id}/edit`);
    } catch (err) {
      addToast("error", "Failed to create form");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await formsApi.duplicate(id);
      addToast("success", "Form duplicated!");
      loadForms();
    } catch (err) {
      addToast("error", "Failed to duplicate form");
    }
    setMenuOpenId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await formsApi.delete(id);
      addToast("success", "Form deleted");
      loadForms();
    } catch (err) {
      addToast("error", "Failed to delete form");
    }
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="logo">
          <div className="logo-icon">F</div>
          <span className="logo-text">ForForms</span>
        </div>
        <nav className="sidebar-nav">
          <button className="sidebar-nav-item active">
            <span className="icon">📋</span> My Workspace
          </button>
          <button className="sidebar-nav-item" style={{ opacity: 0.5, cursor: "default" }}>
            <span className="icon">⚡</span> Integrations
            <span className="badge badge-draft" style={{ marginLeft: "auto", fontSize: "9px" }}>Soon</span>
          </button>
          <button className="sidebar-nav-item" style={{ opacity: 0.5, cursor: "default" }}>
            <span className="icon">👥</span> Team
            <span className="badge badge-draft" style={{ marginLeft: "auto", fontSize: "9px" }}>Soon</span>
          </button>
          <button className="sidebar-nav-item" style={{ opacity: 0.5, cursor: "default" }}>
            <span className="icon">⚙️</span> Settings
            <span className="badge badge-draft" style={{ marginLeft: "auto", fontSize: "9px" }}>Soon</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>My Workspace</h1>
          <div className="dashboard-toolbar">
            <div className="view-toggle">
              <button className={cn(viewMode === "grid" && "active")} onClick={() => setViewMode("grid")}>▦</button>
              <button className={cn(viewMode === "list" && "active")} onClick={() => setViewMode("list")}>☰</button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setShowCreateModal(true)}>
              + Create form
            </button>
          </div>
        </div>

        {loading ? (
          <div className="editor-empty">
            <div className="icon" style={{ animation: "pulse 1.5s infinite" }}>📋</div>
            <h3>Loading your forms...</h3>
          </div>
        ) : forms.length === 0 ? (
          <div className="editor-empty" style={{ marginTop: "80px" }}>
            <div className="icon">📝</div>
            <h3>No forms yet</h3>
            <p>Create your first form and start collecting responses.</p>
            <button className="btn btn-primary btn-lg mt-6" onClick={() => setShowCreateModal(true)}>
              + Create your first form
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="forms-grid">
            {forms.map((form) => (
              <div
                key={form.id}
                className="form-card card-interactive"
                onClick={() => router.push(`/forms/${form.id}/edit`)}
              >
                <div className="form-card-header">
                  <span className={`badge ${form.status === "published" ? "badge-published" : "badge-draft"}`}>
                    {form.status === "published" ? "● Live" : "Draft"}
                  </span>
                  <div className="form-card-actions" onClick={(e) => e.stopPropagation()}>
                    <div style={{ position: "relative" }}>
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setMenuOpenId(menuOpenId === form.id ? null : form.id)}>⋮</button>
                      {menuOpenId === form.id && (
                        <div className="dropdown-menu" style={{ right: 0, top: "100%" }}>
                          <button className="dropdown-item" onClick={() => { router.push(`/forms/${form.id}/edit`); setMenuOpenId(null); }}>✏️ Edit</button>
                          <button className="dropdown-item" onClick={() => { router.push(`/forms/${form.id}/results`); setMenuOpenId(null); }}>📊 Results</button>
                          <button className="dropdown-item" onClick={() => handleDuplicate(form.id)}>📋 Duplicate</button>
                          {form.share_id && (
                            <button className="dropdown-item" onClick={() => { window.open(`/f/${form.share_id}`, "_blank"); setMenuOpenId(null); }}>🔗 Open form</button>
                          )}
                          <div className="dropdown-divider" />
                          <button className="dropdown-item dropdown-item-danger" onClick={() => { setDeleteConfirmId(form.id); setMenuOpenId(null); }}>🗑️ Delete</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="form-card-title">{form.title}</div>
                <div className="form-card-meta">
                  <span>📝 {form.question_count} questions</span>
                  <span>📨 {form.response_count} responses</span>
                  <span>🕐 {formatDate(form.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="forms-list">
            {forms.map((form) => (
              <div
                key={form.id}
                className="form-card"
                onClick={() => router.push(`/forms/${form.id}/edit`)}
                style={{ cursor: "pointer" }}
              >
                <div className="form-card-list">
                  <span className={`badge ${form.status === "published" ? "badge-published" : "badge-draft"}`}>
                    {form.status === "published" ? "● Live" : "Draft"}
                  </span>
                  <span className="form-card-title" style={{ flex: 1 }}>{form.title}</span>
                  <span className="text-xs text-secondary">{form.question_count} questions</span>
                  <span className="text-xs text-secondary">{form.response_count} responses</span>
                  <span className="text-xs text-secondary">{formatDate(form.updated_at)}</span>
                  <div onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setMenuOpenId(menuOpenId === form.id ? null : form.id)}>⋮</button>
                    {menuOpenId === form.id && (
                      <div className="dropdown-menu" style={{ right: 0, top: "100%" }}>
                        <button className="dropdown-item" onClick={() => { router.push(`/forms/${form.id}/edit`); setMenuOpenId(null); }}>✏️ Edit</button>
                        <button className="dropdown-item" onClick={() => { router.push(`/forms/${form.id}/results`); setMenuOpenId(null); }}>📊 Results</button>
                        <button className="dropdown-item" onClick={() => handleDuplicate(form.id)}>📋 Duplicate</button>
                        <div className="dropdown-divider" />
                        <button className="dropdown-item dropdown-item-danger" onClick={() => { setDeleteConfirmId(form.id); setMenuOpenId(null); }}>🗑️ Delete</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Form Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setNewFormTitle(""); }}
        title="Create new form"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setNewFormTitle(""); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create form</button>
          </>
        }
      >
        <div style={{ marginBottom: "var(--space-4)" }}>
          <label className="settings-label">Form title</label>
          <input
            className="input"
            placeholder="e.g. Customer Feedback Survey"
            value={newFormTitle}
            onChange={(e) => setNewFormTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            autoFocus
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete form?"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</button>
          </>
        }
      >
        <p className="text-secondary">This will permanently delete this form and all its responses. This action cannot be undone.</p>
      </Modal>

      {/* Close dropdown on outside click */}
      {menuOpenId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }} onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  );
}
