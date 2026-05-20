import { useState, useRef } from 'react';
import api from '../services/api';

const INITIAL_FORM = {
  doctorName: '',
  licenseId: '',
  identityNumber: '',
  position: '',
  specialties: '',
  degree: '',
  facultyOfWork: '',
  dateOfBirth: '',
  workingStartDate: '',
  email: '',
  username: '',
  tempPassword: '',
};

/**
 * Modal form for Admin to create a Doctor account.
 * Props:
 *   open     — boolean
 *   onClose  — () => void
 *   onSuccess — (newDoctor) => void   refresh parent list
 */
export default function CreateDoctorModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [portrait, setPortrait] = useState(null);      // File object
  const [preview, setPreview] = useState(null);        // Data URL for preview
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const fileRef = useRef(null);

  if (!open) return null;

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handlePortrait = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (jpg, png, webp)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh không được vượt quá 5 MB');
      return;
    }
    setPortrait(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    const required = ['doctorName','licenseId','identityNumber','position','specialties',
                      'degree','facultyOfWork','dateOfBirth','workingStartDate','email',
                      'username','tempPassword'];
    for (const key of required) {
      if (!form[key]?.trim()) {
        setError(`Vui lòng điền: ${fieldLabel(key)}`);
        return;
      }
    }
    if (form.tempPassword.length < 6) {
      setError('Mật khẩu tạm thời phải ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (portrait) fd.append('portrait', portrait);

      const res = await api.post('/hospital/doctors', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(res.data);
      onSuccess?.(res.data.doctor);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Tạo tài khoản thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setPortrait(null);
    setPreview(null);
    setError('');
    setSuccess(null);
    onClose();
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <Backdrop onClick={handleClose}>
        <ModalBox onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
          <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800 }}>
              Tạo tài khoản thành công!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              Bác sĩ có thể đăng nhập và đổi mật khẩu lần đầu.
            </p>

            <div className="card" style={{ padding: 16, textAlign: 'left', marginBottom: 24, fontSize: '0.88rem' }}>
              {[
                ['Username', success.doctor.username],
                ['Email', success.doctor.email],
                ['Họ tên', success.doctor.doctorName],
                ['Chức vụ', success.doctor.position],
                ['Blockchain', success.doctor.blockchainStatus],
                ['Metadata Hash', success.doctor.metadataHash?.slice(0, 20) + '…'],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontWeight: 600, fontFamily: label === 'Metadata Hash' ? 'monospace' : 'inherit' }}>{val}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleClose}>
              Đóng
            </button>
          </div>
        </ModalBox>
      </Backdrop>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <Backdrop onClick={handleClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
            👨‍⚕️ Tạo tài khoản bác sĩ
          </h2>
          <button onClick={handleClose} style={closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Portrait upload ── */}
          <div>
            <label style={labelStyle}>Ảnh chân dung *</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${preview ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: preview ? 0 : '28px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.2s',
                overflow: 'hidden',
                minHeight: preview ? 180 : 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {preview ? (
                <img
                  src={preview}
                  alt="portrait preview"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: 6 }}>🖼️</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Click để chọn ảnh (jpg, png, webp — tối đa 5 MB)
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePortrait} style={{ display: 'none' }} />
            {preview && (
              <button type="button" onClick={() => { setPortrait(null); setPreview(null); }}
                style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Xóa ảnh
              </button>
            )}
          </div>

          {/* ── Two-column grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Họ và tên *" name="doctorName" value={form.doctorName} onChange={handleChange} placeholder="Nguyễn Văn A" />
            <Field label="Mã chứng chỉ hành nghề *" name="licenseId" value={form.licenseId} onChange={handleChange} placeholder="VN-BS-12345" />
            <Field label="Số CMND / CCCD *" name="identityNumber" value={form.identityNumber} onChange={handleChange} placeholder="012345678901" />
            <Field label="Chức vụ *" name="position" value={form.position} onChange={handleChange} placeholder="Bác sĩ chính" />
            <Field label="Chuyên khoa *" name="specialties" value={form.specialties} onChange={handleChange} placeholder="Tim mạch" />
            <Field label="Bằng cấp *" name="degree" value={form.degree} onChange={handleChange} placeholder="Tiến sĩ Y khoa" />
            <Field label="Khoa / Phòng ban *" name="facultyOfWork" value={form.facultyOfWork} onChange={handleChange} placeholder="Khoa Tim mạch" />
            <Field label="Ngày sinh *" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Field label="Ngày bắt đầu làm việc *" name="workingStartDate" type="date" value={form.workingStartDate} onChange={handleChange} />
            <Field label="Email *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="bsnguyenvana@hospital.vn" />
          </div>

          {/* ── Account ── */}
          <div style={{ padding: 16, background: 'rgba(99,102,241,0.07)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-light, #818cf8)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🔐 Thông tin tài khoản
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Username *" name="username" value={form.username} onChange={handleChange} placeholder="bs_nguyenvana" />
              <Field label="Mật khẩu tạm thời *" name="tempPassword" type="password" value={form.tempPassword} onChange={handleChange} placeholder="Tối thiểu 6 ký tự" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.88rem' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 140 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Đang tạo...
                </span>
              ) : '✅ Tạo tài khoản'}
            </button>
          </div>
        </form>
      </ModalBox>
    </Backdrop>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────
function Field({ label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function Backdrop({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      {children}
    </div>
  );
}

function ModalBox({ children, onClick, style: extraStyle }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card, #1e1e2e)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '28px 32px',
        width: '100%',
        maxWidth: 760,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        ...extraStyle,
      }}
    >
      {children}
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  fontSize: '0.92rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const closeBtn = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  width: 34,
  height: 34,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  fontSize: '0.9rem',
};

function fieldLabel(key) {
  const map = {
    doctorName: 'Họ và tên', licenseId: 'Mã chứng chỉ',
    identityNumber: 'Số CMND/CCCD', position: 'Chức vụ',
    specialties: 'Chuyên khoa', degree: 'Bằng cấp',
    facultyOfWork: 'Khoa / Phòng ban', dateOfBirth: 'Ngày sinh',
    workingStartDate: 'Ngày bắt đầu', email: 'Email',
    username: 'Username', tempPassword: 'Mật khẩu tạm',
  };
  return map[key] || key;
}
