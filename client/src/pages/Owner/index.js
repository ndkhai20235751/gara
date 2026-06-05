import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import {
  layTatCaYeuCau, layDanhSachTho, duyetVaPhanCong, tuChoiYeuCau, capNhatTrangThaiYeuCau,
  layBaoGiaChuXuong, layChiTietBaoGia, suaBaoGia, duyetVaGuiKhach,
} from '../../services/api';
import PhanCongCongViec from './PhanCongCongViec';
import BaoGia from '../Accountant/Popus/BaoGia';

const isPending  = (t) => t === 'Chờ tiếp nhận';
const isAssigned = (t) => t === 'Đã phân công';
const isDone     = (t) => t === 'Hoàn thành';
const isActive   = (t) => !isPending(t) && !isDone(t) && t !== 'Từ chối';

const fmtVnd = (n) => Number(n || 0).toLocaleString('vi-VN') + ' đ';

export default function OwnerDashboard({ nguoiDung, onDangXuat }) {
  const [requests, setRequests]       = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [baoGiaList, setBaoGiaList]   = useState([]);
  const [dangTai, setDangTai]         = useState(true);
  const [loiApi, setLoiApi]           = useState('');
  const [activeTab, setActiveTab]     = useState('review');
  const [searchTerm, setSearchTerm]   = useState('');

  const [assignTarget, setAssignTarget]     = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [rejectTarget, setRejectTarget]     = useState(null);
  const [rejectReason, setRejectReason]     = useState('');
  const [updateTarget, setUpdateTarget]     = useState(null);
  const [dangGui, setDangGui]               = useState(false);

  // Phê duyệt báo giá state
  const [showBaoGia, setShowBaoGia]     = useState(false);
  const [selectedBaoGia, setSelectedBaoGia] = useState(null);
  const [confirmDuyet, setConfirmDuyet] = useState(null);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiApi('');
    try {
      const [resYeuCau, resTho, resBaoGia] = await Promise.all([
        layTatCaYeuCau(),
        layDanhSachTho(),
        layBaoGiaChuXuong(),
      ]);
      setRequests(resYeuCau.danhSach || []);
      setTechnicians(resTho.danhSach || []);
      setBaoGiaList(resBaoGia.danhSach || []);
    } catch (err) {
      setLoiApi('Không tải được dữ liệu: ' + err.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  const pending  = requests.filter((r) => isPending(r.trangthai));
  const assigned = requests.filter((r) => isAssigned(r.trangthai));
  const working  = requests.filter((r) => isActive(r.trangthai) && !isAssigned(r.trangthai));
  const done     = requests.filter((r) => isDone(r.trangthai));

  const choPheduyet = baoGiaList.filter((b) => b.trangthai === 'Chờ phê duyệt');

  const filtered = (list) =>
    list.filter((r) => {
      const ten = r.khach_hang?.tencongty || '';
      const may = r.modelmay || '';
      const id  = String(r.mayeucau || '');
      const q   = searchTerm.toLowerCase();
      return ten.toLowerCase().includes(q) || may.toLowerCase().includes(q) || id.includes(q);
    });

  /* ── Duyệt & Phân công ── */
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignTarget || !selectedTechId) return;
    setDangGui(true);
    try {
      await duyetVaPhanCong({ mayeucau: assignTarget.mayeucau, matho: Number(selectedTechId), mucdouutien: 'Trung bình' });
      setAssignTarget(null);
      setSelectedTechId('');
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  /* ── Từ chối ── */
  const handleRejectSubmit = async () => {
    setDangGui(true);
    try {
      await tuChoiYeuCau(rejectTarget.mayeucau);
      setRejectTarget(null);
      setRejectReason('');
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  /* ── Cập nhật tiến độ ── */
  const handleUpdateStatus = async (mayeucau, newStatus) => {
    try {
      await capNhatTrangThaiYeuCau(mayeucau, newStatus);
      setUpdateTarget(null);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  /* ── Mở popup báo giá đầy đủ ── */
  const handleMoBaoGia = async (bg) => {
    setDangTai(true);
    try {
      // Load chi tiết đầy đủ kèm noidung
      const res = await layChiTietBaoGia(bg.mabaogia);
      setSelectedBaoGia(res.chiTiet);
      setShowBaoGia(true);
    } catch (err) {
      alert('Không tải được chi tiết báo giá: ' + err.message);
    } finally {
      setDangTai(false);
    }
  };

  /* ── Lưu chỉnh sửa chi phí từ popup BaoGia ── */
  const handleLuuBaoGia = async ({ chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung }) => {
    if (!selectedBaoGia) return;
    setDangGui(true);
    try {
      await suaBaoGia(selectedBaoGia.mabaogia, { chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung });
      setShowBaoGia(false);
      setSelectedBaoGia(null);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi lưu báo giá: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  /* ── Phê duyệt & gửi khách ── */
  const handleDuyetGuiKhach = async () => {
    if (!confirmDuyet) return;
    setDangGui(true);
    try {
      await duyetVaGuiKhach(confirmDuyet.mabaogia);
      setConfirmDuyet(null);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  const getPYC = (bg) => bg.phieu_bao_kham?.lenh_sua_chua?.phieu_yeu_cau;

  return (
    <div className="ow-page">

      {/* Header */}
      <div className="ow-header">
        <div className="ow-header-left">
          <div className="ow-avatar">🏢</div>
          <div>
            <h1 className="ow-title">Dashboard Chủ xưởng</h1>
            <p className="ow-sub">{nguoiDung?.ho_ten || 'Máy Công Trình Khánh Nguyên'}</p>
          </div>
        </div>
        <div className="ow-header-right">
          <div className="ow-bell">🔔<span className="ow-bell-dot" /></div>
          <button className="ow-logout-btn" onClick={onDangXuat}>➡️ Đăng xuất</button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="ow-stats">
        <div className="ow-stat-card ow-stat-amber">
          <span className="ow-stat-icon">📥</span>
          <div><div className="ow-stat-val">{pending.length}</div><div className="ow-stat-lbl">Chờ xét duyệt</div></div>
        </div>
        <div className="ow-stat-card ow-stat-blue">
          <span className="ow-stat-icon">🔧</span>
          <div><div className="ow-stat-val">{assigned.length}</div><div className="ow-stat-lbl">Đã phân công</div></div>
        </div>
        <div className="ow-stat-card ow-stat-indigo">
          <span className="ow-stat-icon">⚙️</span>
          <div><div className="ow-stat-val">{working.length}</div><div className="ow-stat-lbl">Đang xử lý</div></div>
        </div>
        <div className="ow-stat-card ow-stat-green">
          <span className="ow-stat-icon">✅</span>
          <div><div className="ow-stat-val">{done.length}</div><div className="ow-stat-lbl">Hoàn thành</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ow-tabs">
        <button className={`ow-tab ${activeTab === 'review'   ? 'ow-tab-active' : ''}`} onClick={() => setActiveTab('review')}>
          📥 Tiếp nhận & Xét duyệt{pending.length > 0 && <span className="ow-tab-count">{pending.length}</span>}
        </button>
        <button className={`ow-tab ${activeTab === 'assign'   ? 'ow-tab-active' : ''}`} onClick={() => setActiveTab('assign')}>
          👷 Phân công thợ{assigned.length > 0 && <span className="ow-tab-count">{assigned.length}</span>}
        </button>
        <button className={`ow-tab ${activeTab === 'phanCong' ? 'ow-tab-active' : ''}`} onClick={() => setActiveTab('phanCong')}>
          📋 Phân công công việc
        </button>
        <button className={`ow-tab ${activeTab === 'baogia'   ? 'ow-tab-active' : ''}`} onClick={() => setActiveTab('baogia')}>
          💰 Phê duyệt báo giá{choPheduyet.length > 0 && <span className="ow-tab-count">{choPheduyet.length}</span>}
        </button>
        <button className={`ow-tab ${activeTab === 'monitor'  ? 'ow-tab-active' : ''}`} onClick={() => setActiveTab('monitor')}>
          📊 Giám sát tiến độ
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="ow-search-wrap">
        <input type="text" className="ow-search"
          placeholder="🔍 Tìm kiếm theo khách hàng, model máy, mã yêu cầu..."
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {dangTai && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Đang tải...</div>}
      {loiApi  && <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626' }}>{loiApi}</div>}

      {/* Tab 1: Tiếp nhận & Xét duyệt */}
      {activeTab === 'review' && !dangTai && (
        <div className="ow-section">
          <div className="ow-section-header">
            <h2 className="ow-section-title">Yêu cầu chờ xét duyệt ({filtered(pending).length})</h2>
          </div>
          {filtered(pending).length === 0 && <div className="ow-empty">Không có yêu cầu nào đang chờ xét duyệt.</div>}
          {filtered(pending).map((req) => (
            <RequestCard key={req.mayeucau} req={req}>
              <div className="ow-card-actions">
                <button className="ow-btn-approve" onClick={() => { setAssignTarget(req); setSelectedTechId(''); }}>
                  ✅ Duyệt & Phân công
                </button>
                <button className="ow-btn-reject" onClick={() => { setRejectTarget(req); setRejectReason(''); }}>
                  ❌ Từ chối
                </button>
              </div>
            </RequestCard>
          ))}
        </div>
      )}

      {/* Tab 2: Phân công thợ */}
      {activeTab === 'assign' && !dangTai && (
        <div className="ow-section">
          <div className="ow-section-header">
            <h2 className="ow-section-title">Yêu cầu đã duyệt — Đang theo dõi thợ ({filtered(assigned).length})</h2>
          </div>
          {filtered(assigned).length === 0 && <div className="ow-empty">Không có lệnh nào đang ở trạng thái đã phân công.</div>}
          {filtered(assigned).map((req) => (
            <RequestCard key={req.mayeucau} req={req}>
              <div className="ow-card-actions">
                <button className="ow-btn-update" onClick={() => setUpdateTarget(req)}>
                  🔄 Cập nhật tiến độ
                </button>
              </div>
            </RequestCard>
          ))}
        </div>
      )}

      {/* Tab 3: Phân công công việc */}
      {activeTab === 'phanCong' && !dangTai && (
        <PhanCongCongViec />
      )}

      {/* Tab 4: Phê duyệt báo giá */}
      {activeTab === 'baogia' && !dangTai && (
        <div className="ow-section">
          <div className="ow-section-header">
            <h2 className="ow-section-title">Phiếu báo giá ({baoGiaList.length})</h2>
          </div>
          {baoGiaList.length === 0 && <div className="ow-empty">Chưa có phiếu báo giá nào.</div>}
          {baoGiaList.map((bg) => {
            const pyc      = getPYC(bg);
            const daGuiRoi = bg.trangthai === 'Đã gửi khách';
            return (
              <div key={bg.mabaogia} className="ow-card">
                <div className="ow-card-top">
                  <div className="ow-card-id-row">
                    <span className="ow-id-tag">Báo giá #{bg.mabaogia}</span>
                    <span className="ow-customer-name">{pyc?.khach_hang?.tencongty || '—'}</span>
                  </div>
                  <span className={`ow-badge-st ${daGuiRoi ? 'st-done' : 'st-fixing'}`}>{bg.trangthai}</span>
                </div>

                <h3 className="ow-machine">{pyc?.modelmay || '—'}</h3>
                <div className="ow-meta">
                  <span>📍 {pyc?.vitricongtruong || '—'}</span>
                  <span>👤 KT: {bg.ke_toan?.hoten || '—'}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', margin: '0.75rem 0', fontSize: '0.85rem' }}>
                  <div>Nhân công: <strong>{fmtVnd(bg.chiphinhancong)}</strong></div>
                  <div>Phụ tùng: <strong>{fmtVnd(bg.chiphiphutung)}</strong></div>
                  <div>Chi phí khác: <strong>{fmtVnd(bg.chiphikhac)}</strong></div>
                  <div style={{ color: '#0369a1', fontWeight: 700 }}>Tổng cộng: <strong>{fmtVnd(bg.tongcong)}</strong></div>
                </div>

                {!daGuiRoi && (
                  <div className="ow-card-footer">
                    <button className="ow-btn-update" onClick={() => handleMoBaoGia(bg)}>
                      📄 Xem / Sửa báo giá
                    </button>
                    <button className="ow-btn-approve" onClick={() => setConfirmDuyet(bg)}>
                      ✅ Phê duyệt & Gửi khách
                    </button>
                  </div>
                )}
                {daGuiRoi && (
                  <div className="ow-card-footer">
                    <span className="ow-done-badge">✅ Đã gửi cho khách hàng</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 5: Giám sát tiến độ */}
      {activeTab === 'monitor' && !dangTai && (
        <div className="ow-section">
          <div className="ow-section-header">
            <h2 className="ow-section-title">Tổng quan tiến độ</h2>
          </div>
          {filtered([...assigned, ...working, ...done]).map((req) => (
            <RequestCard key={req.mayeucau} req={req}>
              <div className="ow-card-actions">
                {!isDone(req.trangthai) && (
                  <button className="ow-btn-update" onClick={() => setUpdateTarget(req)}>
                    🔄 Cập nhật tiến độ
                  </button>
                )}
                {isDone(req.trangthai) && <span className="ow-done-badge">✅ Hoàn thành</span>}
              </div>
            </RequestCard>
          ))}
          {filtered([...assigned, ...working, ...done]).length === 0 && (
            <div className="ow-empty">Chưa có lệnh nào đang thực hiện.</div>
          )}
        </div>
      )}

      {/* Modal: Duyệt & Phân công */}
      {assignTarget && (
        <div className="ow-overlay" onClick={() => setAssignTarget(null)}>
          <div className="ow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-head">
              <h3>✅ Duyệt & Phân công — #{assignTarget.mayeucau}</h3>
              <button className="ow-close" onClick={() => setAssignTarget(null)}>×</button>
            </div>
            <form onSubmit={handleAssignSubmit} className="ow-modal-body">
              <div className="ow-info-row">
                <div className="ow-info-block">
                  <div className="ow-info-lbl">Khách hàng</div>
                  <div className="ow-info-val">{assignTarget.khach_hang?.tencongty || '—'}</div>
                </div>
                <div className="ow-info-block">
                  <div className="ow-info-lbl">Thiết bị</div>
                  <div className="ow-info-val">{assignTarget.modelmay}</div>
                </div>
              </div>
              <div className="ow-info-block" style={{ marginBottom: '1rem' }}>
                <div className="ow-info-lbl">Địa điểm</div>
                <div className="ow-info-val">📍 {assignTarget.vitricongtruong}</div>
              </div>
              <div className="ow-form-group">
                <label className="ow-form-label">Chọn thợ kỹ thuật phụ trách <span className="ow-req">*</span></label>
                <select required className="ow-select" value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}>
                  <option value="">-- Chọn thợ kỹ thuật --</option>
                  {technicians.map((t) => (
                    <option key={t.matho} value={t.matho}>
                      {t.hoten} {t.vitrihientai ? `· ${t.vitrihientai}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="ow-modal-footer">
                <button type="button" className="ow-btn-cancel" onClick={() => setAssignTarget(null)}>Hủy</button>
                <button type="submit" className="ow-btn-confirm-blue" disabled={dangGui}>
                  {dangGui ? '⏳ Đang xử lý...' : '✅ Xác nhận điều động'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Từ chối */}
      {rejectTarget && (
        <div className="ow-overlay" onClick={() => setRejectTarget(null)}>
          <div className="ow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-head">
              <h3>❌ Từ chối yêu cầu — #{rejectTarget.mayeucau}</h3>
              <button className="ow-close" onClick={() => setRejectTarget(null)}>×</button>
            </div>
            <div className="ow-modal-body">
              <p className="ow-modal-desc">
                Khách hàng: <strong>{rejectTarget.khach_hang?.tencongty || '—'}</strong><br />
                Thiết bị: <strong>{rejectTarget.modelmay}</strong>
              </p>
              <div className="ow-form-group">
                <label className="ow-form-label">Lý do từ chối (tùy chọn)</label>
                <textarea className="ow-textarea" placeholder="VD: Ngoài vùng phục vụ, thiếu nhân lực..."
                  value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
              </div>
              <div className="ow-modal-footer">
                <button className="ow-btn-cancel" onClick={() => setRejectTarget(null)}>Hủy</button>
                <button className="ow-btn-confirm-red" onClick={handleRejectSubmit} disabled={dangGui}>
                  {dangGui ? '⏳...' : '❌ Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cập nhật tiến độ */}
      {updateTarget && (
        <div className="ow-overlay" onClick={() => setUpdateTarget(null)}>
          <div className="ow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-head">
              <h3>🔄 Cập nhật tiến độ — #{updateTarget.mayeucau}</h3>
              <button className="ow-close" onClick={() => setUpdateTarget(null)}>×</button>
            </div>
            <div className="ow-modal-body">
              <p className="ow-modal-desc">
                <strong>{updateTarget.modelmay}</strong> — {updateTarget.khach_hang?.tencongty}
              </p>
              <div className="ow-status-options">
                {['Đã phân công', 'Đang kiểm tra', 'Chờ báo giá', 'Hoàn thành'].map((s) => (
                  <button key={s}
                    className={`ow-status-opt ${updateTarget.trangthai === s ? 'ow-status-opt-active' : ''}`}
                    onClick={() => handleUpdateStatus(updateTarget.mayeucau, s)}>
                    {s === 'Hoàn thành' ? '✅' : '🔄'} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup báo giá đầy đủ - chỉ xem */}
      <BaoGia
        isOpen={showBaoGia}
        onClose={() => { setShowBaoGia(false); setSelectedBaoGia(null); }}
        phieu={selectedBaoGia}
        onSave={null}
        dangGui={dangGui}
        readOnly={true}
      />

      {/* Modal: Xác nhận phê duyệt & gửi khách */}
      {confirmDuyet && (
        <div className="ow-overlay" onClick={() => setConfirmDuyet(null)}>
          <div className="ow-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ow-modal-head">
              <h3>✅ Phê duyệt & Gửi khách hàng</h3>
              <button className="ow-close" onClick={() => setConfirmDuyet(null)}>×</button>
            </div>
            <div className="ow-modal-body">
              <p className="ow-modal-desc">
                Xác nhận phê duyệt báo giá <strong>#{confirmDuyet.mabaogia}</strong> và gửi cho khách hàng?
              </p>
              <p style={{ fontSize: '0.9rem', color: '#0369a1', fontWeight: 600 }}>
                Tổng cộng: {fmtVnd(confirmDuyet.tongcong)}
              </p>
              <div className="ow-modal-footer">
                <button className="ow-btn-cancel" onClick={() => setConfirmDuyet(null)}>Hủy</button>
                <button className="ow-btn-confirm-blue" onClick={handleDuyetGuiKhach} disabled={dangGui}>
                  {dangGui ? '⏳...' : '✅ Xác nhận gửi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function RequestCard({ req, children }) {
  const STATUS_CLASS = {
    'Chờ tiếp nhận':    'st-wait',
    'Đã phân công':     'st-assigned',
    'Đang kiểm tra':    'st-fixing',
    'Chờ báo giá':      'st-fixing',
    'Đã báo giá':       'st-fixing',
    'Chờ khách duyệt':  'st-fixing',
    'Hoàn thành':       'st-done',
    'Từ chối':          'st-rejected',
  };

  const ngayGui = req.thoigiangui
    ? new Date(req.thoigiangui).toLocaleString('vi-VN') : '';

  return (
    <div className="ow-card">
      <div className="ow-card-top">
        <div className="ow-card-id-row">
          <span className="ow-id-tag">#{req.mayeucau}</span>
          <span className="ow-customer-name">{req.khach_hang?.tencongty || '—'}</span>
        </div>
        <div className="ow-badges">
          <span className={`ow-badge-st ${STATUS_CLASS[req.trangthai] || ''}`}>{req.trangthai}</span>
        </div>
      </div>
      <h3 className="ow-machine">{req.modelmay}</h3>
      <div className="ow-meta">
        <span>📍 {req.vitricongtruong}</span>
        <span>🕒 {ngayGui}</span>
      </div>
      <div className="ow-desc">{req.motaloi}</div>
      <div className="ow-card-footer">{children}</div>
    </div>
  );
}
