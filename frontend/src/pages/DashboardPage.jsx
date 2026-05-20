import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import Sidebar from '../components/Sidebar';
import CreateDoctorModal from '../components/CreateDoctorModal';
import api from '../services/api';

const ADMIN_NAV = [
  { id: 'doctor',     icon: '👨‍⚕️', label: 'Quản lý bác sĩ' },
  { id: 'diagnosis',  icon: '🩺',  label: 'Quản lý chuẩn đoán' },
  { id: 'blockchain', icon: '🔗',  label: 'Giao dịch Blockchain' },
  { id: 'ai',         icon: '🤖',  label: 'Quản lý AI Model' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useThemeLang();

  const [activeTab, setActiveTab] = useState('doctor');
  const [data, setData] = useState({ doctors: [], diagnoses: [], transactions: [], aimodels: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateDoctor, setShowCreateDoctor] = useState(false);

  useEffect(() => { loadHospitalData(); }, []);

  const loadHospitalData = async () => {
    try {
      const [docRes, diagRes, txRes, aiRes] = await Promise.all([
        api.get('/hospital/doctors'),
        api.get('/hospital/diagnoses'),
        api.get('/hospital/transactions'),
        api.get('/hospital/aimodels'),
      ]);
      setData({
        doctors:      docRes.data,
        diagnoses:    diagRes.data,
        transactions: txRes.data,
        aimodels:     aiRes.data,
      });
    } catch (err) {
      console.error('Failed to load hospital data:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeItem = ADMIN_NAV.find((i) => i.id === activeTab);

  const countLabel = {
    doctor:     `${data.doctors.length} bác sĩ trong hệ thống`,
    diagnosis:  `${data.diagnoses.length} chuẩn đoán được ghi nhận`,
    blockchain: `${data.transactions.length} giao dịch trên blockchain`,
    ai:         `${data.aimodels.length} mô hình AI đang quản lý`,
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px', width: 44, height: 44 }} />
          <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Đang tải dữ liệu bệnh viện...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)', background: 'var(--bg)' }}>

      {/* ── Reusable Sidebar ── */}
      <Sidebar
        items={ADMIN_NAV}
        activeId={activeTab}
        onSelect={setActiveTab}
        title="Quản lý Bệnh viện"
        titleIcon="🏥"
        badgeLabel="Verified Admin"
        userEmail={user?.email}
      />

      {/* ── Main content ── */}
      <main style={{ flex: 1, padding: '32px 28px', minWidth: 0 }}>

        {/* Page header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: '1.5rem' }}>{activeItem?.icon}</span>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
                {activeItem?.label}
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {countLabel[activeTab]}
            </p>
          </div>

          {/* Action button — only on doctor tab */}
          {activeTab === 'doctor' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateDoctor(true)}
              style={{ whiteSpace: 'nowrap', padding: '10px 20px', fontWeight: 700 }}
            >
              + Thêm bác sĩ
            </button>
          )}
        </div>

        {/* Table card */}
        <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.93rem' }}>

              {activeTab === 'doctor' && (
                <>
                  <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <tr>
                      {['ID', 'Họ và Tên', 'Chuyên Khoa', 'Số Điện Thoại', 'Trạng Thái'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.doctors.length === 0 && <EmptyRow cols={5} />}
                    {data.doctors.map((d) => (
                      <tr key={d.id} style={rowStyle}>
                        <td style={tdStyle}><span style={monoId}>#{d.id.substring(0, 8)}…</span></td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{d.name}</td>
                        <td style={{ ...tdStyle, color: 'var(--primary-light, #818cf8)' }}>{d.specialty}</td>
                        <td style={tdStyle}>{d.phone}</td>
                        <td style={tdStyle}><span className="badge badge-success">{d.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'diagnosis' && (
                <>
                  <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <tr>
                      {['ID', 'Bệnh Nhân', 'Bệnh Lý', 'Điều Trị', 'Bác Sĩ Phụ Trách', 'Trạng Thái'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.diagnoses.length === 0 && <EmptyRow cols={6} />}
                    {data.diagnoses.map((d) => (
                      <tr key={d.id} style={rowStyle}>
                        <td style={tdStyle}><span style={monoId}>#{d.id.substring(0, 8)}…</span></td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{d.patientName}</td>
                        <td style={{ ...tdStyle, color: 'var(--accent, #f472b6)' }}>{d.disease}</td>
                        <td style={tdStyle}>{d.treatment}</td>
                        <td style={{ ...tdStyle, color: 'var(--primary-light, #818cf8)' }}>{d.doctor?.name}</td>
                        <td style={tdStyle}>
                          <span className={`badge ${d.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'blockchain' && (
                <>
                  <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <tr>
                      {['Tx ID', 'Hash Giao Dịch', 'Hành Động', 'Ngày Giờ', 'Trạng Thái Mạng'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.length === 0 && <EmptyRow cols={5} />}
                    {data.transactions.map((tx) => (
                      <tr key={tx.id} style={rowStyle}>
                        <td style={tdStyle}><span style={monoId}>#{tx.id}</span></td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {tx.txHash.substring(0, 12)}…{tx.txHash.substring(tx.txHash.length - 10)}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{tx.action}</td>
                        <td style={tdStyle}>{new Date(tx.timestamp).toLocaleString('vi-VN')}</td>
                        <td style={tdStyle}>
                          <span className={`badge ${tx.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === 'ai' && (
                <>
                  <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <tr>
                      {['Model ID', 'Tên Hệ Thống AI', 'Phiên Bản', 'Độ Chính Xác', 'Trạng Thái'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.aimodels.length === 0 && <EmptyRow cols={5} />}
                    {data.aimodels.map((m) => (
                      <tr key={m.id} style={rowStyle}>
                        <td style={tdStyle}><span style={monoId}>#{m.id}</span></td>
                        <td style={{ ...tdStyle, fontWeight: 600, color: 'var(--accent-light, #c084fc)' }}>{m.name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{m.version}</td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 90, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99 }}>
                              <div style={{
                                width: `${m.accuracy}%`, height: '100%',
                                background: 'var(--success, #22c55e)',
                                borderRadius: 99, transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{m.accuracy}%</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span className={`badge ${m.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
          </div>
        </div>
      </main>

      {/* ── Create Doctor Modal ── */}
      <CreateDoctorModal
        open={showCreateDoctor}
        onClose={() => setShowCreateDoctor(false)}
        onSuccess={(newDoctor) => {
          setData((prev) => ({
            ...prev,
            doctors: [{ ...newDoctor, user: { username: newDoctor.username, email: newDoctor.email, status: 'ACTIVE' } }, ...prev.doctors],
          }));
          setShowCreateDoctor(false);
        }}
      />
    </div>
  );
}

/* ── Shared helpers ── */
function EmptyRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Không có dữ liệu
      </td>
    </tr>
  );
}

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  color: 'var(--text-secondary)',
  fontWeight: 600,
  fontSize: '0.82rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  whiteSpace: 'nowrap',
};

const tdStyle  = { padding: '14px 16px', verticalAlign: 'middle' };
const rowStyle = { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' };
const monoId   = { fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' };
