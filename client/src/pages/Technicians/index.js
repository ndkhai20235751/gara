import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import { layLenhCuaTho, nhanLenh, denHienTruong, nopPhieuGiamDinh, batDauSuaChua, hoanThanhSuaChua } from '../../services/api';
import socket from '../../services/socket';

const emptyReport = { sogiodongho: '', chandoan: '', phutung: '', giocong: '', ghichu: '' };
const PRIORITY_CLASS = { 'Khẩn cấp': 'tc-pri-urgent', 'Trung bình': 'tc-pri-medium', 'Thấp': 'tc-pri-low' };
const PROGRESS_STEPS = ['Chờ nhận', 'Đã nhận lệnh', 'Đã đến hiện trường', 'Đã nộp phiếu', 'Đang sửa chữa'];

export default function TechnicianDashboard({ nguoiDung, onDangXuat }) {
  const [tasks, setTasks]         = useState([]);
  const [thoInfo, setThoInfo]     = useState(null);
  const [dangTai, setDangTai]     = useState(true);
  const [loiApi, setLoiApi]       = useState('');
  const [activeTab, setActiveTab] = useState('receive');
  const [dangGui, setDangGui]     = useState(false);

  const [confirmTarget, setConfirmTarget] = useState(null);
  const [reportTarget, setReportTarget]   = useState(null);
  const [detailTarget, setDetailTarget]   = useState(null);
  const [reportForm, setReportForm]       = useState(emptyReport);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiApi('');
    try {
      const res = await layLenhCuaTho();
      setTasks(res.danhSach || []);
      if (res.thoInfo) setThoInfo(res.thoInfo);
    } catch (err) {
      setLoiApi('Không tải được dữ liệu: ' + err.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  useEffect(() => {
    socket.on('lenh_thay_doi', taiDuLieu);
    socket.on('yeu_cau_thay_doi', taiDuLieu);
    socket.on('bao_gia_thay_doi', taiDuLieu);
    return () => {
      socket.off('lenh_thay_doi', taiDuLieu);
      socket.off('yeu_cau_thay_doi', taiDuLieu);
      socket.off('bao_gia_thay_doi', taiDuLieu);
    };
  }, [taiDuLieu]);

  // Giải nén dữ liệu từ join Supabase
  const normalize = (t) => ({
    malenh:       t.malenh,
    mayeucau:     t.phieu_yeu_cau?.mayeucau,
    status:       t.trangthai,
    yeuCauStatus: t.phieu_yeu_cau?.trangthai || '',
    priority:     t.mucdouutien || 'Trung bình',
    customerName: t.phieu_yeu_cau?.khach_hang?.tencongty || '—',
    machineModel: t.phieu_yeu_cau?.modelmay || '—',
    location:     t.phieu_yeu_cau?.vitricongtruong || '—',
    assignedAt:   t.thoigianphancong
      ? new Date(t.thoigianphancong).toLocaleString('vi-VN') : '',
    description:  t.phieu_yeu_cau?.motaloi || '',
    nguoilienhe:  t.phieu_yeu_cau?.nguoilienhe || '',
    sodienthoai:  t.phieu_yeu_cau?.sodienthoai || '',
    thoigiangui:  t.phieu_yeu_cau?.thoigiangui || null,
  });

  const all       = tasks.map(normalize);
  const waiting   = all.filter((t) => t.status === 'Chờ nhận');
  const received  = all.filter((t) => t.status === 'Đã nhận lệnh');
  const onSite    = all.filter((t) => t.status === 'Đã đến hiện trường');
  const submitted = all.filter((t) => t.status === 'Đã nộp phiếu');
  const tab1Tasks = [...waiting, ...received];

  /* ── Xác nhận nhận lệnh ── */
  const handleConfirmReceive = async () => {
    setDangGui(true);
    try {
      await nhanLenh(confirmTarget.malenh);
      setConfirmTarget(null);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  /* ── Đã đến hiện trường ── */
  const handleArrived = async (malenh) => {
    try {
      await denHienTruong(malenh);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  /* ── Bắt đầu sửa chữa ── */
  const handleBatDauSua = async (malenh) => {
    try {
      await batDauSuaChua(malenh);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  /* ── Hoàn thành sửa chữa ── */
  const handleHoanThanh = async (malenh) => {
    try {
      await hoanThanhSuaChua(malenh);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  /* ── Nộp phiếu giám định ── */
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setDangGui(true);
    try {
      await nopPhieuGiamDinh({
        malenh:      reportTarget.malenh,
        mayeucau:    reportTarget.mayeucau,
        sogiodongho: reportForm.sogiodongho,
        chandoan:    reportForm.chandoan,
        phutung:     reportForm.phutung,
        giocong:     reportForm.giocong,
        ghichu:      reportForm.ghichu,
      });
      setReportTarget(null);
      await taiDuLieu();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  return (
    <div className="tc-page">

      {/* Header */}
      <div className="tc-header">
        <div className="tc-header-left">
          <div className="tc-avatar">🔧</div>
          <div>
            <h1 className="tc-page-title">Dashboard Thợ kỹ thuật</h1>
            <p className="tc-tech-name">{thoInfo?.hoten || nguoiDung?.ho_ten || '—'}</p>
          </div>
        </div>
        <div className="tc-header-right">
          <div className="tc-bell">🔔<span className="tc-bell-dot" /></div>
          <button className="tc-logout-btn" onClick={onDangXuat}>➡️ Đăng xuất</button>
        </div>
      </div>

      {/* Stats */}
      <div className="tc-stats-row">
        <div className="tc-stat-card tc-stat-blue">
          <span className="tc-stat-icon">📋</span>
          <div><div className="tc-stat-value">{tab1Tasks.length}</div><div className="tc-stat-label">Lệnh mới</div></div>
        </div>
        <div className="tc-stat-card tc-stat-purple">
          <span className="tc-stat-icon">🔍</span>
          <div><div className="tc-stat-value">{onSite.length}</div><div className="tc-stat-label">Đang kiểm tra</div></div>
        </div>
        <div className="tc-stat-card tc-stat-green">
          <span className="tc-stat-icon">✅</span>
          <div><div className="tc-stat-value">{submitted.length}</div><div className="tc-stat-label">Đã nộp phiếu</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tc-tabs">
        <button className={`tc-tab-btn ${activeTab === 'receive'  ? 'tc-tab-active' : ''}`} onClick={() => setActiveTab('receive')}>
          📥 Nhận lệnh & Định vị{waiting.length > 0 && <span className="tc-tab-count">{waiting.length}</span>}
        </button>
        <button className={`tc-tab-btn ${activeTab === 'inspect'  ? 'tc-tab-active' : ''}`} onClick={() => setActiveTab('inspect')}>
          🔍 Kiểm tra & Chẩn đoán{onSite.length > 0 && <span className="tc-tab-count">{onSite.length}</span>}
        </button>
        <button className={`tc-tab-btn ${activeTab === 'report'   ? 'tc-tab-active' : ''}`} onClick={() => setActiveTab('report')}>
          📄 Phiếu giám định{submitted.length > 0 && <span className="tc-tab-count">{submitted.length}</span>}
        </button>
        <button className={`tc-tab-btn ${activeTab === 'progress' ? 'tc-tab-active' : ''}`} onClick={() => setActiveTab('progress')}>
          🔄 Tiến độ sửa chữa
        </button>
      </div>

      {dangTai && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Đang tải...</div>}
      {loiApi  && <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626' }}>{loiApi}</div>}

      {/* Tab 1: Nhận lệnh & Định vị */}
      {activeTab === 'receive' && !dangTai && (
        <div className="tc-section">
          <h2 className="tc-section-title">Lệnh được phân công</h2>
          {tab1Tasks.length === 0 ? <div className="tc-empty">Không có lệnh mới nào.</div> : (
            tab1Tasks.map((task) => (
              <div key={task.malenh} className="tc-card">
                <div className="tc-card-top">
                  <div className="tc-card-top-left">
                    <span className="tc-card-id">#{task.malenh}</span>
                    <span className={`tc-priority ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
                    <span className={`tc-status-badge ${task.status === 'Chờ nhận' ? 'tc-st-wait' : 'tc-st-received'}`}>
                      {task.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="tc-card-time">🕒 {task.assignedAt}</span>
                    <button className="tc-btn-detail-sm" onClick={() => setDetailTarget(task)}>👁 Chi tiết</button>
                  </div>
                </div>
                <h3 className="tc-card-customer">{task.customerName}</h3>
                <p className="tc-card-machine">{task.machineModel}</p>
                <div className="tc-card-meta"><span>📍 {task.location}</span></div>
                <div className="tc-card-desc">{task.description}</div>
                <div className="tc-card-footer">
                  {task.status === 'Chờ nhận' ? (
                    <>
                      <button className="tc-btn-confirm" onClick={() => setConfirmTarget(task)}>
                        ✅ Xác nhận nhận lệnh
                      </button>
                      <button className="tc-btn-map"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location)}`, '_blank')}>
                        📍 Chỉ đường
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="tc-btn-arrived" onClick={() => handleArrived(task.malenh)}>
                        🚗 Đã đến hiện trường
                      </button>
                      <button className="tc-btn-map"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.location)}`, '_blank')}>
                        📍 Chỉ đường
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Kiểm tra & Chẩn đoán */}
      {activeTab === 'inspect' && !dangTai && (
        <div className="tc-section">
          <h2 className="tc-section-title">Đang kiểm tra tại hiện trường</h2>
          {onSite.length === 0 ? <div className="tc-empty">Không có lệnh nào đang kiểm tra.</div> : (
            onSite.map((task) => (
              <div key={task.malenh} className="tc-card tc-card-inspect">
                <div className="tc-card-top">
                  <div className="tc-card-top-left">
                    <span className="tc-card-id">#{task.malenh}</span>
                    <span className={`tc-priority ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
                    <span className="tc-status-badge tc-st-onsite">Đã đến hiện trường</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="tc-card-time">🕒 {task.assignedAt}</span>
                    <button className="tc-btn-detail-sm" onClick={() => setDetailTarget(task)}>👁 Chi tiết</button>
                  </div>
                </div>
                <h3 className="tc-card-customer">{task.customerName}</h3>
                <p className="tc-card-machine">{task.machineModel}</p>
                <div className="tc-card-meta"><span>📍 {task.location}</span></div>
                <div className="tc-card-desc">{task.description}</div>
                <div className="tc-inspect-hint">
                  💡 Kiểm tra kỹ máy và điền đầy đủ phiếu giám định trước khi gửi về.
                </div>
                <div className="tc-card-footer">
                  <button className="tc-btn-report" onClick={() => { setReportTarget(task); setReportForm(emptyReport); }}>
                    📝 Lập & Gửi phiếu giám định
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Phiếu giám định đã nộp */}
      {activeTab === 'report' && !dangTai && (
        <div className="tc-section">
          <h2 className="tc-section-title">Phiếu giám định đã nộp</h2>
          {submitted.length === 0 ? <div className="tc-empty">Chưa có phiếu giám định nào được nộp.</div> : (
            submitted.map((task) => (
              <div key={task.malenh} className="tc-card tc-card-done">
                <div className="tc-card-top">
                  <div className="tc-card-top-left">
                    <span className="tc-card-id">#{task.malenh}</span>
                    <span className="tc-status-badge tc-st-submitted">✓ Đã nộp phiếu</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="tc-card-time">🕒 {task.assignedAt}</span>
                    <button className="tc-btn-detail-sm" onClick={() => setDetailTarget(task)}>👁 Chi tiết</button>
                  </div>
                </div>
                <h3 className="tc-card-customer">{task.customerName}</h3>
                <p className="tc-card-machine">{task.machineModel}</p>
                <div className="tc-card-meta"><span>📍 {task.location}</span></div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Tiến độ sửa chữa */}
      {activeTab === 'progress' && !dangTai && (
        <div className="tc-section">
          <h2 className="tc-section-title">Tiến độ sửa chữa ({all.length} lệnh)</h2>
          {all.length === 0 ? <div className="tc-empty">Chưa có lệnh nào.</div> : (
            all.map((task) => {
              const currentStep = PROGRESS_STEPS.indexOf(task.status);
              const khachDaDuyet = task.yeuCauStatus === 'Đã duyệt báo giá';
              const choiBatDau   = khachDaDuyet && task.status === 'Đã nộp phiếu';
              return (
                <div key={task.malenh} className="tc-card">
                  <div className="tc-card-top">
                    <div className="tc-card-top-left">
                      <span className="tc-card-id">#{task.malenh}</span>
                      <span className={`tc-priority ${PRIORITY_CLASS[task.priority] || ''}`}>{task.priority}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="tc-card-time">🕒 {task.assignedAt}</span>
                    <button className="tc-btn-detail-sm" onClick={() => setDetailTarget(task)}>👁 Chi tiết</button>
                  </div>
                  </div>
                  <h3 className="tc-card-customer">{task.customerName}</h3>
                  <p className="tc-card-machine">{task.machineModel}</p>
                  <div className="tc-card-meta"><span>📍 {task.location}</span></div>
                  <div className="tc-progress-stepper">
                    {PROGRESS_STEPS.map((step, i) => {
                      const done   = choiBatDau ? i <= 3 : i < currentStep;
                      const active = !choiBatDau && i === currentStep;
                      return (
                        <React.Fragment key={step}>
                          <div className={`tc-progress-node ${done ? 'tc-node-done' : active ? 'tc-node-active' : 'tc-node-pending'}`}>
                            <div className="tc-node-circle">{done ? '✓' : i + 1}</div>
                            <div className="tc-node-label">{step}</div>
                          </div>
                          {i < PROGRESS_STEPS.length - 1 && (
                            <div className={`tc-progress-line ${done ? 'tc-line-done' : ''}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {choiBatDau && (
                    <div className="tc-card-footer">
                      <button className="tc-btn-bat-dau-sua" onClick={() => handleBatDauSua(task.malenh)}>
                        🔧 Bắt đầu sửa chữa
                      </button>
                    </div>
                  )}
                  {task.status === 'Đang sửa chữa' && (
                    <div className="tc-card-footer">
                      <button className="tc-btn-hoan-thanh" onClick={() => handleHoanThanh(task.malenh)}>
                        ✅ Hoàn thành sửa chữa
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Xác nhận nhận lệnh */}
      {confirmTarget && (
        <div className="tc-overlay" onClick={() => setConfirmTarget(null)}>
          <div className="tc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tc-modal-icon">📥</div>
            <h3 className="tc-modal-title">Xác nhận nhận lệnh</h3>
            <p className="tc-modal-desc">
              Bạn xác nhận nhận lệnh <strong>#{confirmTarget.malenh}</strong> —{' '}
              <strong>{confirmTarget.machineModel}</strong>?<br />
              Địa điểm: <strong>{confirmTarget.location}</strong>
            </p>
            <div className="tc-modal-footer">
              <button className="tc-btn-cancel" onClick={() => setConfirmTarget(null)}>Hủy</button>
              <button className="tc-btn-confirm-green" onClick={handleConfirmReceive} disabled={dangGui}>
                {dangGui ? '⏳...' : '✅ Xác nhận nhận lệnh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Chi tiết phiếu yêu cầu */}
      {detailTarget && (
        <div className="tc-overlay" onClick={() => setDetailTarget(null)}>
          <div className="tc-modal tc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-modal-title">📋 Chi tiết phiếu yêu cầu — #{detailTarget.mayeucau}</h3>
            <div className="tc-detail-grid">
              <div className="tc-detail-item">
                <div className="tc-detail-lbl">Khách hàng</div>
                <div className="tc-detail-val">{detailTarget.customerName}</div>
              </div>
              <div className="tc-detail-item">
                <div className="tc-detail-lbl">Thiết bị / Model máy</div>
                <div className="tc-detail-val">{detailTarget.machineModel}</div>
              </div>
              <div className="tc-detail-item tc-detail-full">
                <div className="tc-detail-lbl">Vị trí công trường</div>
                <div className="tc-detail-val">📍 {detailTarget.location}</div>
              </div>
              <div className="tc-detail-item">
                <div className="tc-detail-lbl">Người liên hệ</div>
                <div className="tc-detail-val">{detailTarget.nguoilienhe || '—'}</div>
              </div>
              <div className="tc-detail-item">
                <div className="tc-detail-lbl">Số điện thoại</div>
                <div className="tc-detail-val">
                  {detailTarget.sodienthoai
                    ? <a href={`tel:${detailTarget.sodienthoai}`} style={{ color: '#16a34a', fontWeight: 600 }}>📞 {detailTarget.sodienthoai}</a>
                    : '—'}
                </div>
              </div>
              <div className="tc-detail-item tc-detail-full">
                <div className="tc-detail-lbl">Mô tả hư hỏng</div>
                <div className="tc-detail-val" style={{ whiteSpace: 'pre-wrap' }}>{detailTarget.description}</div>
              </div>
            </div>
            <div className="tc-modal-footer">
              <button className="tc-btn-cancel" onClick={() => setDetailTarget(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lập phiếu giám định */}
      {reportTarget && (
        <div className="tc-overlay" onClick={() => setReportTarget(null)}>
          <div className="tc-modal tc-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="tc-modal-title">📝 Phiếu giám định — #{reportTarget.malenh}</h3>
            <p className="tc-modal-sub">{reportTarget.machineModel} | {reportTarget.customerName}</p>
            <form onSubmit={handleSubmitReport} className="tc-report-form">
              <div className="tc-form-row">
                <div className="tc-form-group">
                  <label>Số giờ đồng hồ (Hour Meter) <span className="tc-req">*</span></label>
                  <input type="number" placeholder="VD: 2450"
                    value={reportForm.sogiodongho}
                    onChange={(e) => setReportForm({ ...reportForm, sogiodongho: e.target.value })}
                    required />
                </div>
                <div className="tc-form-group">
                  <label>Giờ công dự kiến <span className="tc-req">*</span></label>
                  <input type="number" placeholder="VD: 8"
                    value={reportForm.giocong}
                    onChange={(e) => setReportForm({ ...reportForm, giocong: e.target.value })}
                    required />
                </div>
              </div>
              <div className="tc-form-group">
                <label>Chẩn đoán / mô tả hư hỏng <span className="tc-req">*</span></label>
                <textarea placeholder="Mô tả chi tiết tình trạng hư hỏng sau khi kiểm tra..."
                  value={reportForm.chandoan}
                  onChange={(e) => setReportForm({ ...reportForm, chandoan: e.target.value })}
                  rows={3} required />
              </div>
              <div className="tc-form-group">
                <label>Phụ tùng / vật tư cần thay <span className="tc-req">*</span></label>
                <textarea placeholder="VD: Bơm thủy lực 1 cái, lọc dầu 2 cái..."
                  value={reportForm.phutung}
                  onChange={(e) => setReportForm({ ...reportForm, phutung: e.target.value })}
                  rows={2} required />
              </div>
              <div className="tc-form-group">
                <label>Ghi chú thêm</label>
                <textarea placeholder="Thông tin bổ sung nếu có..."
                  value={reportForm.ghichu}
                  onChange={(e) => setReportForm({ ...reportForm, ghichu: e.target.value })}
                  rows={2} />
              </div>
              <div className="tc-modal-footer">
                <button type="button" className="tc-btn-cancel" onClick={() => setReportTarget(null)}>Hủy</button>
                <button type="submit" className="tc-btn-submit-green" disabled={dangGui}>
                  {dangGui ? '⏳ Đang gửi...' : '📤 Gửi phiếu giám định'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
