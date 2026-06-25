import { useEffect, useState } from 'react';
import { authAPI, responsesAPI, questionsAPI } from '../api';
import Navbar from '../components/Navbar';
import { generatePDFReport } from '../utils/pdfReport';
import type { User, Question } from '../types';

interface ApplicantRow extends User {
  responses?: any[];
  yesCount?: number;
  noCount?: number;
  score?: number;
}




export default function AdminAssessmentsPage() {
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApplicantRow | null>(null);
  const [detail, setDetail] = useState<any[]>([]);
  const [loadDetail, setLoadDetail] = useState(false);
  const [search, setSearch] = useState('');

  // DRF may return paginated { results:[] } or a plain array — handle both
  const toArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, qRes] = await Promise.all([authAPI.getAllUsers(), questionsAPI.getAll()]);
        console.log("uRes", uRes)
        console.log("qRes", qRes)

        setQuestions(toArray(qRes.data));
        const apps: User[] = toArray(uRes.data).filter((u: User) => u.role === 'applicant');

        const enriched = await Promise.all(apps.map(async u => {
          try {
            const r = await responsesAPI.getUserResponses(u.id);
            const responses = r.data;
            const yesCount = responses.filter((x: any) => x.answer === 'yes').length;
            const total = responses.length;
            return { ...u, responses, yesCount, noCount: total - yesCount, score: total ? Math.round(yesCount / total * 100) : undefined };
          } catch { return { ...u, responses: [], yesCount: 0, noCount: 0 }; }
        }));
        setApplicants(enriched);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const openDetail = async (u: ApplicantRow) => {
    setSelected(u); setLoadDetail(true);
    try {
      const r = await responsesAPI.getUserResponses(u.id);
      setDetail(r.data);
    } catch { setDetail([]); }
    finally { setLoadDetail(false); }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete ALL responses for this applicant?')) return;
    await responsesAPI.deleteUserResponses(userId);
    setApplicants(p => p.map(u => u.id === userId ? { ...u, responses: [], yesCount: 0, noCount: 0, score: undefined } : u));
    if (selected?.id === userId) { setSelected(null); setDetail([]); }
  };

  const handlePDF = async (u: ApplicantRow, printerFriendly = false) => {
    const resp = u.responses || [];
    await generatePDFReport({
      applicantName: u.name, applicantEmail: u.email,
      labType: resp[0]?.lab_type || '', scope: resp[0]?.scope || '',
      questions, responses: resp, printerFriendly,
    });
  };

  const ScorePill = ({ score }: { score?: number }) => {
    if (score == null) return <span style={{ color: 'var(--gray4)', fontSize: 13 }}>—</span>;
    const color = score >= 80 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
    const bg = score >= 80 ? 'var(--green-lt)' : score >= 50 ? 'var(--amber-lt)' : 'var(--red-lt)';
    return <span style={{ background: bg, color, borderRadius: 99, padding: '2px 10px', fontSize: 13, fontWeight: 700 }}>{score}%</span>;
  };

  const filtered = applicants.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      <div className="page-container fade-up" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
            Submitted Assessments
          </h1>
          <p style={{ color: 'var(--gray5)', fontSize: 14, marginTop: 4 }}>
            {applicants.filter(u => (u.responses?.length || 0) > 0).length} applicants with responses
          </p>
        </div>

        <div className="admin-split-grid" style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>

          {/* Left: applicant list */}
          <div>
            <div style={{ marginBottom: 14 }}>
              <input className="input" placeholder="Search applicants…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Applicant</th><th>Score</th><th>Responses</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray4)', padding: '36px 0', fontSize: 14 }}>No applicants found.</td></tr>
                    )}
                    {filtered.map(u => (
                      <tr key={u.id} style={{ background: selected?.id === u.id ? 'var(--blue-lt)' : undefined }}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray5)', marginTop: 1 }}>{u.email}</div>
                        </td>
                        <td><ScorePill score={u.score} /></td>
                        <td style={{ fontSize: 13, color: 'var(--gray5)' }}>
                          {u.responses?.length ?? 0}
                          {(u.responses?.length ?? 0) > 0 && (
                            <span style={{ fontSize: 11, marginLeft: 5, color: 'var(--gray4)' }}>
                              ({u.yesCount}✓ {u.noCount}✗)
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={!u.responses?.length} onClick={() => openDetail(u)}>View</button>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={!u.responses?.length} onClick={() => handlePDF(u)}>PDF</button>
                            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={!u.responses?.length} onClick={() => handlePDF(u, true)}>B&W</button>
                            <button className="btn btn-danger" style={{ fontSize: 12, padding: '4px 10px' }}
                              disabled={!u.responses?.length} onClick={() => handleDelete(u.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: detail panel */}
          {selected && (
            <div>
              {/* Detail header */}
              <div className="card" style={{ marginBottom: 16, borderTop: '3px solid var(--navy)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 17, marginBottom: 4 }}>{selected.name}</h3>
                    <p style={{ color: 'var(--gray5)', fontSize: 13, marginBottom: 10 }}>{selected.email}</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <ScorePill score={selected.score} />
                      {detail[0]?.lab_type && <span className="badge badge-navy">{detail[0].lab_type}</span>}
                      {detail[0]?.scope && <span className="badge badge-blue">{detail[0].scope}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ fontSize: 13, padding: '7px 14px' }}
                      onClick={() => handlePDF(selected)}>⬇ PDF</button>
                    <button className="btn btn-ghost" style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--gray3)' }}
                      onClick={() => handlePDF(selected, true)}>🖨 B&W</button>
                    <button onClick={() => setSelected(null)}
                      style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--gray4)', cursor: 'pointer', lineHeight: 1 }}>×</button>
                  </div>
                </div>
              </div>

              {/* Response list */}
              <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: 2 }}>
                {loadDetail ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
                ) : detail.map(resp => {
                  const q = questions.find(x => x.id === resp.question);
                  if (!q) return null;
                  const isYes = resp.answer === 'yes';
                  return (
                    <div key={resp.id} style={{
                      background: 'var(--white)',
                      border: `1px solid ${isYes ? 'rgba(5,150,105,.2)' : 'rgba(220,38,38,.2)'}`,
                      borderLeft: `3px solid ${isYes ? 'var(--green)' : 'var(--red)'}`,
                      borderRadius: 'var(--radius-lg)', marginBottom: 10, padding: '14px 16px',
                    }}>
                      <p style={{ fontWeight: 500, fontSize: 13, lineHeight: 1.45, marginBottom: 8 }}>{q.question}</p>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span className={`badge ${isYes ? 'badge-green' : 'badge-red'}`}>{resp.answer.toUpperCase()}</span>
                        <span style={{ fontSize: 11, color: 'var(--gray4)' }}>{q.question_section}</span>
                      </div>
                      {(isYes ? q.feedback_for_yes : q.feedback_for_no) && (
                        <div style={{
                          padding: '8px 12px', borderRadius: 'var(--radius)',
                          background: isYes ? 'var(--green-lt)' : 'var(--red-lt)',
                          fontSize: 12, color: isYes ? 'var(--green)' : 'var(--red)',
                          lineHeight: 1.5,
                        }}>
                          {isYes ? q.feedback_for_yes : q.feedback_for_no}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
