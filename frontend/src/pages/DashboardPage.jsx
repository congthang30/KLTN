import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeLang } from '../contexts/ThemeLangContext';
import api from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useThemeLang();
  
  const [activeTab, setActiveTab] = useState('doctor');
  const [data, setData] = useState({ doctors: [], diagnoses: [], transactions: [], aimodels: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHospitalData();
  }, []);

  const loadHospitalData = async () => {
    try {
      const [docRes, diagRes, txRes, aiRes] = await Promise.all([
        api.get('/hospital/doctors'),
        api.get('/hospital/diagnoses'),
        api.get('/hospital/transactions'),
        api.get('/hospital/aimodels')
      ]);
      setData({
        doctors: docRes.data,
        diagnoses: diagRes.data,
        transactions: txRes.data,
        aimodels: aiRes.data
      });
    } catch (err) {
      console.error('Failed to load hospital data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'doctor', label: t('dashboard.tab.doctor') },
    { id: 'diagnosis', label: t('dashboard.tab.diagnosis') },
    { id: 'blockchain', label: t('dashboard.tab.blockchain') },
    { id: 'ai', label: t('dashboard.tab.ai') },
  ];

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 100 }}>
        <div className="spinner" style={{ margin: '0 auto 20px', width: 40, height: 40 }}></div>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Đang tải dữ liệu bệnh viện...</div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ padding: '40px 24px', maxWidth: 1200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          🏥 {t('dashboard.title')}
        </h1>
        <span className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.8rem', fontWeight: 600 }}>
          ✓ Verified Admin
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16, overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '100px', padding: '8px 20px', fontWeight: 600 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
            {activeTab === 'doctor' && (
              <>
                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Họ và Tên</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Chuyên Khoa</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Số Điện Thoại</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.doctors.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#{d.id}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '16px', color: 'var(--primary-light)' }}>{d.specialty}</td>
                      <td style={{ padding: '16px' }}>{d.phone}</td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-success">{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}

            {activeTab === 'diagnosis' && (
              <>
                <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Bệnh Nhân</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Bệnh Lý</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Điều Trị</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Bác Sĩ Trực Phụ Trách</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {data.diagnoses.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#{d.id}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{d.patientName}</td>
                      <td style={{ padding: '16px', color: 'var(--accent)' }}>{d.disease}</td>
                      <td style={{ padding: '16px' }}>{d.treatment}</td>
                      <td style={{ padding: '16px', color: 'var(--primary-light)' }}>{d.doctor?.name}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${d.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{d.status}</span>
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
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Tx ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Hash Giao Dịch</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Hành Động</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Ngày Giờ</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Trạng Thái Mạng</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#{t.id}</td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {t.txHash.substring(0, 15)}...{t.txHash.substring(t.txHash.length - 15)}
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{t.action}</td>
                      <td style={{ padding: '16px' }}>{new Date(t.timestamp).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${t.status === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                          {t.status}
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
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Model ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Tên Hệ Thống AI</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Phiên Bản</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Độ Chính Xác</th>
                    <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text-secondary)' }}>Trạng Thái Hoạt Động</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aimodels.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#{m.id}</td>
                      <td style={{ padding: '16px', fontWeight: 600, color: 'var(--accent-light)' }}>{m.name}</td>
                      <td style={{ padding: '16px', fontFamily: 'monospace' }}>{m.version}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 100, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }}>
                            <div style={{ width: `${m.accuracy}%`, height: '100%', background: 'var(--success)', borderRadius: 4 }}></div>
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{m.accuracy}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
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
    </div>
  );
}
