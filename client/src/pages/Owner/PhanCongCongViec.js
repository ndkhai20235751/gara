import React, { useState, useEffect, useCallback } from 'react';
import './PhanCongCongViec.css';
import { layTatCaLenh, duyetVaPhanCong, layTatCaYeuCau, layDanhSachTho } from '../../services/api';

const PRIORITY_COLOR = {
  'Khẩn cấp': 'pcv-pri-urgent',
  'Trung bình': 'pcv-pri-medium',
  'Thấp': 'pcv-pri-low',
};

const STATUS_STEP = {
  'Chờ nhận':           0,
  'Đã nhận lệnh':       1,
  'Đã đến hiện trường': 2,
  'Đã nộp phiếu':       3,
};

const FILTER_OPTIONS = ['Tất cả', 'Chờ nhận', 'Đã nhận lệnh', 'Đã đến hiện trường', 'Đã nộp phiếu'];

const emptyForm = { matho: '', mucdouutien: 'Trung bình' };

export default function PhanCongCongViec() {
  const [lenh, setLenh]             = useState([]);
  const [pending, setPending]       = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [dangTai, setDangTai]       = useState(true);
  const [loiApi, setLoiApi]         = useState('');
  const [filter, setFilter]         = useState('Tất cả');
  const [search, setSearch]         = useState('');
  const [activeTab, setActiveTab]   = useState('assignments');

  const [assignTarget, setAssignTarget] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [dangGui, setDangGui]           = useState(false);
  const [thanhCong, setThanhCong]       = useState('');

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiApi('');
    try {
      const [resLenh, resYeuCau, resTho] = await Promise.all([
        layTatCaLenh(),
        layTatCaYeuCau(),
        layDanhSachTho(),
      ]);
      setLenh(resLenh.danhSach || []);
      setPending((resYeuCau.danhSach || []).filter((r) => r.trangthai === 'Chờ tiếp nhận'));
      setTechnicians(resTho.danhSach || []);
    } catch (err) {
      setLoiApi('Không tải được dữ liệu: ' + err.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  const filtered = lenh.filter((l) => {
    const matchFilter = filter === 'Tất cả' || l.trangthai === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (l.phieu_yeu_cau?.khach_hang?.tencongty || '').toLowerCase().includes(q) ||
      (l.phieu_yeu_cau?.modelmay || '').toLowerCase().includes(q) ||
      (l.tho_ky_thuat?.hoten || '').toLowerCase().includes(q) ||
      String(l.malenh).includes(q);
    return matchFilter && matchSearch;
  });

  const countByStatus = (st) => lenh.filter((l) => l.trangthai === st).length;

  const handleGiaoViec = async (e) => {
    e.preventDefault();
    if (!assignTarget || !form.matho) return;
    setDangGui(true);
    try {
      await duyetVaPhanCong({
        mayeucau:    assignTarget.mayeucau,
        matho:       Number(form.matho),
        mucdouutien: form.mucdouutien,
      });
      setAssignTarget(null);
      setForm(emptyForm);
      setThanhCong(`Đã giao việc thành công cho thợ kỹ thuật!`);
      setTimeout(() => setThanhCong(''), 4000);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="pcv-page">

      {/* Header */}
      <div className="pcv-header">
        <div className="pcv-header-left">
          <div className="pcv-icon-box">📋</div>
          <div>
            <h2 className="pcv-title">Phân công công việc</h2>
            <p className="pcv-sub">Giao lệnh sửa chữa — Theo dõi thợ kỹ thuật</p>
          </div>
        </div>
        <button className="pcv-refresh-btn" onClick={taiDuLieu} disabled={dangTai}>
          🔄 Làm mới
        </button>
      </div>

      {thanhCong && (
        <div className="pcv-toast-success">✅ {thanhCong}</div>
      )}

      {/* Stats */}
      <div className="pcv-stats">
        <div className="pcv-stat pcv-stat-orange">
          <span className="pcv-stat-icon">⏳</span>
          <div><div className="pcv-stat-val">{countByStatus('Chờ nhận')}</div><div className="pcv-stat-lbl">Chờ thợ nhận</div></div>
        </div>
        <div className="pcv-stat pcv-stat-blue">
          <span className="pcv-stat-icon">✅</span>
          <div><div className="pcv-stat-val">{countByStatus('Đã nhận lệnh')}</div><div className="pcv-stat-lbl">Thợ đã nhận</div></div>
        </div>
        <div className="pcv-stat pcv-stat-purple">
          <span className="pcv-stat-icon">🔧</span>
          <div><div className="pcv-stat-val">{countByStatus('Đã đến hiện trường')}</div><div className="pcv-stat-lbl">Đang kiểm tra</div></div>
        </div>
        <div className="pcv-stat pcv-stat-green">
          <span className="pcv-stat-icon">📄</span>
          <div><div className="pcv-stat-val">{countByStatus('Đã nộp phiếu')}</div><div className="pcv-stat-lbl">Đã nộp phiếu</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pcv-tabs">
        <button
          className={`pcv-tab ${activeTab === 'new' ? 'pcv-tab-active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          📤 Giao việc mới
          {pending.length > 0 && <span className="pcv-tab-count">{pending.length}</span>}
        </button>
        <button
          className={`pcv-tab ${activeTab === 'assignments' ? 'pcv-tab-active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          📊 Theo dõi lệnh
          {lenh.length > 0 && <span className="pcv-tab-count">{lenh.length}</span>}
        </button>
      </div>

      {dangTai && <div className="pcv-loading">Đang tải dữ liệu...</div>}
      {loiApi  && <div className="pcv-error">{loiApi}</div>}

      {/* Tab: Giao việc mới */}
      {activeTab === 'new' && !dangTai && (
        <div className="pcv-section">
          <h3 className="pcv-section-title">Yêu cầu chờ giao việc ({pending.length})</h3>
          {pending.length === 0 ? (
            <div className="pcv-empty">
              <div className="pcv-empty-icon">🎉</div>
              <p>Không có yêu cầu nào đang chờ giao việc.</p>
            </div>
          ) : (
            pending.map((req) => (
              <div key={req.mayeucau} className="pcv-card pcv-card-pending">
                <div className="pcv-card-head">
                  <div className="pcv-card-id-row">
                    <span className="pcv-id">#{req.mayeucau}</span>
                    <span className="pcv-customer">{req.khach_hang?.tencongty || '—'}</span>
                  </div>
                  <span className="pcv-badge-wait">Chờ giao việc</span>
                </div>
                <div className="pcv-card-machine">{req.modelmay}</div>
                <div className="pcv-card-meta">
                  <span>📍 {req.vitricongtruong}</span>
                  <span>🕒 {req.thoigiangui ? new Date(req.thoigiangui).toLocaleString('vi-VN') : ''}</span>
                </div>
                {req.motaloi && <div className="pcv-card-desc">{req.motaloi}</div>}
                <div className="pcv-card-footer">
                  <button
                    className="pcv-btn-assign"
                    onClick={() => { setAssignTarget(req); setForm(emptyForm); }}
                  >
                    📤 Giao cho thợ kỹ thuật
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Theo dõi lệnh */}
      {activeTab === 'assignments' && !dangTai && (
        <div className="pcv-section">
          {/* Filter + Search */}
          <div className="pcv-toolbar">
            <div className="pcv-filter-row">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  className={`pcv-filter-btn ${filter === opt ? 'pcv-filter-active' : ''}`}
                  onClick={() => setFilter(opt)}
                >
                  {opt}
                  {opt !== 'Tất cả' && (
                    <span className="pcv-filter-count">{countByStatus(opt)}</span>
                  )}
                </button>
              ))}
            </div>
            <input
              className="pcv-search"
              type="text"
              placeholder="🔍 Tìm theo khách hàng, máy, thợ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <h3 className="pcv-section-title">
            Lệnh sửa chữa ({filtered.length})
          </h3>

          {filtered.length === 0 ? (
            <div className="pcv-empty">
              <div className="pcv-empty-icon">📭</div>
              <p>Không có lệnh nào phù hợp.</p>
            </div>
          ) : (
            filtered.map((l) => {
              const step = STATUS_STEP[l.trangthai] ?? 0;
              const tho  = l.tho_ky_thuat;
              const yc   = l.phieu_yeu_cau;
              const ngayPhanCong = l.thoigianphancong
                ? new Date(l.thoigianphancong).toLocaleString('vi-VN') : '';

              return (
                <div key={l.malenh} className="pcv-card pcv-card-lenh">
                  {/* Card header */}
                  <div className="pcv-card-head">
                    <div className="pcv-card-id-row">
                      <span className="pcv-id">Lệnh #{l.malenh}</span>
                      <span className={`pcv-pri ${PRIORITY_COLOR[l.mucdouutien] || 'pcv-pri-medium'}`}>
                        {l.mucdouutien || 'Trung bình'}
                      </span>
                    </div>
                    <span className={`pcv-status-badge pcv-st-${step}`}>{l.trangthai}</span>
                  </div>

                  {/* Customer & Machine */}
                  <div className="pcv-card-machine">{yc?.modelmay || '—'}</div>
                  <div className="pcv-card-customer-row">
                    <span>👤 {yc?.khach_hang?.tencongty || '—'}</span>
                  </div>

                  {/* Meta */}
                  <div className="pcv-card-meta">
                    <span>📍 {yc?.vitricongtruong || '—'}</span>
                    <span>🕒 Phân công: {ngayPhanCong}</span>
                  </div>

                  {/* Technician */}
                  <div className="pcv-tho-row">
                    <div className="pcv-tho-avatar">🔧</div>
                    <div className="pcv-tho-info">
                      <div className="pcv-tho-name">{tho?.hoten || '—'}</div>
                      <div className="pcv-tho-phone">{tho?.sodienthoai || ''}</div>
                    </div>
                  </div>

                  {/* Progress steps */}
                  <div className="pcv-progress">
                    {['Chờ nhận', 'Đã nhận lệnh', 'Đã đến hiện trường', 'Đã nộp phiếu'].map((s, i) => (
                      <div key={s} className={`pcv-step ${i <= step ? 'pcv-step-done' : ''}`}>
                        <div className="pcv-step-dot">{i < step ? '✓' : i + 1}</div>
                        <div className="pcv-step-label">{s}</div>
                        {i < 3 && <div className={`pcv-step-line ${i < step ? 'pcv-line-done' : ''}`} />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Giao việc */}
      {assignTarget && (
        <div className="pcv-overlay" onClick={() => setAssignTarget(null)}>
          <div className="pcv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pcv-modal-head">
              <div className="pcv-modal-title-row">
                <span className="pcv-modal-icon">📤</span>
                <h3>Giao việc cho thợ kỹ thuật</h3>
              </div>
              <button className="pcv-close" onClick={() => setAssignTarget(null)}>×</button>
            </div>

            <div className="pcv-modal-info">
              <div className="pcv-modal-info-item">
                <div className="pcv-info-lbl">Mã yêu cầu</div>
                <div className="pcv-info-val">#{assignTarget.mayeucau}</div>
              </div>
              <div className="pcv-modal-info-item">
                <div className="pcv-info-lbl">Khách hàng</div>
                <div className="pcv-info-val">{assignTarget.khach_hang?.tencongty || '—'}</div>
              </div>
              <div className="pcv-modal-info-item pcv-info-full">
                <div className="pcv-info-lbl">Thiết bị</div>
                <div className="pcv-info-val">{assignTarget.modelmay}</div>
              </div>
              <div className="pcv-modal-info-item pcv-info-full">
                <div className="pcv-info-lbl">Địa điểm</div>
                <div className="pcv-info-val">📍 {assignTarget.vitricongtruong}</div>
              </div>
              {assignTarget.motaloi && (
                <div className="pcv-modal-info-item pcv-info-full">
                  <div className="pcv-info-lbl">Mô tả lỗi</div>
                  <div className="pcv-info-val">{assignTarget.motaloi}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleGiaoViec} className="pcv-modal-form">
              <div className="pcv-form-group">
                <label className="pcv-form-lbl">
                  Chọn thợ kỹ thuật phụ trách <span className="pcv-req">*</span>
                </label>
                <select
                  required
                  className="pcv-select"
                  value={form.matho}
                  onChange={(e) => setForm({ ...form, matho: e.target.value })}
                >
                  <option value="">-- Chọn thợ kỹ thuật --</option>
                  {technicians.map((t) => (
                    <option key={t.matho} value={t.matho}>
                      {t.hoten}{t.vitrihientai ? ` · ${t.vitrihientai}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pcv-form-group">
                <label className="pcv-form-lbl">Mức độ ưu tiên</label>
                <div className="pcv-priority-row">
                  {['Thấp', 'Trung bình', 'Khẩn cấp'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pcv-pri-opt ${form.mucdouutien === p ? 'pcv-pri-opt-active' : ''} pcv-pri-opt-${p === 'Khẩn cấp' ? 'urgent' : p === 'Trung bình' ? 'medium' : 'low'}`}
                      onClick={() => setForm({ ...form, mucdouutien: p })}
                    >
                      {p === 'Khẩn cấp' ? '🔴' : p === 'Trung bình' ? '🟡' : '🟢'} {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pcv-modal-footer">
                <button type="button" className="pcv-btn-cancel" onClick={() => setAssignTarget(null)}>
                  Hủy
                </button>
                <button type="submit" className="pcv-btn-send" disabled={dangGui}>
                  {dangGui ? '⏳ Đang gửi...' : '📤 Giao việc cho thợ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
