import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { authAPI, questionsAPI, responsesAPI } from '../api';
import Navbar from '../components/Navbar';
import type { User } from '../types';

const PIE_COLORS = ['#0f2557', '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [qCount, setQCount] = useState(0);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [timeline, setTimeline] = useState<{ date: string; count: number }[]>([]);
  const [totalResponses, setTotalResponses] = useState(0);
  useEffect(() => {
    const toArray = (d: any): any[] => Array.isArray(d) ? d : (d?.results ?? []);

    Promise.all([authAPI.getAllUsers(), questionsAPI.getActive(), responsesAPI.getAllResponses(), responsesAPI.getTotalResponses()])
      .then(([uRes, qRes, rRes, TRRes]) => {
        const applicants: User[] = toArray(uRes.data).filter((u: User) => u.role === 'applicant');
        // console.log('Applicants:', applicants);
        setUsers(applicants);
        setQCount(toArray(qRes.data).length);
        //console.log('Active Questions:', toArray(qRes.data));
        setTotalResponses(TRRes.data.length);
        //  console.log('total responses count:', TRRes.data);
        const responses = toArray(rRes.data);

        // Pie: lab type distribution
        const labMap: Record<string, number> = {};
        responses.forEach((r: any) => {
          const k = r.lab_type || 'Unknown';
          labMap[k] = (labMap[k] || 0) + 1;
        });
        setPieData(Object.entries(labMap).map(([name, value]) => ({ name, value })));

        // Bar: last 7 days
        const now = new Date();
        const days: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          days[d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })] = 0;
        }
        responses.forEach((r: any) => {
          const k = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          if (k in days) days[k]++;
        });
        setTimeline(Object.entries(days).map(([date, count]) => ({ date, count })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div><Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  const StatCard = ({ icon, label, value, color, iconBg, onClick }: any) => (
    <div className="card" onClick={onClick}
      style={{
        borderTop: `3px solid ${color}`, cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow .15s',
      }}
      onMouseOver={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)')}
      onMouseOut={e => onClick && ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)')}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>{icon}</div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'var(--font-head)', lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 13, color: 'var(--gray5)', marginTop: 3 }}>{label}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="page-container fade-up" style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px' }}>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', fontWeight: 400, letterSpacing: '-0.02em' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--gray5)', fontSize: 14, marginTop: 4 }}>
            EEE Application Readiness Check Portal — Overview
          </p>
        </div>

        {/* Stat cards */}
        <div className="stat-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          <StatCard icon="👥" label="Registered Applicants" value={users.length}
            color="var(--navy)" iconBg="var(--blue-lt)" onClick={() => navigate('/admin/assessments')} />
          <StatCard icon="📋" label="Total Questions" value={qCount}
            color="var(--blue)" iconBg="var(--blue-lt)" onClick={() => navigate('/admin/questions')} />
          <StatCard icon="📊" label="Total Responses" value={totalResponses}
            color="var(--green)" iconBg="var(--green-lt)" />
        </div>

        {/* Charts */}
        <div className="chart-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 20, fontWeight: 600 }}>Submissions by Lab Type</h3>
            {pieData.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [`${v} responses`, '']} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray4)', fontSize: 14 }}>
                No submission data yet
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 20, fontWeight: 600 }}>Submissions — Last 7 Days</h3>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray2)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--gray5)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--gray5)' }} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(37,99,235,.05)' }} />
                <Bar dataKey="count" name="Responses" fill="var(--navy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {[
            { icon: '📋', title: 'Manage Questions', desc: 'Create, edit, toggle and delete questions', path: '/admin/questions', color: 'var(--blue)', iconBg: 'var(--blue-lt)' },
            { icon: '📊', title: 'View Assessments', desc: 'Browse all applicant submissions and reports', path: '/admin/assessments', color: 'var(--green)', iconBg: 'var(--green-lt)' },
          ].map(item => (
            <div key={item.path} className="card" onClick={() => navigate(item.path)} style={{
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
              transition: 'box-shadow .15s', borderLeft: `4px solid ${item.color}`,
            }}
              onMouseOver={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)')}
              onMouseOut={e => ((e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow)')}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{item.title}</div>
                <div style={{ color: 'var(--gray5)', fontSize: 13, marginTop: 2 }}>{item.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--gray3)', fontSize: 20 }}>›</div>
            </div>
          ))}
        </div>

        {/* Recent applicants */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent Applicants</h3>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '5px 12px' }}
              onClick={() => navigate('/admin/assessments')}>View all →</button>
          </div>
          {users.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Registered</th><th></th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 6).map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--gray5)' }}>{u.email}</td>
                    <td style={{ color: 'var(--gray5)', fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td><button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 12px' }}
                      onClick={() => navigate(`/admin/assessments`)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--gray4)', padding: '32px 0', fontSize: 14 }}>No applicants yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
