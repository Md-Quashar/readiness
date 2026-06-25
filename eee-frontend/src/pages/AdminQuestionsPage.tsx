import { useEffect, useState } from 'react';
import { questionsAPI, sectionsAPI, scopesAPI } from '../api';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import type { Question, Section, Scope } from '../types';
import { CSVLink } from 'react-csv';
import Papa from "papaparse";

const EMPTY: Partial<Question> = {
  question: '', explanation: '',
  question_section: '', feedback_for_yes: '', feedback_for_no: '',
  guidance: '', is_active: true,
};

const Field = ({ label, name, form, onChange, as = 'input', type = 'text', options = [], rows = 3 }: {
  label: string; name: string; form: Partial<Question>; onChange: (name: string, value: any) => void;
  as?: string; type?: string; options?: string[]; rows?: number;
}) => (
  <div className="form-group">
    <label className="label">{label}</label>
    {as === 'textarea' ? (
      <RichTextEditor
        value={(form as any)[name] || ''}
        onChange={val => onChange(name, val)}
        rows={rows}
        placeholder={`Enter ${label.toLowerCase().replace(' *', '')}…`}
      />
    ) : as === 'select' ? (
      <select className="input" value={(form as any)[name] || ''}
        onChange={e => onChange(name, e.target.value)}>
        <option value="">Select…</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : type === 'checkbox' ? (
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: 14 }}>
        <input type="checkbox" checked={!!(form as any)[name]}
          onChange={e => onChange(name, e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--navy)' }} />
        <span style={{ color: 'var(--gray6)' }}>Active (visible to applicants)</span>
      </label>
    ) : (
      <input className="input" type={type}
        value={(form as any)[name] || ''}
        onChange={e => onChange(name, e.target.value)} />
    )}
  </div>
);

const headers = [
  { label: 'Question', key: 'question' },
  { label: 'Section', key: 'question_section' },
  { label: 'Explanation', key: 'explanation' },
  { label: 'Feedback for yes', key: 'feedback_for_yes' },
  { label: 'Feedback for no', key: 'feedback_for_no' },
  { label: 'Guidance', key: 'guidance' },
  { label: 'Active', key: 'is_active' },
];

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSec, setFilterSec] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<Partial<Question>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  // Sections management states
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [secErr, setSecErr] = useState('');
  const [secSaving, setSecSaving] = useState(false);

  // Scopes management states
  const [showScopesModal, setShowScopesModal] = useState(false);
  const [newScopeName, setNewScopeName] = useState('');
  const [editingScopeId, setEditingScopeId] = useState<number | null>(null);
  const [editingScopeName, setEditingScopeName] = useState('');
  const [scopeErr, setScopeErr] = useState('');
  const [scopeSaving, setScopeSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      questionsAPI.getActive(),
      sectionsAPI.getAll(),
      scopesAPI.getAll()
    ]).then(([qRes, sRes, scRes]) => {
      setQuestions(qRes.data);
      setSections(sRes.data.sections || []);
      setScopes(scRes.data.scopes || []);
    }).catch(e => {
      console.error(e);
      setErr('Failed to load data.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErr(''); setShowModal(true); };
  const openEdit = (q: Question) => { setEditing(q); setForm({ ...q }); setErr(''); setShowModal(true); };


  const csvhandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        // Map CSV header labels → API field names
        const labelToKey: Record<string, string> = {
          'Question': 'question',
          'Section': 'question_section',
          'Explanation': 'explanation',
          'Feedback for yes': 'feedback_for_yes',
          'Feedback for no': 'feedback_for_no',
          'Guidance': 'guidance',
          'Active': 'is_active',
        };

        const rows = (results.data as Record<string, string>[])
          .map(row => {
            const mapped: Record<string, any> = {};
            for (const [csvHeader, value] of Object.entries(row)) {
              const apiKey = labelToKey[csvHeader] || csvHeader;
              mapped[apiKey] = value;
            }
            // Convert is_active string → boolean
            if (typeof mapped.is_active === 'string') {
              mapped.is_active = mapped.is_active.toLowerCase() === 'true';
            }
            // Default question_type if missing
            if (!mapped.question_type) {
              mapped.question_type = 'yes_no';
            }
            return mapped;
          })
          .filter(row => row.question && row.question.trim() !== '');

        if (rows.length === 0) {
          setErr('CSV contains no valid questions.');
          return;
        }

        setSaving(true);
        setErr('');
        try {
          for (const row of rows) {
            await questionsAPI.create(row as Partial<Question>);
          }
          showToast(`${rows.length} question(s) imported successfully!`);
          load();
        } catch (err: any) {
          const d = err.response?.data;
          setErr(typeof d === 'string' ? d : JSON.stringify(d));
        } finally {
          setSaving(false);
          // Reset file input so the same file can be re-uploaded
          e.target.value = '';
        }
      },
    });
  }
  const handleSave = async () => {
    if (!form.question?.trim()) { setErr('Question text is required.'); return; }
    setSaving(true); setErr('');
    try {
      if (editing) { await questionsAPI.update({ ...form, id: editing.id } as any); showToast('Question updated.'); }
      else { await questionsAPI.create(form); showToast('Question created.'); }
      setShowModal(false); load();
    } catch (e: any) {
      const d = e.response?.data;
      setErr(typeof d === 'string' ? d : JSON.stringify(d));
    } finally { setSaving(false); }
  };

  const handleToggle = async (q: Question) => {
    await questionsAPI.toggleActive(q.id);
    setQuestions(p => p.map(x => x.id === q.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;
    setSecSaving(true);
    setSecErr('');
    try {
      await sectionsAPI.create(newSectionName.trim());
      setNewSectionName('');
      const sRes = await sectionsAPI.getAll();
      setSections(sRes.data.sections || []);
      showToast('Section created successfully.');
    } catch (e: any) {
      setSecErr(e.response?.data?.error || 'Failed to create section.');
    } finally {
      setSecSaving(false);
    }
  };

  const handleUpdateSection = async (id: number) => {
    if (!editingSectionName.trim()) return;
    setSecSaving(true);
    setSecErr('');
    try {
      await sectionsAPI.update(id, editingSectionName.trim());
      setEditingSectionId(null);
      setEditingSectionName('');
      const sRes = await sectionsAPI.getAll();
      setSections(sRes.data.sections || []);
      showToast('Section updated successfully.');
    } catch (e: any) {
      setSecErr(e.response?.data?.error || 'Failed to update section.');
    } finally {
      setSecSaving(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    setSecSaving(true);
    setSecErr('');
    try {
      await sectionsAPI.delete(id);
      const sRes = await sectionsAPI.getAll();
      setSections(sRes.data.sections || []);
      showToast('Section deleted successfully.');
    } catch (e: any) {
      setSecErr(e.response?.data?.error || 'Failed to delete section.');
    } finally {
      setSecSaving(false);
    }
  };

  const handleCreateScope = async () => {
    if (!newScopeName.trim()) return;
    setScopeSaving(true);
    setScopeErr('');
    try {
      await scopesAPI.create(newScopeName.trim());
      setNewScopeName('');
      const scRes = await scopesAPI.getAll();
      setScopes(scRes.data.scopes || []);
      showToast('Scope created successfully.');
    } catch (e: any) {
      setScopeErr(e.response?.data?.error || 'Failed to create scope.');
    } finally {
      setScopeSaving(false);
    }
  };

  const handleUpdateScope = async (id: number) => {
    if (!editingScopeName.trim()) return;
    setScopeSaving(true);
    setScopeErr('');
    try {
      await scopesAPI.update(id, editingScopeName.trim());
      setEditingScopeId(null);
      setEditingScopeName('');
      const scRes = await scopesAPI.getAll();
      setScopes(scRes.data.scopes || []);
      showToast('Scope updated successfully.');
    } catch (e: any) {
      setScopeErr(e.response?.data?.error || 'Failed to update scope.');
    } finally {
      setScopeSaving(false);
    }
  };

  const handleDeleteScope = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this scope?')) return;
    setScopeSaving(true);
    setScopeErr('');
    try {
      await scopesAPI.delete(id);
      const scRes = await scopesAPI.getAll();
      setScopes(scRes.data.scopes || []);
      showToast('Scope deleted successfully.');
    } catch (e: any) {
      setScopeErr(e.response?.data?.error || 'Failed to delete scope.');
    } finally {
      setScopeSaving(false);
    }
  };


  const filtered = questions.filter(q => {
    const s = q.question.toLowerCase().includes(search.toLowerCase());
    const f = filterSec ? q.question_section === filterSec : true;
    return s && f;
  });

  const handleFieldChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <Navbar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 70, right: 24, zIndex: 300,
          background: '#0f2557', color: '#fff',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          fontSize: 14, fontWeight: 500,
          boxShadow: 'var(--shadow-lg)', animation: 'fadeUp .2s ease',
        }}>{toast}</div>
      )}

      <div className="page-container fade-up" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>
        {/* ── Page Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>Question Bank</h1>
            <p style={{ color: 'var(--gray5)', fontSize: 14, marginTop: 4 }}>
              {questions.length} total · {questions.filter(q => q.is_active).length} active
            </p>
          </div>
        </div>

        {/* ── Actions Card ── */}
        <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--gray4)', marginBottom: 16 }}>Actions</p>
          <div className="action-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* 1 ── Create New Question */}
            <div style={{
              border: '1.5px solid var(--gray2)', borderRadius: 'var(--radius)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--white)', flexWrap: 'wrap'
            }} className="action-card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--green)', flexShrink: 0
                }}>✏️</span>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>Create Question</h4>
                  <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    Add a single self-assessment question with guidance details.
                  </p>
                </div>
              </div>
              <button className="btn btn-success" style={{ minWidth: '160px', height: '38px', fontWeight: 600, justifyContent: 'center', display: 'inline-flex', alignItems: 'center' }} onClick={openCreate}>
                + Create Question
              </button>
            </div>

            {/* 2 ── Export to CSV */}
            <div style={{
              border: '1.5px solid var(--gray2)', borderRadius: 'var(--radius)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--white)', flexWrap: 'wrap'
            }} className="action-card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--green)', flexShrink: 0
                }}>📥</span>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>Export to CSV</h4>
                  <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    Download the complete question bank as a .csv file.
                  </p>
                </div>
              </div>
              <CSVLink
                data={questions}
                headers={headers}
                filename={'questions.csv'}
                className="btn btn-success"
                style={{ minWidth: '160px', height: '38px', fontWeight: 600, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#fff' }}
              >
                ↓ Download CSV
              </CSVLink>
            </div>

            {/* 3 ── Upload CSV */}
            <div style={{
              border: '1.5px solid var(--gray2)', borderRadius: 'var(--radius)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--white)', flexWrap: 'wrap'
            }} className="action-card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--green)', flexShrink: 0
                }}>📤</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>Import from CSV</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '2px 0 0', lineHeight: 1.4 }}>
                      Upload a .csv file to bulk-import multiple questions.
                    </p>
                    {saving && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--green)' }}>
                        <div className="spinner spinner-sm" /> Importing…
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <label className="btn btn-success" style={{
                minWidth: '160px', height: '38px', fontWeight: 600, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', margin: 0, color: '#fff'
              }}>
                ↑ Choose CSV File
                <input type="file" accept=".csv" onChange={csvhandler} style={{ display: 'none' }} />
              </label>
            </div>

            {/* 4 ── Manage Sections */}
            <div style={{
              border: '1.5px solid var(--gray2)', borderRadius: 'var(--radius)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--white)', flexWrap: 'wrap'
            }} className="action-card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--green)', flexShrink: 0
                }}>🗂️</span>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>Manage Section</h4>
                  <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    Create, edit, and delete dynamic question sections.
                  </p>
                </div>
              </div>
              <button className="btn btn-success" style={{ minWidth: '160px', height: '38px', fontWeight: 600, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', paddingLeft: '0px', paddingRight: '0px' }} onClick={() => { setShowSectionsModal(true); setSecErr(''); }}>
                ⚙️ Manage Section
              </button>
            </div>

            {/* 5 ── Manage Scopes */}
            <div style={{
              border: '1.5px solid var(--gray2)', borderRadius: 'var(--radius)',
              padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 16, background: 'var(--white)', flexWrap: 'wrap'
            }} className="action-card-hover">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 300px' }}>
                <span style={{
                  width: 40, height: 40, borderRadius: 'var(--radius)',
                  background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, color: 'var(--green)', flexShrink: 0
                }}>🎯</span>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', margin: 0 }}>Manage Scope</h4>
                  <p style={{ fontSize: 12, color: 'var(--gray5)', margin: '2px 0 0', lineHeight: 1.4 }}>
                    Create, edit, and delete dynamic assessment validation scopes.
                  </p>
                </div>
              </div>
              <button className="btn btn-success" style={{ minWidth: '160px', height: '38px', fontWeight: 600, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', paddingLeft: '0px', paddingRight: '0px' }} onClick={() => { setShowScopesModal(true); setScopeErr(''); }}>
                ⚙️ Manage Scope
              </button>
            </div>

          </div>
          {err && <div className="alert alert-error" style={{ marginTop: 16 }}>{err}</div>}
        </div>


        {/* Filters */}
        <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
          <div className="filter-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="label">Search</label>
              <input className="input" placeholder="Search questions…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div>
              <label className="label">Filter by Section</label>
              <select className="input" value={filterSec} onChange={e => setFilterSec(e.target.value)}>
                <option value="">All sections</option>
                {sections.map(s => <option key={s.id} value={s.sectionName}>{s.sectionName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>ID</th>
                  <th>Question</th>
                  <th>Section</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray4)', padding: '40px 0', fontSize: 14 }}>
                    No questions found.
                  </td></tr>
                )}
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600, color: 'var(--gray4)', fontSize: 12 }}>#{q.id}</td>
                    <td style={{ maxWidth: 360 }}>
                      <p style={{ fontWeight: 500, lineHeight: 1.4, fontSize: 14 }}>
                        {q.question.length > 85 ? q.question.slice(0, 85) + '…' : q.question}
                      </p>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray5)', maxWidth: 140 }}>
                      {q.question_section || '—'}
                    </td>

                    <td>
                      <span className={`badge ${q.is_active ? 'badge-green' : 'badge-red'}`}>
                        {q.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => openEdit(q)}>Edit</button>
                        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => handleToggle(q)}>
                          {q.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18 }}>{editing ? 'Edit Question' : 'Create Question'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--gray4)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {err && <div className="alert alert-error">{err}</div>}

            <Field label="Section" name="question_section" form={form} onChange={handleFieldChange} as="select" options={sections.map(s => s.sectionName)} />
            <Field label="Question Text *" name="question" form={form} onChange={handleFieldChange} as="textarea" />
            <Field label="Explanation / Context" name="explanation" form={form} onChange={handleFieldChange} as="textarea" />
            <Field label="Feedback when answer is Yes" name="feedback_for_yes" form={form} onChange={handleFieldChange} as="textarea" />
            <Field label="Feedback when answer is No" name="feedback_for_no" form={form} onChange={handleFieldChange} as="textarea" />
            <Field label="Guidance / Reference" name="guidance" form={form} onChange={handleFieldChange} as="textarea" rows={6} />
            <Field label="" name="is_active" form={form} onChange={handleFieldChange} type="checkbox" />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Question' : 'Create Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections CRUD Modal */}
      {showSectionsModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowSectionsModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18 }}>Manage Sections</h3>
              <button onClick={() => setShowSectionsModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--gray4)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {secErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{secErr}</div>}

            {/* Add Section Form */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="New section name…"
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                disabled={secSaving}
              />
              <button
                className="btn btn-primary"
                onClick={handleCreateSection}
                disabled={secSaving || !newSectionName.trim()}
              >
                Add
              </button>
            </div>

            {/* Sections List */}
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--gray2)', borderRadius: 'var(--radius)' }}>
              {sections.length === 0 ? (
                <p style={{ padding: 16, textAlign: 'center', color: 'var(--gray4)', fontSize: 14 }}>No sections found.</p>
              ) : (
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>ID</th>
                      <th>Section Name</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map(sec => (
                      <tr key={sec.id}>
                        <td>#{sec.id}</td>
                        <td>
                          {editingSectionId === sec.id ? (
                            <input
                              className="input"
                              style={{ padding: '4px 8px', fontSize: 13 }}
                              value={editingSectionName}
                              onChange={e => setEditingSectionName(e.target.value)}
                            />
                          ) : (
                            <span style={{ fontSize: 14 }}>{sec.sectionName}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {editingSectionId === sec.id ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-success"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => handleUpdateSection(sec.id)}
                                disabled={secSaving || !editingSectionName.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => { setEditingSectionId(null); setEditingSectionName(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => { setEditingSectionId(sec.id); setEditingSectionName(sec.sectionName); }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11, color: 'var(--red)' }}
                                onClick={() => handleDeleteSection(sec.id)}
                                disabled={secSaving}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowSectionsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Scopes CRUD Modal */}
      {showScopesModal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowScopesModal(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18 }}>Manage Scopes</h3>
              <button onClick={() => setShowScopesModal(false)} style={{ background: 'none', border: 'none', fontSize: 24, color: 'var(--gray4)', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {scopeErr && <div className="alert alert-error" style={{ marginBottom: 12 }}>{scopeErr}</div>}

            {/* Add Scope Form */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                placeholder="New scope name…"
                value={newScopeName}
                onChange={e => setNewScopeName(e.target.value)}
                disabled={scopeSaving}
              />
              <button
                className="btn btn-primary"
                onClick={handleCreateScope}
                disabled={scopeSaving || !newScopeName.trim()}
              >
                Add
              </button>
            </div>

            {/* Scopes List */}
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--gray2)', borderRadius: 'var(--radius)' }}>
              {scopes.length === 0 ? (
                <p style={{ padding: 16, textAlign: 'center', color: 'var(--gray4)', fontSize: 14 }}>No scopes found.</p>
              ) : (
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>ID</th>
                      <th>Scope Name</th>
                      <th style={{ width: 120, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopes.map(sc => (
                      <tr key={sc.id}>
                        <td>#{sc.id}</td>
                        <td>
                          {editingScopeId === sc.id ? (
                            <input
                              className="input"
                              style={{ padding: '4px 8px', fontSize: 13 }}
                              value={editingScopeName}
                              onChange={e => setEditingScopeName(e.target.value)}
                            />
                          ) : (
                            <span style={{ fontSize: 14 }}>{sc.scope}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {editingScopeId === sc.id ? (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-success"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => handleUpdateScope(sc.id)}
                                disabled={scopeSaving || !editingScopeName.trim()}
                              >
                                Save
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => { setEditingScopeId(null); setEditingScopeName(''); }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11 }}
                                onClick={() => { setEditingScopeId(sc.id); setEditingScopeName(sc.scope); }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '2px 8px', fontSize: 11, color: 'var(--red)' }}
                                onClick={() => handleDeleteScope(sc.id)}
                                disabled={scopeSaving}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={() => setShowScopesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
