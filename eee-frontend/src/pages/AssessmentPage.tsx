import React, { useEffect, useState, useRef } from 'react';
import { questionsAPI, responsesAPI, scopesAPI, sectionsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { generatePDFReport } from '../utils/pdfReport';
import type { Question, AssessmentAnswer } from '../types';
import Navbar from '../components/Navbar';

const LAB_TYPES = [
  'Central Government', 'State Government', 'Union Territory',
]

// ── Checkbox Dropdown Component ──────────────────────────────────────────────
function CheckboxDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select options…',
}: {
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const label =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input"
        style={{
          width: '100%',
          fontSize: 13,
          padding: '6px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'var(--white)',
          textAlign: 'left',
          userSelect: 'none',
          gap: 8,
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: value.length === 0 ? 'var(--gray4)' : 'var(--text)',
          }}
        >
          {label}
        </span>
        {/* Count badge */}
        {value.length > 0 && (
          <span
            style={{
              background: 'var(--btn-primary-bg)',
              color: '#fff',
              borderRadius: 99,
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 7px',
              flexShrink: 0,
            }}
          >
            {value.length}
          </span>
        )}
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            transition: 'transform .18s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="var(--gray4)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--white)',
            border: '1px solid var(--gray2)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Select All / Clear row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--gray2)',
              background: 'var(--gray0)',
            }}
          >
            <button
              type="button"
              onClick={() => onChange([...options])}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: 'var(--blue)',
                cursor: 'pointer',
                padding: 0,
                fontWeight: 600,
                fontFamily: 'var(--font)',
              }}
            >
              Select All
            </button>
            <button
              type="button"
              onClick={() => onChange([])}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 12,
                color: 'var(--gray4)',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'var(--font)',
              }}
            >
              Clear
            </button>
          </div>

          {/* Options list */}
          {options.map(opt => {
            const checked = value.includes(opt);
            return (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  background: checked ? 'var(--blue-lt, rgba(59,130,246,.06))' : 'transparent',
                  borderBottom: '1px solid var(--gray1, #f4f4f5)',
                  transition: 'background .12s',
                  userSelect: 'none',
                }}
                onMouseOver={e =>
                  !checked && ((e.currentTarget as HTMLLabelElement).style.background = 'var(--gray0)')
                }
                onMouseOut={e =>
                  !checked && ((e.currentTarget as HTMLLabelElement).style.background = 'transparent')
                }
              >
                {/* Custom checkbox */}
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    border: `2px solid ${checked ? 'var(--btn-primary-bg)' : 'var(--gray3)'}`,
                    background: checked ? 'var(--btn-primary-bg)' : 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all .15s',
                  }}
                >
                  {checked && (
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                      <polyline
                        points="2 6 5 9 10 3"
                        stroke="white"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  style={{ display: 'none' }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: checked ? 'var(--text)' : 'var(--gray5)',
                    fontWeight: checked ? 600 : 400,
                  }}
                >
                  {opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SessionStorage persistence helpers ─────────────────────────────────────────
const STORAGE_KEY_PREFIX = 'eee_assessment_';

function getStorageKey(userId: number | undefined) {
  return `${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`;
}

interface PersistedState {
  answers: Record<number, 'yes' | 'no'>;
  labType: string;
  scope: string[];
  activeIdx: number;
}

function loadPersistedState(userId: number | undefined): Partial<PersistedState> {
  try {
    const raw = sessionStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PersistedState>;
  } catch {
    return {};
  }
}

function savePersistedState(userId: number | undefined, state: PersistedState) {
  try {
    sessionStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch { /* storage full — silently ignore */ }
}

function clearPersistedState(userId: number | undefined) {
  try {
    sessionStorage.removeItem(getStorageKey(userId));
  } catch { /* ignore */ }
}

// ── Helper: render markdown-style **bold** text as <strong> ────────────────
function renderBoldText(text: string): React.ReactNode {
  // Split on **...** patterns, capturing the bold content
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const { user, logout } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  // Load any previously saved state for this user (on initial mount)
  const saved = useRef(loadPersistedState(user?.id));
  const hasRestored = useRef(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, 'yes' | 'no'>>(saved.current.answers ?? {});
  const [labType, setLabType] = useState(saved.current.labType ?? '');
  const [scope, setScope] = useState<string[]>(saved.current.scope ?? []);
  const [scopes, setScopes] = useState<string[]>([]);
  const [sections, setSections] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(saved.current.activeIdx ?? 0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [hasPreviousSubmission, setHasPreviousSubmission] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPreviousPDF, setIsGeneratingPreviousPDF] = useState(false);
  const [isDownloadingSubmitted, setIsDownloadingSubmitted] = useState(false);

  // When user becomes available (e.g. after login), restore their saved state
  // First try sessionStorage (in-progress work), then fall back to server (previous submission)
  useEffect(() => {
    if (user?.id && !hasRestored.current) {
      hasRestored.current = true;
      const restored = loadPersistedState(user.id);
      const hasLocalAnswers = restored.answers && Object.keys(restored.answers).length > 0;

      if (hasLocalAnswers) {
        // Restore from sessionStorage (in-progress, unsaved work)
        setAnswers(restored.answers!);
        if (restored.labType) setLabType(restored.labType);
        if (restored.scope && restored.scope.length > 0) setScope(restored.scope);
        if (restored.activeIdx !== undefined) setActiveIdx(restored.activeIdx);
      } else {
        // No local progress — try fetching previously submitted responses from the server
        responsesAPI.getMyResponses()
          .then(res => {
            const data: any = res.data;
            const serverResponses = Array.isArray(data) ? data : [];
            if (serverResponses.length > 0) {
              // Auto-fill answers from server
              const restoredAnswers: Record<number, 'yes' | 'no'> = {};
              serverResponses.forEach((r: any) => {
                restoredAnswers[r.question] = r.answer;
              });
              setAnswers(restoredAnswers);

              // Restore lab_type and scope from the first response (they are the same across all)
              const firstResponse = serverResponses[0];
              if (firstResponse.lab_type) setLabType(firstResponse.lab_type);
              if (firstResponse.scope) {
                // Handle scope as either an array or a comma-separated string
                let scopeList: string[];
                if (Array.isArray(firstResponse.scope)) {
                  scopeList = firstResponse.scope.filter((s: string) => s.length > 0);
                } else {
                  scopeList = firstResponse.scope
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => s.length > 0);
                }
                if (scopeList.length > 0) setScope(scopeList);
              }

              setHasPreviousSubmission(true);
            }
          })
          .catch(() => {
            // Silently ignore — user may not have submitted before
          });
      }
    }
  }, [user?.id]);

  // Persist answers, labType, scope, activeIdx to sessionStorage on every change
  // Only save when we have a real user ID to avoid clobbering data
  useEffect(() => {
    if (!user?.id) return;
    savePersistedState(user.id, { answers, labType, scope, activeIdx });
  }, [answers, labType, scope, activeIdx, user?.id]);

  useEffect(() => {
    questionsAPI.getActive()
      .then(r => { const d: any = r.data; setQuestions(Array.isArray(d) ? d : (d?.results ?? [])); })
      .catch(() => setError('Failed to load questions. Please refresh the page.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeIdx]);
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const scopeRes = await scopesAPI.getAll();
        const sectionRes = await sectionsAPI.getAll();
        setScopes(scopeRes.data.scopes.map((s: { scope: string }) => s.scope));
        setSections(sectionRes.data.sections.map((s: { sectionName: string }) => s.sectionName));
      } catch (err) {
        setError('Failed to load options');
      }
    };
    fetchOptions();
  }, []);
  const sectionQs = (sec: string) => questions.filter(q => q.question_section === sec);
  const sectionDone = (sec: string) => { const qs = sectionQs(sec); return qs.length > 0 && qs.every(q => answers[q.id] !== undefined); };
  const completedCount = sections.filter(sectionDone).length;
  const totalAnswered = Object.keys(answers).length;
  const totalQs = questions.length;
  const overallPct = totalQs ? Math.round((totalAnswered / totalQs) * 100) : 0;

  const currentSec = sections[activeIdx];
  const currentQs = sectionQs(currentSec);
  const currentDone = true; //sectionDone(currentSec);
  const isLastSection = activeIdx === sections.length - 1;
  const allDone = sections.length > 0 && completedCount === sections.length;

  const handleAnswer = (qId: number, ans: 'yes' | 'no') =>
    setAnswers(prev => ({ ...prev, [qId]: ans }));

  const handleClearSection = () => {
    if (!confirm(`Clear all answers in "${currentSec}"?`)) return;
    const ids = currentQs.map(q => q.id);
    setAnswers(prev => { const n = { ...prev }; ids.forEach(id => delete n[id]); return n; });
  };

  const handleOpenPreview = () => {
    if (!labType) { setError('Please select a Lab Type before submitting.'); return; }
    if (scope.length === 0) { setError('Please select at least one Scope before submitting.'); return; }
    if (!allDone) { setError(`Please answer all questions. ${totalQs - totalAnswered} remaining.`); return; }
    setError('');
    setShowPreview(true);
  };

  const handleFinalSubmit = async () => {
    if (!labType || scope.length === 0 || !allDone) return;
    setError('');
    setSubmitting(true);
    try {
      const payload: AssessmentAnswer[] = Object.entries(answers).map(([qId, answer]) => ({
        question: Number(qId), answer, lab_type: labType, scope: scope.join(', '),
      }));
      await responsesAPI.submit(payload);
      clearPersistedState(user?.id);
      setHasPreviousSubmission(false);
      setShowPreview(false);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Submission failed. Please try again.');
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDFAndLogout = async (printerFriendly = false) => {
    setIsDownloadingSubmitted(true);
    try {
      const scopeLabel = scope.join(', ');

      await generatePDFReport({
        applicantName: user?.name || '',
        applicantEmail: user?.email || '',
        labType,
        scope: scopeLabel,
        questions,
        printerFriendly,
        responses: Object.entries(answers).map(([qId, answer]) => ({
          id: 0, user: user?.email || '',
          question: Number(qId), answer, lab_type: labType, scope: scopeLabel,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        })),
      });
      await logout();
    } catch (err) {
      setError('Failed to generate PDF report.');
    } finally {
      setIsDownloadingSubmitted(false);
    }
  };

  const handleDownloadPreviousReport = async (printerFriendly = false) => {
    setIsGeneratingPreviousPDF(true);
    try {
      const scopeLabel = scope.join(', ');
      await generatePDFReport({
        applicantName: user?.name || '',
        applicantEmail: user?.email || '',
        labType,
        scope: scopeLabel,
        questions,
        printerFriendly,
        responses: Object.entries(answers).map(([qId, answer]) => ({
          id: 0, user: user?.email || '',
          question: Number(qId), answer, lab_type: labType, scope: scopeLabel,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        })),
      });
    } catch (err) {
      setError('Failed to generate previous report PDF.');
    } finally {
      setIsGeneratingPreviousPDF(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--gray5)', fontSize: 14 }}>Loading assessment questions…</p>
        </div>
      </div>
    </div>
  );

  // ── Submitted ────────────────────────────────────────────────────────────
  if (submitted) {
    const yesCount = Object.values(answers).filter(a => a === 'yes').length;
    const pct = totalQs ? Math.round((yesCount / totalQs) * 100) : 0;
    const scoreColor = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
    const scoreBg = pct >= 80 ? 'var(--green-lt)' : pct >= 50 ? 'var(--amber-lt)' : 'var(--red-lt)';

    return (
      <div>
        <Navbar />
        <div className="fade-up submitted-wrapper" style={{ maxWidth: 680, margin: '60px auto', padding: '0 16px' }}>
          <div className="submitted-card card" style={{ textAlign: 'center', padding: '48px 40px' }}>
            {/* Success icon */}
            <div className="success-icon" style={{
              width: 72, height: 72, borderRadius: '50%', background: 'var(--green-lt)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
            }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h2 style={{ fontSize: 26, marginBottom: 8 }}>Assessment Submitted</h2>
            <p className="submitted-desc" style={{ color: 'var(--gray5)', marginBottom: 36, fontSize: 15 }}>
              Your responses have been recorded. Download your compliance report below. Downloading will log you out automatically.
            </p>

            {/* Score ring */}
            <div className="score-ring" style={{
              width: 130, height: 130, borderRadius: '50%',
              border: `10px solid ${scoreColor}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 32px', background: scoreBg,
            }}>
              <span style={{ fontSize: 30, fontWeight: 700, color: scoreColor, fontFamily: 'var(--font-head)' }}>{pct}%</span>
              <span style={{ fontSize: 11, color: 'var(--gray5)', marginTop: 2 }}>compliant</span>
            </div>

            {/* Stats row */}
            <div className="stats-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 36 }}>
              {[
                { label: 'Total', value: totalQs, color: 'var(--btn-primary-bg)', bg: 'var(--gray0)' },
                { label: 'Compliant', value: yesCount, color: 'var(--green)', bg: 'var(--green-lt)' },
                { label: 'Gaps', value: totalQs - yesCount, color: 'var(--red)', bg: 'var(--red-lt)' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 'var(--radius)', padding: '14px 8px' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--font-head)' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray5)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div className="download-btns" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => handleDownloadPDFAndLogout(false)}
                disabled={isDownloadingSubmitted}
                style={{ fontSize: 15 }}>
                {isDownloadingSubmitted ? 'Generating Report…' : '⬇ Download Full Report & Logout'}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => handleDownloadPDFAndLogout(true)}
                disabled={isDownloadingSubmitted}
                style={{ border: '2px solid var(--gray3)', fontSize: 15, color: 'var(--text)' }}>
                {isDownloadingSubmitted ? 'Generating…' : 'Printer Friendly (B&W) & Logout'}
              </button>
            </div>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--gray4)' }}>
              Report includes all questions, responses, feedback and guidance. Downloading will log you out securely.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Assessment ────────────────────────────────────────────────────
  return (
    <div>
      <Navbar />

      {/* Top progress strip */}
      <div style={{ height: 3, background: 'var(--gray2)' }}>
        <div className="progress-fill" style={{ width: `${overallPct}%`, background: overallPct === 100 ? 'var(--green)' : 'var(--blue)' }} />
      </div>

      <div className="page-container" style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>

        <h1 style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)', fontWeight: 400, marginBottom: 6, letterSpacing: '-0.02em' }}>
          Forensic Lab Readiness Assessment
        </h1>
        <p style={{ color: 'var(--gray5)', fontSize: 14, marginBottom: 22 }}>
          Complete all sections before submitting. Fields marked <span style={{ color: 'var(--red)' }}>*</span> are required.
        </p>

        {/* Lab info banner */}
        <div className="card" style={{
          marginBottom: 20, padding: 0, overflow: 'visible',
          borderTop: '3px solid var(--btn-primary-bg)',
        }}>
          <div className="lab-info-grid" style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1px 1fr 1px 1fr', gap: '0 20px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 6 }}>Applicant</p>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</p>
              <p style={{ color: 'var(--gray5)', fontSize: 12 }}>{user?.email}</p>
            </div>
            <div className="lab-info-divider" style={{ background: 'var(--gray2)', height: '100%' }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Laboratory Type<span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span></p>
              <select className="input" style={{ fontSize: 13, padding: '6px 10px' }}
                value={labType} onChange={e => setLabType(e.target.value)} required>
                <option value="">Select type…</option>
                {LAB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="lab-info-divider" style={{ background: 'var(--gray2)', height: '100%' }} />
            <div style={{ position: 'relative' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Scope / Specialisation <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span> </p>
              <CheckboxDropdown
                options={scopes}
                value={scope}
                onChange={setScope}
                placeholder="Select scopes…"
              />
            </div>
          </div>
        </div>

        {/* Overall progress card */}
        <div className="card" style={{ marginBottom: 22, padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Assessment Progress</p>
              <p style={{ fontSize: 12, color: 'var(--gray5)' }}>{completedCount} of {sections.length} sections complete</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {hasPreviousSubmission && (
                <button
                  className="btn btn-ghost"
                  onClick={() => handleDownloadPreviousReport(false)}
                  disabled={isGeneratingPreviousPDF}
                  style={{ fontSize: 13, padding: '5px 12px', border: '1px solid var(--blue)', color: 'var(--blue)' }}
                >
                  {isGeneratingPreviousPDF ? 'Generating…' : '📄 Download Previous Report'}
                </button>
              )}
              <span style={{
                background: overallPct === 100 ? 'var(--green-lt)' : 'var(--blue-lt)',
                color: overallPct === 100 ? 'var(--green)' : 'var(--blue)',
                borderRadius: 99, padding: '4px 14px', fontSize: 15, fontWeight: 700,
                fontFamily: 'var(--font-head)',
              }}>{overallPct}%</span>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{
              width: `${overallPct}%`,
              background: overallPct === 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--btn-primary-bg), var(--blue))',
            }} />
          </div>
        </div>

        {/* Previous submission restored banner */}

        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,.08), rgba(99,102,241,.08))',
          border: '1.5px solid rgba(59,130,246,.3)',
          borderRadius: 12, padding: '16px 22px', marginBottom: 22,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>

          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: 13, color: 'var(--gray5)' }}>
              Your earlier responses have been auto-filled. You can review, edit your answers, and resubmit, or download your previous report directly.
            </p>
          </div>

        </div>


        {/* All done banner */}
        {allDone && (
          <div className="allDone-banner" style={{
            background: 'var(--green-lt)', border: '1.5px solid rgba(5,150,105,.3)',
            borderRadius: 12, padding: '16px 22px', marginBottom: 22,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: 'var(--green)', marginBottom: 2 }}>All sections completed!</p>
              <p style={{ fontSize: 13, color: '#047857' }}>Review your answers and submit the readiness assessment.</p>
            </div>
            <button className="btn btn-success btn-lg" onClick={handleOpenPreview} disabled={submitting}>
              Submit Assessment →
            </button>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        {/* Two-column layout */}
        <div className="assessment-layout" style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>

          {/* ── Left: Section navigation sidebar ── */}
          <aside className="assessment-sidebar" style={{ width: 224, flexShrink: 0, position: 'sticky', top: 70 }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray4)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Sections</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: completedCount === sections.length ? 'var(--green)' : 'var(--blue)' }}>
                  {completedCount}/{sections.length}
                </span>
              </div>
              {sections.map((sec, i) => {
                const isActive = i === activeIdx;
                const isDone = sectionDone(sec);
                const qs = sectionQs(sec);
                const answered = qs.filter(q => answers[q.id] !== undefined).length;

                return (
                  <button key={sec}
                    onClick={() => setActiveIdx(i)}
                    className="sidebar-section-btn"
                    style={{
                      width: '100%', textAlign: 'left', padding: '10px 14px',
                      background: isActive ? 'var(--btn-primary-bg)' : isDone ? '#2bfb7d' : 'transparent',
                      border: 'none', borderBottom: '1px solid var(--gray2)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'background .15s', fontFamily: 'var(--font)',
                    }}
                    onMouseOver={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = isDone ? '#22e06e' : 'var(--gray0)';
                    }}
                    onMouseOut={e => {
                      if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = isDone ? '#2bfb7d' : 'transparent';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: isActive ? 600 : isDone ? 600 : 400, lineHeight: 1.35,
                        color: isActive ? '#fff' : isDone ? '#065f46' : 'var(--gray5)',
                        wordBreak: 'break-word',
                      }}>{sec}</p>
                      {qs.length > 0 && (
                        <p style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,.55)' : isDone ? '#047857' : 'var(--gray4)', marginTop: 2 }}>
                          {answered}/{qs.length} answered
                        </p>
                      )}
                    </div>
                    {isDone && !isActive && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {isActive && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,.7)', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Right: Question area ── */}
          <div ref={contentRef} className="assessment-content" style={{ flex: 1, minWidth: 0 }}>
            {/* Section header */}
            <div className="section-header" style={{ marginBottom: 0 }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>
                {currentSec}
              </span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>
                Section {activeIdx + 1} of {sections.length}
              </span>
            </div>

            {/* Questions wrapper */}
            <div style={{
              background: 'var(--white)', border: '1px solid var(--gray2)',
              borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
              padding: '22px 20px 20px',
            }}>
              {currentQs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray4)' }}>
                  <p style={{ fontSize: 15 }}>No questions in this section.</p>
                </div>
              ) : (
                currentQs.map((q, i) => {
                  const ans = answers[q.id];
                  const answered = ans !== undefined;
                  const isYes = ans === 'yes';

                  return (
                    <div key={q.id} className="question-card" style={{
                      background: answered ? 'var(--white)' : 'var(--white)',
                      border: `1px solid ${answered ? (isYes ? 'rgba(5,150,105,.3)' : 'rgba(220,38,38,.25)') : 'var(--gray2)'}`,
                      borderLeft: `3.5px solid ${answered ? (isYes ? 'var(--green)' : 'var(--red)') : 'var(--gray2)'}`,
                      borderRadius: 'var(--radius-lg)', marginBottom: 12, padding: '18px 20px',
                      transition: 'border-color .2s',
                      boxShadow: answered ? `0 0 0 3px ${isYes ? 'rgba(5,150,105,.06)' : 'rgba(220,38,38,.05)'}` : 'none',
                    }}>
                      {/* Question header */}
                      <div className="question-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.55, flex: 1 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 22, height: 22, borderRadius: 6,
                            background: 'var(--gray1)', color: 'var(--gray5)',
                            fontSize: 14, fontWeight: 700, marginRight: 8, verticalAlign: 'middle',
                          }}>{i + 1}</span>
                          {renderBoldText(q.question)}
                          <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>
                        </p>
                        {answered && (
                          <span style={{
                            background: isYes ? 'var(--green-lt)' : 'var(--red-lt)',
                            color: isYes ? 'var(--green)' : 'var(--red)',
                            border: `1px solid ${isYes ? 'rgba(5,150,105,.25)' : 'rgba(220,38,38,.25)'}`,
                            borderRadius: 6, padding: '2px 8px', fontSize: 14, fontWeight: 600, flexShrink: 0,
                          }}>✓ Answered</span>
                        )}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <p style={{ fontSize: 14, color: 'var(--gray5)', marginBottom: 14, lineHeight: 1.65, paddingLeft: 30, fontStyle: 'italic' }}>
                          {renderBoldText(q.explanation)}
                        </p>
                      )}

                      {/* Yes / No pills */}
                      <div style={{ display: 'flex', gap: 8, paddingLeft: 2, flexWrap: 'wrap' }}>
                        {(['yes', 'no'] as const).map(opt => {
                          const selected = ans === opt;
                          const color = opt === 'yes' ? 'var(--green)' : 'var(--red)';
                          const bg = opt === 'yes' ? 'rgba(5,150,105,.07)' : 'rgba(220,38,38,.06)';
                          return (
                            <label key={opt} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              cursor: 'pointer', padding: '8px 20px', borderRadius: 10,
                              border: `1.5px solid ${selected ? color : 'var(--gray2)'}`,
                              background: selected ? bg : 'var(--white)',
                              transition: 'all .18s', userSelect: 'none', minWidth: 90,
                            }}>
                              <input type="radio" name={`q-${q.id}`} value={opt}
                                checked={selected} onChange={() => handleAnswer(q.id, opt)}
                                style={{ display: 'none' }} />
                              <div style={{
                                width: 18, height: 18, borderRadius: '50%',
                                border: `2px solid ${selected ? color : 'var(--gray3)'}`,
                                background: selected ? color : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, transition: 'all .18s',
                              }}>
                                {selected && opt === 'yes' && (
                                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                    <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                                {selected && opt === 'no' && (
                                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                    <line x1="3" y1="3" x2="9" y2="9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                                    <line x1="9" y1="3" x2="3" y2="9" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                                  </svg>
                                )}
                              </div>
                              <span style={{
                                fontSize: 13, fontWeight: selected ? 700 : 400,
                                color: selected ? color : 'var(--gray5)',
                              }}>{opt === 'yes' ? 'Yes' : 'No'}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Section footer */}
              <div className="section-footer" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--gray2)', flexWrap: 'wrap', gap: 10,
              }}>
                <button onClick={handleClearSection}
                  style={{
                    background: 'transparent', border: '1.5px solid rgba(220,38,38,.4)',
                    color: 'var(--red)', borderRadius: 9, padding: '8px 16px',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)',
                  }}>
                  Clear Section
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  {activeIdx > 0 && (
                    <button className="btn btn-ghost" onClick={() => setActiveIdx(i => i - 1)}>
                      ← Previous
                    </button>
                  )}
                  {!isLastSection ? (
                    <button
                      onClick={() => currentDone && setActiveIdx(i => i + 1)}
                      disabled={!currentDone}
                      title={!currentDone ? 'Answer all questions to continue' : ''}
                      style={{
                        background: currentDone ? 'var(--green)' : 'var(--gray2)',
                        color: currentDone ? '#fff' : 'var(--gray4)',
                        border: 'none', borderRadius: 9, padding: '9px 28px',
                        fontSize: 14, fontWeight: 600, cursor: currentDone ? 'pointer' : 'not-allowed',
                        fontFamily: 'var(--font)', transition: 'background .2s',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      Next →
                    </button>
                  ) : (
                    <button className="btn btn-success btn-lg" onClick={handleOpenPreview}
                      disabled={submitting || !allDone}>
                      ✓ Submit Assessment
                    </button>
                  )}
                </div>
              </div>

              {!currentDone && (
                <p style={{ marginTop: 10, fontSize: 12, color: 'var(--amber)', textAlign: 'right' }}>
                  ⚠ Answer all {currentQs.length} questions to enable Next.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Preview Modal Pop-up ─────────────────────────────────────────────── */}
      {showPreview && (
        <div className="modal-backdrop" style={{ zIndex: 1000, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)' }}>
          <div
            className="modal fade-up"
            style={{
              maxWidth: 850,
              width: '95%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'var(--btn-primary-bg)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h2 style={{ fontSize: 20, color: '#fff', margin: 0, fontWeight: 700 }}>
                  Assessment Response Preview
                </h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>
                  Review all questions and your answers before final submission
                </p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#fff',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close Preview"
              >
                ✕
              </button>
            </div>

            {/* Summary Row */}
            <div
              style={{
                padding: '14px 24px',
                background: 'var(--gray0)',
                borderBottom: '1px solid var(--gray2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray2)' }}>
                <p style={{ fontSize: 11, color: 'var(--gray4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Applicant</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: 'var(--gray5)', margin: 0 }}>{user?.email}</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray2)' }}>
                <p style={{ fontSize: 11, color: 'var(--gray4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Laboratory Type</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{labType}</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray2)' }}>
                <p style={{ fontSize: 11, color: 'var(--gray4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Scope / Specialisation</p>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text)' }}>{scope.join(', ')}</p>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--gray2)' }}>
                <p style={{ fontSize: 11, color: 'var(--gray4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Compliance Score</p>
                <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: overallPct === 100 ? 'var(--green)' : 'var(--amber)' }}>
                  {Object.values(answers).filter(a => a === 'yes').length} / {totalQs} ({overallPct}%)
                </p>
              </div>
            </div>

            {/* Questions & Responses List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {sections.map(sec => {
                const secQs = sectionQs(sec);
                if (secQs.length === 0) return null;
                return (
                  <div key={sec} style={{ marginBottom: 24 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--btn-primary-bg)',
                        paddingBottom: 6,
                        borderBottom: '2px solid var(--btn-primary-bg)',
                        marginBottom: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '.04em',
                      }}
                    >
                      {sec} ({secQs.length} Questions)
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {secQs.map((q, idx) => {
                        const ans = answers[q.id];
                        const isYes = ans === 'yes';
                        return (
                          <div
                            key={q.id}
                            style={{
                              padding: '12px 16px',
                              borderRadius: 8,
                              background: 'var(--bg-card)',
                              border: `1px solid ${isYes ? 'rgba(5,150,105,.25)' : 'rgba(220,38,38,.25)'}`,
                              borderLeft: `4px solid ${isYes ? 'var(--green)' : 'var(--red)'}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: 16,
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                                <span style={{ color: 'var(--gray4)', marginRight: 6 }}>Q{idx + 1}.</span>
                                {renderBoldText(q.question)}
                              </p>
                              {q.explanation && (
                                <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '4px 0 0', fontStyle: 'italic' }}>
                                  {renderBoldText(q.explanation)}
                                </p>
                              )}
                            </div>
                            <div
                              style={{
                                padding: '4px 12px',
                                borderRadius: 6,
                                fontSize: 13,
                                fontWeight: 700,
                                background: isYes ? 'var(--green-lt)' : 'var(--red-lt)',
                                color: isYes ? 'var(--green)' : 'var(--red)',
                                border: `1px solid ${isYes ? 'rgba(5,150,105,.3)' : 'rgba(220,38,38,.3)'}`,
                                flexShrink: 0,
                              }}
                            >
                              {isYes ? '✓ YES' : '✕ NO'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                background: 'var(--gray0)',
                borderTop: '1px solid var(--gray2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--gray5)', margin: 0 }}>
                Need to change any response? Click <strong>Edit Answers</strong> to return.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowPreview(false)}
                  disabled={submitting}
                  style={{ fontSize: 14, padding: '9px 18px' }}
                >
                  ✏️ Edit Answers
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  style={{ fontSize: 14, padding: '9px 22px', fontWeight: 600 }}
                >
                  {submitting ? 'Submitting…' : '✓ Final Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}