import React from "react";
import { createEmptyIssue, createInitialForm, issueStatuses, observationFields } from "../defaults";

export function ReportForm({ onSubmit, isOnline, saveMessage }) {
  const [form, setForm] = React.useState(createInitialForm());

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateObservation = (field, value) => {
    setForm((current) => ({
      ...current,
      observations: {
        ...current.observations,
        [field]: value
      }
    }));
  };

  const updateIssue = (index, field, value) => {
    setForm((current) => ({
      ...current,
      issues: current.issues.map((issue, issueIndex) =>
        issueIndex === index ? { ...issue, [field]: value } : issue
      )
    }));
  };

  const addIssue = () => {
    setForm((current) => ({ ...current, issues: [...current.issues, createEmptyIssue()] }));
  };

  const removeIssue = (index) => {
    setForm((current) => ({
      ...current,
      issues: current.issues.length === 1 ? [createEmptyIssue()] : current.issues.filter((_, i) => i !== index)
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const didSave = await onSubmit(form);
    if (didSave) {
      setForm(createInitialForm());
    }
  };

  return (
    <section className="panel form-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Create Report</p>
          <h2>Store Visit Form</h2>
        </div>
        <div className={`connection-pill ${isOnline ? "online" : "offline"}`}>
          {isOnline ? "Online" : "Offline"}
        </div>
      </div>

      <form className="report-form" onSubmit={submit}>
        <div className="field-grid">
          <label>
            Store Name
            <input
              type="text"
              required
              value={form.storeName}
              onChange={(event) => updateField("storeName", event.target.value)}
            />
          </label>

          <label>
            Visit Date
            <input
              type="date"
              required
              value={form.visitDate}
              onChange={(event) => updateField("visitDate", event.target.value)}
            />
          </label>

          <label>
            Sales Rep Name
            <input
              type="text"
              required
              value={form.salesRepName}
              onChange={(event) => updateField("salesRepName", event.target.value)}
            />
          </label>

          <label>
            Roving Coordinator
            <input
              type="text"
              value={form.rovingCoordinator}
              onChange={(event) => updateField("rovingCoordinator", event.target.value)}
            />
          </label>

          <label>
            Promodisers Present
            <input
              type="text"
              value={form.promodisersPresent}
              onChange={(event) => updateField("promodisersPresent", event.target.value)}
            />
          </label>

          <label>
            Running Sales
            <input
              type="number"
              min="0"
              value={form.runningSales}
              onChange={(event) => updateField("runningSales", event.target.value)}
            />
          </label>
        </div>

        <div className="subsection">
          <h3>Observations</h3>
          <div className="field-grid observations-grid">
            {observationFields.map(([key, label]) => (
              <label key={key}>
                {label}
                <textarea
                  rows="4"
                  value={form.observations[key]}
                  onChange={(event) => updateObservation(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="subsection">
          <div className="subsection-header">
            <h3>Issues</h3>
            <button className="secondary-button" type="button" onClick={addIssue}>
              Add Issue
            </button>
          </div>

          <div className="issue-list">
            {form.issues.map((issue, index) => (
              <div className="issue-card" key={index}>
                <div className="issue-card-header">
                  <h4>Issue {index + 1}</h4>
                  <button className="text-button" type="button" onClick={() => removeIssue(index)}>
                    Remove
                  </button>
                </div>

                <div className="field-grid">
                  <label>
                    Description
                    <textarea
                      rows="3"
                      value={issue.description}
                      onChange={(event) => updateIssue(index, "description", event.target.value)}
                    />
                  </label>
                  <label>
                    Action Plan
                    <textarea
                      rows="3"
                      value={issue.actionPlan}
                      onChange={(event) => updateIssue(index, "actionPlan", event.target.value)}
                    />
                  </label>
                  <label>
                    Assigned To
                    <input
                      type="text"
                      value={issue.assignedTo}
                      onChange={(event) => updateIssue(index, "assignedTo", event.target.value)}
                    />
                  </label>
                  <label>
                    Due Date
                    <input
                      type="date"
                      value={issue.dueDate}
                      onChange={(event) => updateIssue(index, "dueDate", event.target.value)}
                    />
                  </label>
                  <label>
                    Status
                    <select value={issue.status} onChange={(event) => updateIssue(index, "status", event.target.value)}>
                      {issueStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <label>
          General Notes
          <textarea rows="5" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
        </label>

        <div className="form-actions">
          <button className="primary-button" type="submit">
            {isOnline ? "Save Report" : "Save Offline"}
          </button>
          <span className="save-message">{saveMessage}</span>
        </div>
      </form>
    </section>
  );
}
