import React, { useState } from 'react';
import './style.css';
import { dangKy } from '../../services/api';

const ROLES = [
  { id: 'khachhang',  label: 'Khách hàng',   icon: '👤', color: 'orange', desc: 'Gửi yêu cầu & theo dõi tiến độ sửa chữa' },
  { id: 'chuxuong',   label: 'Chủ xưởng',    icon: '🏢', color: 'blue',   desc: 'Tiếp nhận, phân công & quản lý toàn bộ' },
  { id: 'thokythuat', label: 'Thợ kỹ thuật', icon: '🔧', color: 'green',  desc: 'Nhận lệnh, kiểm tra & lập phiếu giám định' },
  { id: 'ketoan',     label: 'Kế toán',      icon: '📊', color: 'purple', desc: 'Lập báo giá & quản lý công nợ' },
];

export default function Register({ onGoToLogin }) {
  const [vaitro, setVaitro] = useState('');
  const [form, setForm] = useState({ hoten: '', sdt: '', email: '', matkhau: '', xacNhan: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState('');
  const [thanhCong, setThanhCong] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vaitro) {
      setLoi('Vui lòng chọn vai trò của bạn');
      return;
    }
    if (form.matkhau !== form.xacNhan) {
      setLoi('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.matkhau.length < 6) {
      setLoi('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setDangTai(true);
    setLoi('');
    try {
      await dangKy({ hoten: form.hoten, sodienthoai: form.sdt, email: form.email, matkhau: form.matkhau, vaitro });
      setThanhCong(true);
    } catch (err) {
      setLoi(err.message);
    } finally {
      setDangTai(false);
    }
  };

  const activeRole = ROLES.find((r) => r.id === vaitro);

  if (thanhCong) {
    return (
      <div className="rg-container">
        <div className="rg-brand">
          <div className="rg-brand-icon">⚙️</div>
          <div>
            <div className="rg-brand-name">Máy Công Trình Khánh Nguyên</div>
            <div className="rg-brand-sub">Hệ thống Quản lý Sửa chữa Máy móc</div>
          </div>
        </div>
        <div className="rg-card">
          <div className="rg-success-icon">✅</div>
          <h2 className="rg-success-title">Đăng ký thành công!</h2>
          <p className="rg-success-desc">
            Tài khoản <strong>{activeRole?.label || ''}</strong> của bạn đã được tạo.<br />
            Vui lòng đăng nhập để bắt đầu sử dụng dịch vụ.
          </p>
          <button className="rg-submit-btn" onClick={onGoToLogin}>
            Đến trang đăng nhập →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rg-container">

      <div className="rg-brand">
        <div className="rg-brand-icon">⚙️</div>
        <div>
          <div className="rg-brand-name">Máy Công Trình Khánh Nguyên</div>
          <div className="rg-brand-sub">Hệ thống Quản lý Sửa chữa Máy móc</div>
        </div>
      </div>

      <div className="rg-card">

        <div className="rg-header">
          <div className="rg-avatar-badge">📝</div>
          <h2 className="rg-title">Tạo tài khoản mới</h2>
          <p className="rg-subtitle">Điền thông tin để tạo tài khoản sử dụng hệ thống</p>
        </div>

        {loi && <div className="rg-error-box">⚠️ {loi}</div>}

        <form onSubmit={handleSubmit} className="rg-form">

          {/* CHỌN VAI TRÒ */}
          <div className="rg-form-group">
            <label className="rg-label">Vai trò <span className="rg-req">*</span></label>
            <div className="rg-role-grid">
              {ROLES.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`rg-role-card rg-role-${role.color} ${vaitro === role.id ? `rg-role-selected rg-selected-${role.color}` : ''}`}
                  onClick={() => { setVaitro(role.id); setLoi(''); }}
                  disabled={dangTai}
                >
                  <span className={`rg-role-icon rg-icon-bg-${role.color}`}>{role.icon}</span>
                  <span className="rg-role-label">{role.label}</span>
                  <span className="rg-role-desc">{role.desc}</span>
                  {vaitro === role.id && <span className="rg-role-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* HỌ VÀ TÊN */}
          <div className="rg-form-group">
            <label className="rg-label">Họ và tên <span className="rg-req">*</span></label>
            <div className="rg-input-wrap">
              <span className="rg-input-icon">👤</span>
              <input
                type="text"
                className="rg-input"
                placeholder="Nguyễn Văn A"
                value={form.hoten}
                onChange={set('hoten')}
                disabled={dangTai}
                required
              />
            </div>
          </div>

          {/* SỐ ĐIỆN THOẠI */}
          <div className="rg-form-group">
            <label className="rg-label">Số điện thoại <span className="rg-req">*</span></label>
            <div className="rg-input-wrap">
              <span className="rg-input-icon">📞</span>
              <input
                type="tel"
                className="rg-input"
                placeholder="0912 345 678"
                value={form.sdt}
                onChange={set('sdt')}
                disabled={dangTai}
                required
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="rg-form-group">
            <label className="rg-label">Email <span className="rg-req">*</span></label>
            <div className="rg-input-wrap">
              <span className="rg-input-icon">✉️</span>
              <input
                type="email"
                className="rg-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={set('email')}
                disabled={dangTai}
                required
              />
            </div>
          </div>

          {/* MẬT KHẨU */}
          <div className="rg-form-row">
            <div className="rg-form-group">
              <label className="rg-label">Mật khẩu <span className="rg-req">*</span></label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">🔒</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="rg-input rg-input-pass"
                  placeholder="Ít nhất 6 ký tự"
                  value={form.matkhau}
                  onChange={set('matkhau')}
                  disabled={dangTai}
                  required
                />
                <button type="button" className="rg-eye-btn" onClick={() => setShowPass(!showPass)} tabIndex={-1}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="rg-form-group">
              <label className="rg-label">Xác nhận mật khẩu <span className="rg-req">*</span></label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">🔒</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className="rg-input rg-input-pass"
                  placeholder="Nhập lại mật khẩu"
                  value={form.xacNhan}
                  onChange={set('xacNhan')}
                  disabled={dangTai}
                  required
                />
                <button type="button" className="rg-eye-btn" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={`rg-submit-btn ${activeRole ? `rg-btn-${activeRole.color}` : ''}`}
            disabled={dangTai}
          >
            {dangTai ? '⏳ Đang tạo tài khoản...' : `📝 Đăng ký${activeRole ? ` vai trò ${activeRole.label}` : ' ngay'}`}
          </button>

        </form>

        <div className="rg-divider"><span>Đã có tài khoản?</span></div>

        <button className="rg-login-link" onClick={onGoToLogin}>
          ← Quay lại đăng nhập
        </button>

      </div>

      <div className="rg-footer">© 2026 Khánh Nguyên · Hệ thống quản lý sửa chữa máy công trình</div>
    </div>
  );
}
