import React, { useState } from 'react';
import './style.css';
import { dangNhap } from '../../services/api';     // ← Import hàm đăng nhập

const roles = [
  {
    id: 'chuxuong',
    name: 'Chủ xưởng',
    icon: '🏢',
    color: 'blue',
    badge: 'Quản lý',
    desc: 'Tiếp nhận yêu cầu, phân công thợ & theo dõi toàn bộ tiến độ sửa chữa',
    steps: ['Tiếp nhận & xét duyệt yêu cầu', 'Phân công thợ kỹ thuật', 'Giám sát tiến độ'],
  },
  {
    id: 'thokythuat',
    name: 'Thợ kỹ thuật',
    icon: '🔧',
    color: 'green',
    badge: 'Hiện trường',
    desc: 'Nhận lệnh điều động, di chuyển đến công trường & lập phiếu giám định',
    steps: ['Nhận lệnh & định vị', 'Kiểm tra, chẩn đoán máy', 'Gửi phiếu giám định'],
  },
  {
    id: 'ketoan',
    name: 'Kế toán',
    icon: '📊',
    color: 'purple',
    badge: 'Văn phòng',
    desc: 'Lập báo giá chuyên nghiệp từ phiếu giám định & quản lý công nợ',
    steps: ['Nhận phiếu từ thợ', 'Lập & gửi báo giá', 'Chốt công nợ'],
  },
  {
    id: 'khachhang',
    name: 'Khách hàng',
    icon: '👤',
    color: 'orange',
    badge: 'Đối tác',
    desc: 'Gửi yêu cầu sửa chữa, theo dõi tiến độ & phê duyệt báo giá',
    steps: ['Gửi yêu cầu sửa chữa', 'Theo dõi tiến độ', 'Phê duyệt báo giá'],
  },
];

export default function Login({ onLogin, onGoToRegister }) {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');              // Đổi từ username → email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dangTai, setDangTai] = useState(false);       // ← THÊM: trạng thái loading
  const [loi, setLoi] = useState('');                  // ← THÊM: thông báo lỗi

  const activeRole = roles.find((r) => r.id === selectedRole);

  const handleSelectRole = (id) => {
    setSelectedRole(id);
    setStep(2);
    setLoi('');   // Xóa lỗi cũ khi đổi vai trò
  };

  const handleBack = () => {
    setStep(1);
    setEmail('');
    setPassword('');
    setLoi('');
  };

  // ===== HÀM ĐĂNG NHẬP THỰC SỰ =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setDangTai(true);
    setLoi('');

    try {
      const ketQua = await dangNhap(email, password, selectedRole);

      // Lưu token vào sessionStorage (mỗi tab độc lập)
      sessionStorage.setItem('token', ketQua.token);
      sessionStorage.setItem('nguoiDung', JSON.stringify(ketQua.nguoiDung));

      // Gọi callback để App.js biết đã đăng nhập thành công
      if (onLogin) onLogin(ketQua.nguoiDung);

    } catch (error) {
      setLoi(error.message);
    } finally {
      setDangTai(false);
    }
  };

  return (
    <div className="ln-container">

      <div className="ln-brand">
        <div className="ln-brand-icon">⚙️</div>
        <div>
          <div className="ln-brand-name">Máy Công Trình Khánh Nguyên</div>
          <div className="ln-brand-sub">Hệ thống Quản lý Sửa chữa Máy móc</div>
        </div>
      </div>

      <div className="ln-card">

        {/* BƯỚC 1: CHỌN VAI TRÒ */}
        {step === 1 && (
          <>
            <div className="ln-step-header">
              <h2 className="ln-title">Bạn đăng nhập với vai trò nào?</h2>
              <p className="ln-subtitle">Chọn vai trò phù hợp để truy cập đúng tính năng</p>
            </div>

            <div className="ln-role-grid">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`ln-role-card ln-role-${role.color}`}
                  onClick={() => handleSelectRole(role.id)}
                >
                  <div className="ln-role-top">
                    <div className={`ln-role-icon-box ln-bg-${role.color}`}>{role.icon}</div>
                    <span className={`ln-role-badge ln-badge-${role.color}`}>{role.badge}</span>
                  </div>
                  <div className="ln-role-name">{role.name}</div>
                  <div className="ln-role-desc">{role.desc}</div>
                  <ul className="ln-role-steps">
                    {role.steps.map((s, i) => (
                      <li key={i}>
                        <span className={`ln-step-dot ln-dot-${role.color}`}>{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className={`ln-role-cta ln-cta-${role.color}`}>Đăng nhập →</div>
                </button>
              ))}
            </div>

            <div className="ln-workflow-hint">
              <span className="ln-hint-icon">💡</span>
              Luồng: Khách hàng → Chủ xưởng → Thợ kỹ thuật → Kế toán → Khách hàng phê duyệt
            </div>

            <div className="ln-register-hint">
              Chưa có tài khoản khách hàng?{' '}
              <button className="ln-register-link" onClick={onGoToRegister}>
                Đăng ký ngay →
              </button>
            </div>
          </>
        )}

        {/* BƯỚC 2: FORM ĐĂNG NHẬP */}
        {step === 2 && activeRole && (
          <>
            <button className="ln-back-btn" onClick={handleBack}>
              ← Đổi vai trò
            </button>

            <div className="ln-step-header">
              <div className={`ln-selected-role-badge ln-bg-${activeRole.color}`}>
                <span>{activeRole.icon}</span>
                <span>{activeRole.name}</span>
              </div>
              <h2 className="ln-title" style={{ marginTop: '1rem' }}>Đăng nhập</h2>
              <p className="ln-subtitle">{activeRole.desc}</p>
            </div>

            {/* HIỂN THỊ LỖI NẾU CÓ */}
            {loi && (
              <div style={{
                background: '#fee2e2', border: '1px solid #fca5a5',
                color: '#dc2626', padding: '12px 16px', borderRadius: '8px',
                marginBottom: '16px', fontSize: '14px'
              }}>
                ⚠️ {loi}
              </div>
            )}

            <form onSubmit={handleSubmit} className="ln-form">

              <div className="ln-form-group">
                <label className="ln-label">Email <span className="ln-required">*</span></label>
                <input
                  type="email"
                  required
                  className={`ln-input ln-input-focus-${activeRole.color}`}
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={dangTai}
                />
              </div>

              <div className="ln-form-group">
                <label className="ln-label">Mật khẩu <span className="ln-required">*</span></label>
                <div className="ln-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className={`ln-input ln-input-focus-${activeRole.color}`}
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={dangTai}
                  />
                  <button
                    type="button"
                    className="ln-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="ln-form-utilities">
                <label className="ln-remember">
                  <input type="checkbox" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#forgot" className={`ln-forgot ln-link-${activeRole.color}`}>Quên mật khẩu?</a>
              </div>

              <button
                type="submit"
                className={`ln-submit-btn ln-btn-${activeRole.color}`}
                disabled={dangTai}
              >
                {dangTai ? '⏳ Đang đăng nhập...' : `${activeRole.icon} Đăng nhập với vai trò ${activeRole.name}`}
              </button>

            </form>
          </>
        )}

      </div>

      <div className="ln-footer">© 2026 Khánh Nguyên · Hệ thống quản lý sửa chữa máy công trình</div>
    </div>
  );
}
