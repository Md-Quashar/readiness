import { useEffect, useState } from 'react';
import { authAPI, responsesAPI } from '../api';
import Navbar from '../components/Navbar';
import type { User, ActivityLog, Response as UserResponse } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function AdminMonitoringPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [responses, setResponses] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState<'users' | 'feed'>('users');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [logRes, userRes, respRes] = await Promise.all([
          authAPI.getActivityLogs(),
          authAPI.getAllUsers(),
          responsesAPI.getAllResponses()
        ]);
        setLogs(logRes.data || []);
        setUsers(userRes.data || []);
        setResponses(respRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  // ─── Stats Calculations ───────────────────────────────────────────────────────
  const applicants = users.filter(u => u.role === 'applicant');
  const totalLogins = logs.filter(l => l.activity_type === 'login_success').length;
  const failedLogins = logs.filter(l => l.activity_type === 'login_failed').length;
  const totalSubmissions = logs.filter(
    l => l.activity_type === 'submission' || l.activity_type === 'submission_single' || l.activity_type === 'submission_bulk'
  ).length;

  // ─── User Monitoring List ─────────────────────────────────────────────────────
  const userMonitoringList = applicants.map(u => {
    const userLogs = logs.filter(l => l.user_email === u.email);

    // Last login details
    const loginLogs = userLogs.filter(l => l.activity_type === 'login_success');
    const lastLogin = loginLogs.length > 0 ? loginLogs[0] : null;

    // Last submission details
    const submissionLogs = userLogs.filter(
      l => l.activity_type === 'submission' || l.activity_type === 'submission_single' || l.activity_type === 'submission_bulk'
    );
    const lastSubmission = submissionLogs.length > 0 ? submissionLogs[0] : null;

    // Total responses submitted
    const userResponses = responses.filter(r => r.user === u.email);

    return {
      ...u,
      lastLoginTime: lastLogin ? lastLogin.created_at : null,
      lastLoginIp: lastLogin ? lastLogin.ip_address : null,
      lastSubmissionTime: lastSubmission ? lastSubmission.created_at : null,
      lastSubmissionIp: lastSubmission ? lastSubmission.ip_address : null,
      submissionCount: userResponses.length
    };
  });

  // ─── Recharts Data Preparation ────────────────────────────────────────────────
  const getTimelineData = () => {
    const now = new Date();
    const days: Record<string, { date: string; Logins: number; Submissions: number; Other: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const k = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      days[k] = { date: k, Logins: 0, Submissions: 0, Other: 0 };
    }
    logs.forEach(l => {
      const k = new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (k in days) {
        if (l.activity_type === 'login_success') {
          days[k].Logins++;
        } else if (l.activity_type.startsWith('submission')) {
          days[k].Submissions++;
        } else {
          days[k].Other++;
        }
      }
    });
    return Object.values(days);
  };
  const chartData = getTimelineData();

  // ─── Activity Log Filtering ───────────────────────────────────────────────────
  const getFilteredLogs = () => {
    return logs.filter(log => {
      const matchesSearch =
        log.user_email.toLowerCase().includes(search.toLowerCase()) ||
        log.user_name.toLowerCase().includes(search.toLowerCase());

      let matchesType = true;
      if (filterType === 'login_success') {
        matchesType = log.activity_type === 'login_success';
      } else if (filterType === 'login_failed') {
        matchesType = log.activity_type === 'login_failed';
      } else if (filterType === 'submissions') {
        matchesType = log.activity_type === 'submission' || log.activity_type === 'submission_single' || log.activity_type === 'submission_bulk';
      } else if (filterType === 'questions') {
        matchesType = log.activity_type.startsWith('question_');
      } else if (filterType === 'resets') {
        matchesType = log.activity_type === 'password_reset';
      }

      return matchesSearch && matchesType;
    });
  };
  const filteredLogs = getFilteredLogs();

  // ─── Formatting helpers ───────────────────────────────────────────────────────
  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'login_success':
        return { label: 'Login Success', color: 'var(--green)', bg: 'var(--green-lt)' };
      case 'login_failed':
        return { label: 'Login Failed', color: 'var(--red)', bg: 'var(--red-lt)' };
      case 'submission':
        return { label: 'Submission', color: 'var(--blue)', bg: 'var(--blue-lt)' };
      case 'submission_single':
        return { label: 'Single Submission (Legacy)', color: 'var(--blue)', bg: 'var(--blue-lt)' };
      case 'submission_bulk':
        return { label: 'Bulk Submission (Legacy)', color: 'var(--purple)', bg: 'rgba(124, 58, 237, 0.15)' };
      case 'password_reset':
        return { label: 'Password Reset', color: 'var(--amber)', bg: 'var(--amber-lt)' };
      case 'question_created':
        return { label: 'Question Created', color: 'var(--green)', bg: 'var(--green-lt)' };
      case 'question_updated':
        return { label: 'Question Updated', color: 'var(--blue)', bg: 'var(--blue-lt)' };
      case 'question_deleted':
        return { label: 'Question Deleted', color: 'var(--red)', bg: 'var(--red-lt)' };
      case 'question_toggled':
        return { label: 'Question Toggled', color: 'var(--amber)', bg: 'var(--amber-lt)' };
      default:
        return { label: type, color: 'var(--gray5)', bg: 'var(--gray1)' };
    }
  };

  const renderMetaDetails = (details: Record<string, any>, activityType: string) => {
    if (!details || Object.keys(details).length === 0) return null;

    const formatValue = (_key: string, val: any) => {
      if (Array.isArray(val)) {
        return val.length > 0 ? val.join(', ') : 'None';
      }
      if (typeof val === 'boolean') {
        return val ? 'Yes' : 'No';
      }
      if (val === null || val === undefined || val === '') {
        return 'N/A';
      }
      return String(val);
    };

    const getFriendlyKeyLabel = (key: string) => {
      switch (key) {
        case 'question_id':
          return 'Question ID';
        case 'is_active':
          return 'Is Enabled';
        case 'count':
          return activityType.startsWith('question_') ? 'Number of Questions' : 'Questions Answered';
        case 'lab_type':
          return 'Laboratory Type';
        case 'scope':
          return 'Scope of Assessment';
        case 'reason':
          return 'Failure Reason';
        case 'answer':
          return 'Selected Answer';
        default:
          return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray5)', marginBottom: 2 }}>Activity Details:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--gray1)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13 }}>
          {Object.entries(details).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--gray6)', minWidth: 150, display: 'inline-block' }}>
                {getFriendlyKeyLabel(key)}:
              </span>
              <span style={{ color: 'var(--text)' }}>
                {formatValue(key, val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatDateTime = (dtStr: string | null) => {
    if (!dtStr) return 'Never';
    return new Date(dtStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div>
      <Navbar />
      <div className="page-container fade-up" style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
              System Activity Monitoring
            </h1>
            <p style={{ color: 'var(--gray5)', fontSize: 14, marginTop: 4 }}>
              Track user access, submissions, and database changes in real-time
            </p>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div className="card" style={{ borderTop: '3px solid var(--navy)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--navy)' }}>{totalLogins}</div>
            <div style={{ fontSize: 13, color: 'var(--gray5)' }}>Successful Logins</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--red)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--red)' }}>{failedLogins}</div>
            <div style={{ fontSize: 13, color: 'var(--gray5)' }}>Failed Login Attempts</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--blue)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--blue)' }}>{totalSubmissions}</div>
            <div style={{ fontSize: 13, color: 'var(--gray5)' }}>Assessments Submitted</div>
          </div>
          <div className="card" style={{ borderTop: '3px solid var(--green)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-head)', color: 'var(--green)' }}>{applicants.length}</div>
            <div style={{ fontSize: 13, color: 'var(--gray5)' }}>Active Applicants</div>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="card" style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 15, marginBottom: 20, fontWeight: 600 }}>Activity Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray2)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--gray5)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--gray5)' }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Logins" fill="var(--green)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Submissions" fill="var(--blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tab Controls & Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--gray1)', padding: 4, borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveTab('users')}
              className="btn"
              style={{
                background: activeTab === 'users' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'users' ? 'var(--heading-color)' : 'var(--gray5)',
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: activeTab === 'users' ? 'var(--shadow-sm)' : 'none',
                borderRadius: 'calc(var(--radius) - 2px)'
              }}
            >
              Applicant Activity Summary
            </button>
            <button
              onClick={() => setActiveTab('feed')}
              className="btn"
              style={{
                background: activeTab === 'feed' ? 'var(--bg-card)' : 'transparent',
                color: activeTab === 'feed' ? 'var(--heading-color)' : 'var(--gray5)',
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                boxShadow: activeTab === 'feed' ? 'var(--shadow-sm)' : 'none',
                borderRadius: 'calc(var(--radius) - 2px)'
              }}
            >
              Live Audit Log
            </button>
          </div>

          {/* Filters (Shown when Feed is active) */}
          {activeTab === 'feed' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input"
                style={{ width: 220, padding: '7px 12px' }}
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="input"
                style={{ width: 180, padding: '7px 12px', cursor: 'pointer' }}
              >
                <option value="all">All Activities</option>
                <option value="login_success">Successful Logins</option>
                <option value="login_failed">Failed Logins</option>
                <option value="submissions">Submissions Only</option>
                <option value="questions">Question Changes</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' ? (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray1)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Name</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Email</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Last Login Time</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Last Login IP</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Last Submission Time</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Last Submission IP</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13, textAlign: 'center' }}>Responses</th>
                </tr>
              </thead>
              <tbody>
                {userMonitoringList.length > 0 ? (
                  userMonitoringList.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 500 }}>{u.name}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--gray5)' }}>{u.email}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13 }}>{formatDateTime(u.lastLoginTime)}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, fontFamily: 'monospace', color: 'var(--gray6)' }}>{u.lastLoginIp || '—'}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13 }}>{formatDateTime(u.lastSubmissionTime)}</td>
                      <td style={{ padding: '14px 18px', fontSize: 13, fontFamily: 'monospace', color: 'var(--gray6)' }}>{u.lastSubmissionIp || '—'}</td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <span style={{
                          background: u.submissionCount > 0 ? 'var(--blue-lt)' : 'var(--gray2)',
                          color: u.submissionCount > 0 ? 'var(--blue)' : 'var(--gray5)',
                          borderRadius: 99,
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 700
                        }}>{u.submissionCount}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray4)' }}>
                      No applicant data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--gray1)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>User / Email</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Activity</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>IP Address</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13 }}>Date &amp; Time</th>
                  <th style={{ padding: '12px 18px', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => {
                    const badge = getActivityBadge(log.activity_type);
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <>
                        <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 500 }}>{log.user_name || 'Anonymous'}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray5)' }}>{log.user_email || '—'}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              background: badge.bg,
                              color: badge.color,
                              padding: '3px 10px',
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 600
                            }}>{badge.label}</span>
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13, fontFamily: 'monospace', color: 'var(--gray6)' }}>
                            {log.ip_address || '—'}
                          </td>
                          <td style={{ padding: '14px 18px', fontSize: 13, color: 'var(--gray6)' }}>
                            {formatDateTime(log.created_at)}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="btn btn-ghost"
                              style={{ padding: '4px 10px', fontSize: 12, borderRadius: 6 }}
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: 'var(--gray0)' }}>
                            <td colSpan={5} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ fontSize: 12, color: 'var(--gray5)' }}>
                                  <strong style={{ color: 'var(--text)' }}>User Agent:</strong> {log.user_agent || 'Unknown'}
                                </div>
                                {Object.keys(log.details).length > 0 && (
                                  <div style={{ marginTop: 4 }}>
                                    {renderMetaDetails(log.details, log.activity_type)}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray4)' }}>
                      No activity logs match the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
