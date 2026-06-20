import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import BaoGia from '../Accountant/Popus/BaoGia';
import { guiYeuCau, layDanhSachYeuCau, layBaoGiaKhachHang, layChiTietBaoGiaKhachHang, pheDuyetBaoGia, yeuCauDieuChinhBaoGia, xacNhanNghiemThu } from '../../services/api';
import socket from '../../services/socket';

const STATUS_STEPS = ['Chờ tiếp nhận', 'Đã tiếp nhận', 'Đã phân công', 'Đang kiểm tra', 'Đang sửa chữa', 'Hoàn thành'];
const STATUS_INDEX = {
  'Chờ tiếp nhận': 0,
  'Đã tiếp nhận': 1,
  'Đã phân công': 2,
  'Đang kiểm tra': 3,
  'Chờ báo giá': 3,
  'Chờ khách duyệt': 3,
  'Đã duyệt báo giá': 3,
  'Chờ phê duyệt lại': 3,
  'Đang sửa chữa': 4,
  'Hoàn thành': 5,
  'Khách đã nghiệm thu': 5,
};

const emptyForm = { modelmay: '', vitricongtruong: '', nguoilienhe: '', sodienthoai: '', motaloi: '' };

export default function CustomerDashboard({ onDangXuat }) {
  const [activeTab, setActiveTab] = useState('requests');
  const [orders, setOrders] = useState([]);
  const [baoGiaList, setBaoGiaList] = useState([]);
  const [dangTai, setDangTai] = useState(false);
  const [loiApi, setLoiApi] = useState('');
  
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newForm, setNewForm] = useState(emptyForm);

  const [showBaoGia, setShowBaoGia] = useState(false);
  const [selectedBaoGia, setSelectedBaoGia] = useState(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustNote, setAdjustNote] = useState('');
  const [dangXuLy, setDangXuLy] = useState(false);

  const [showConfirmNghiemThu, setShowConfirmNghiemThu] = useState(false);
  const [nghiemThuTarget, setNghiemThuTarget] = useState(null);

  const taiOrders = useCallback(async () => {
    setDangTai(true);
    try {
      const ketQua = await layDanhSachYeuCau();
      setOrders(ketQua.danhSach || []);
    } catch (error) {
      setLoiApi('Không tải được danh sách: ' + error.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  const taiBaoGia = useCallback(async () => {
    setDangTai(true);
    try {
      const res = await layBaoGiaKhachHang();
      setBaoGiaList(res.danhSach || []);
    } catch (err) {
      console.error('Lỗi tải báo giá:', err);
    } finally {
      setDangTai(false);
    }
  }, []);

  // Load báo giá khi vào tab báo giá
  useEffect(() => {
    if (activeTab === 'quotes') {
      taiBaoGia();
    }
  }, [activeTab, taiBaoGia]);

  // Mở chi tiết báo giá
  const handleXemBaoGia = async (bg) => {
    setDangTai(true);
    try {
      const res = await layChiTietBaoGiaKhachHang(bg.mabaogia);
      setSelectedBaoGia(res.chiTiet);
      setShowBaoGia(true);
    } catch (err) {
      alert('Không tải được chi tiết báo giá: ' + err.message);
    } finally {
      setDangTai(false);
    }
  };

  // Phê duyệt báo giá
  const handlePheDuyet = async () => {
    if (!selectedBaoGia) return;
    setDangXuLy(true);
    try {
      await pheDuyetBaoGia(selectedBaoGia.phieu_bao_gia.mabaogia);
      setShowApprove(false);
      setShowBaoGia(false);
      alert('Đã phê duyệt báo giá thành công!');
      await taiBaoGia();
    } catch (err) {
      alert('Lỗi phê duyệt: ' + err.message);
    } finally {
      setDangXuLy(false);
    }
  };

  // Gửi yêu cầu điều chỉnh
  const handleGuiDieuChinh = async () => {
    if (!selectedBaoGia || !adjustNote.trim()) return;
    setDangXuLy(true);
    try {
      await yeuCauDieuChinhBaoGia(selectedBaoGia.phieu_bao_gia.mabaogia, adjustNote);
      setShowAdjust(false);
      setShowBaoGia(false);
      setAdjustNote('');
      alert('Đã gửi yêu cầu điều chỉnh!');
      await taiBaoGia();
    } catch (err) {
      alert('Lỗi gửi yêu cầu: ' + err.message);
    } finally {
      setDangXuLy(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setDangTai(true);
    try {
      await guiYeuCau({
        modelmay:        newForm.modelmay,
        vitricongtruong: newForm.vitricongtruong,
        nguoilienhe:     newForm.nguoilienhe,
        sodienthoai:     newForm.sodienthoai,
        motaloi:         newForm.motaloi,
      });
      const ketQua = await layDanhSachYeuCau();
      setOrders(ketQua.danhSach || []);
      setNewForm(emptyForm);
      setShowNewRequest(false);
      setActiveTab('requests');
    } catch (error) {
      alert('Lỗi gửi yêu cầu: ' + error.message);
    } finally {
      setDangTai(false);
    }
  };

  const handleXacNhanNghiemThu = async () => {
    if (!nghiemThuTarget) return;
    setDangXuLy(true);
    try {
      await xacNhanNghiemThu(nghiemThuTarget.mayeucau);
      setShowConfirmNghiemThu(false);
      setNghiemThuTarget(null);
      const ketQua = await layDanhSachYeuCau();
      setOrders(ketQua.danhSach || []);
    } catch (err) {
      alert('Lỗi xác nhận nghiệm thu: ' + err.message);
    } finally {
      setDangXuLy(false);
    }
  };

  const totalDone = orders.filter((o) => ['Hoàn thành', 'Khách đã nghiệm thu'].includes(o.trangthai)).length;
  const totalActive = orders.filter((o) => !['Hoàn thành', 'Khách đã nghiệm thu', 'Từ chối'].includes(o.trangthai)).length;
  
  useEffect(() => { taiOrders(); }, [taiOrders]);

  useEffect(() => {
    socket.connect();
    socket.on('yeu_cau_thay_doi', taiOrders);
    socket.on('bao_gia_thay_doi', taiBaoGia);
    return () => {
      socket.off('yeu_cau_thay_doi', taiOrders);
      socket.off('bao_gia_thay_doi', taiBaoGia);
      socket.disconnect();
    };
  }, [taiOrders, taiBaoGia]);
  


  return (
    <div className="cust-page">

      {/* Header */}
      <div className="cust-header">
        <div className="cust-header-left">
          <div className="cust-avatar">👤</div>
          <div>
            <h1 className="cust-page-title">Cổng Khách hàng</h1>
            <p className="cust-company">Công ty TNHH Xây dựng ABC</p>
          </div>
        </div>
        <div className="cust-header-right">
          <div className="cust-bell">🔔<span className="cust-bell-dot" /></div>
          <button className="cust-logout-btn" onClick={onDangXuat}>➡️ Đăng xuất</button>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="cust-stats-row">
        <div className="cust-stat-card cust-stat-blue">
          <span className="cust-stat-icon">📋</span>
          <div>
            <div className="cust-stat-value">{orders.length}</div>
            <div className="cust-stat-label">Tổng yêu cầu</div>
          </div>
        </div>
        <div className="cust-stat-card cust-stat-orange">
          <span className="cust-stat-icon">⚙️</span>
          <div>
            <div className="cust-stat-value">{totalActive}</div>
            <div className="cust-stat-label">Đang xử lý</div>
          </div>
        </div>
        <div className="cust-stat-card cust-stat-green">
          <span className="cust-stat-icon">✅</span>
          <div>
            <div className="cust-stat-value">{totalDone}</div>
            <div className="cust-stat-label">Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cust-tabs">
        <button
          className={`cust-tab-btn ${activeTab === 'requests' ? 'cust-tab-active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 Yêu cầu của tôi
        </button>
        <button
          className={`cust-tab-btn ${activeTab === 'quotes' ? 'cust-tab-active' : ''}`}
          onClick={() => setActiveTab('quotes')}
        >
          💰 Báo giá & Phê duyệt
          {baoGiaList.some(bg => bg.trangthai === 'Đã gửi khách') && <span className="cust-tab-dot" />}
        </button>
        <button
          className={`cust-tab-btn ${activeTab === 'nghiemthu' ? 'cust-tab-active' : ''}`}
          onClick={() => setActiveTab('nghiemthu')}
        >
          🔖 Nghiệm thu
          {totalDone > 0 && <span className="cust-tab-badge">{totalDone}</span>}
        </button>
      </div>

      {/* Tab: Yêu cầu của tôi */}
      {activeTab === 'requests' && (
        <div className="cust-section">
          <div className="cust-section-top">
            <h2 className="cust-section-title">Danh sách yêu cầu sửa chữa</h2>
            <button className="cust-new-btn" onClick={() => setShowNewRequest(true)}>
              ➕ Gửi yêu cầu mới
            </button>
          </div>

          {dangTai && <div className="cust-loading">Đang tải...</div>}
          {loiApi && <div className="cust-error">{loiApi}</div>}

          {orders.map((order) => {
            const stepIdx = STATUS_INDEX[order.trangthai] ?? 0;
            const ngayGui = order.thoigiangui ? new Date(order.thoigiangui).toLocaleDateString('vi-VN') : '';
            return (
              <div key={order.mayeucau} className="cust-order-card">
                <div className="cust-order-top">
                  <div className="cust-order-top-left">
                    <span className="cust-order-id">{order.mayeucau}</span>
                    <span className={`cust-order-badge ${order.trangthai === 'Hoàn thành' ? 'badge-done' : order.trangthai === 'Chờ tiếp nhận' ? 'badge-wait' : 'badge-active'}`}>
                      {order.trangthai}
                    </span>
                  </div>
                  <span className="cust-order-date">🕒 {ngayGui}</span>
                </div>

                <h3 className="cust-order-machine">{order.modelmay}</h3>

                <div className="cust-order-meta">
                  <span>📍 {order.vitricongtruong}</span>
                  {order.nguoilienhe && <span>🗺️ {order.nguoilienhe}</span>}
                </div>

                <div className="cust-order-desc">{order.motaloi}</div>

                {/* Timeline tiến độ */}
                <div className="cust-progress">
                  {STATUS_STEPS.map((step, i) => (
                    <React.Fragment key={step}>
                      <div className={`cust-progress-step ${i < stepIdx ? 'step-done' : ''} ${i === stepIdx ? 'step-current' : ''}`}>
                        <div className="cust-step-circle">
                          {i < stepIdx ? '✓' : i + 1}
                        </div>
                        <div className="cust-step-label">{step}</div>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`cust-step-connector ${i < stepIdx ? 'connector-done' : ''}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {order.hasAttachment && (
                  <div className="cust-order-footer">
                    <button className="cust-download-btn">
                      📥 Tải biên bản nghiệm thu
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Báo giá */}
      {activeTab === 'quotes' && (
        <div className="cust-section">
          <h2 className="cust-section-title">Báo giá & Phê duyệt</h2>

          {dangTai && <div className="cust-loading">Đang tải...</div>}

          {!dangTai && baoGiaList.length === 0 && (
            <div className="cust-empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
              <p>Chưa có báo giá nào được gửi đến bạn.</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Báo giá sẽ xuất hiện ở đây sau khi chủ xưởng phê duyệt.</p>
            </div>
          )}

          {baoGiaList.map((bg) => {
            const pyc = bg.phieu_bao_kham?.lenh_sua_chua?.phieu_yeu_cau;
            const ngayLap = bg.thoigiandapung ? new Date(bg.thoigiandapung).toLocaleDateString('vi-VN') : '';
            const daDuyet = bg.trangthai === 'Khách đã duyệt';
            const yeuCauDieuChinh = bg.trangthai === 'Khách yêu cầu điều chỉnh';

            return (
              <div key={bg.mabaogia} className={`cust-quote-card ${daDuyet ? 'cust-quote-approved' : ''}`}>
                <div className="cust-quote-header">
                  <div>
                    <div className="cust-quote-id">Báo giá #{bg.mabaogia}</div>
                    <div className="cust-quote-machine">{pyc?.modelmay || '—'}</div>
                  </div>
                  <div className="cust-quote-amount">
                    {Number(bg.tongcong || 0).toLocaleString('vi-VN')} đ
                  </div>
                </div>
                <div className="cust-quote-meta">
                  <span>📍 {pyc?.vitricongtruong || '—'}</span>
                  <span>📅 Ngày lập: {ngayLap}</span>
                </div>
                <div className="cust-quote-status">
                  <span className={`cust-status-badge ${
                    daDuyet ? 'status-approved' : 
                    yeuCauDieuChinh ? 'status-adjust' : 
                    'status-pending'
                  }`}>
                    {bg.trangthai}
                  </span>
                </div>

                {!daDuyet && (
                  <div className="cust-quote-actions">
                    <button className="cust-btn-view" onClick={() => handleXemBaoGia(bg)}>
                      📄 Xem chi tiết
                    </button>
                    {!yeuCauDieuChinh && (
                      <>
                        <button className="cust-btn-approve" onClick={() => { handleXemBaoGia(bg); setShowApprove(true); }}>
                          ✔️ Phê duyệt
                        </button>
                        <button className="cust-btn-adjust" onClick={() => { 
                          // Chuẩn hóa cấu trúc selectedBaoGia cho modal điều chỉnh
                          setSelectedBaoGia({
                            phieu_bao_gia: { mabaogia: bg.mabaogia },
                            mabaokham: bg.phieu_bao_kham?.mabaokham
                          }); 
                          setShowAdjust(true); 
                        }}>
                          📝 Yêu cầu điều chỉnh
                        </button>
                      </>
                    )}
                  </div>
                )}

                {daDuyet && (
                  <div className="cust-quote-done">
                    ✅ Bạn đã phê duyệt báo giá này
                  </div>
                )}

                {yeuCauDieuChinh && (
                  <div className="cust-quote-done" style={{ background: '#e0e7ff', color: '#4338ca' }}>
                    📝 Đã gửi yêu cầu điều chỉnh - Chờ xử lý
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Nghiệm thu */}
      {activeTab === 'nghiemthu' && (
        <div className="cust-section">
          <h2 className="cust-section-title">Danh sách nghiệm thu</h2>

          {orders.filter(o => ['Hoàn thành', 'Khách đã nghiệm thu'].includes(o.trangthai)).length === 0 ? (
            <div className="cust-empty-state">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔖</div>
              <p>Chưa có yêu cầu nào hoàn thành nghiệm thu.</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Các lệnh sửa chữa hoàn thành sẽ xuất hiện tại đây.</p>
            </div>
          ) : (
            orders.filter(o => ['Hoàn thành', 'Khách đã nghiệm thu'].includes(o.trangthai)).map((order) => {
              const ngayGui = order.thoigiangui ? new Date(order.thoigiangui).toLocaleDateString('vi-VN') : '—';
              const daXacNhan = order.trangthai === 'Khách đã nghiệm thu';
              return (
                <div key={order.mayeucau} className={`cust-nt-card ${daXacNhan ? 'cust-nt-confirmed' : ''}`}>
                  <div className="cust-nt-badge-wrap">
                    {daXacNhan
                      ? <span className="cust-nt-confirmed-badge">✅ Đã xác nhận nghiệm thu</span>
                      : <span className="cust-nt-done-badge">🔧 Sửa chữa hoàn thành — Chờ nghiệm thu</span>
                    }
                  </div>

                  <div className="cust-nt-header">
                    <div>
                      <span className="cust-nt-id">#{order.mayeucau}</span>
                      <h3 className="cust-nt-machine">{order.modelmay}</h3>
                    </div>
                    <div className="cust-nt-date">
                      <span>📅 Ngày gửi: {ngayGui}</span>
                    </div>
                  </div>

                  <div className="cust-nt-meta">
                    <span>📍 {order.vitricongtruong}</span>
                    {order.nguoilienhe && <span>🗺️ {order.nguoilienhe}</span>}
                  </div>

                  <div className="cust-nt-desc">{order.motaloi}</div>

                  <div className="cust-nt-footer">
                    <div className="cust-nt-info-row">
                      <span className="cust-nt-info-icon">🏭</span>
                      <span>Máy Công Trình Khánh Nguyên đã hoàn tất sửa chữa và bàn giao.</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {!daXacNhan && (
                        <button className="cust-btn-xacnhan-nt" onClick={() => { setNghiemThuTarget(order); setShowConfirmNghiemThu(true); }}>
                          ✔️ Xác nhận nghiệm thu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: Gửi yêu cầu mới */}
      {showNewRequest && (
        <div className="cust-modal-overlay" onClick={() => setShowNewRequest(false)}>
          <div className="cust-modal-box cust-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3 className="cust-modal-title">📋 Gửi yêu cầu sửa chữa mới</h3>
            <form onSubmit={handleSubmitRequest} className="cust-new-form">
              <div className="cust-form-group">
                <label>Loại / Model máy <span className="cust-req">*</span></label>
                <input
                  type="text"
                  placeholder="VD: Máy xúc lật JCB 3CX"
                  value={newForm.modelmay}
                  onChange={(e) => setNewForm({ ...newForm, modelmay: e.target.value })}
                  required
                />
              </div>
              <div className="cust-form-row">
                <div className="cust-form-group">
                  <label>Vị trí công trường <span className="cust-req">*</span></label>
                  <input
                    type="text"
                    placeholder="VD: Long An"
                    value={newForm.vitricongtruong}
                    onChange={(e) => setNewForm({ ...newForm, vitricongtruong: e.target.value })}
                    required
                  />
                </div>
                <div className="cust-form-group">
                  <label>Người liên hệ</label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn A"
                    value={newForm.nguoilienhe}
                    onChange={(e) => setNewForm({ ...newForm, nguoilienhe: e.target.value })}
                  />
                </div>
              </div>
              <div className="cust-form-group">
                <label>Số điện thoại liên hệ <span className="cust-req">*</span></label>
                <input
                  type="tel"
                  placeholder="VD: 0912 345 678"
                  value={newForm.sodienthoai}
                  onChange={(e) => setNewForm({ ...newForm, sodienthoai: e.target.value })}
                  required
                />
              </div>
              <div className="cust-form-group">
                <label>Mô tả lỗi <span className="cust-req">*</span></label>
                <textarea
                  placeholder="Mô tả chi tiết tình trạng hư hỏng của máy..."
                  value={newForm.motaloi}
                  onChange={(e) => setNewForm({ ...newForm, motaloi: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="cust-modal-footer">
                <button type="button" className="btn-cust-cancel" onClick={() => setShowNewRequest(false)}>Hủy</button>
                <button type="submit" className="cust-btn-submit-orange">📤 Gửi yêu cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Xem báo giá chi tiết */}
      <BaoGia 
        isOpen={showBaoGia} 
        onClose={() => { setShowBaoGia(false); setSelectedBaoGia(null); }} 
        phieu={selectedBaoGia}
        readOnly={true}
      />

      {/* Modal: Phê duyệt */}
      {showApprove && (
        <div className="cust-modal-overlay" onClick={() => setShowApprove(false)}>
          <div className="cust-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-icon">✔️</div>
            <h3 className="cust-modal-title">Xác nhận phê duyệt</h3>
            <p className="cust-modal-desc">
              Bạn đồng ý với toàn bộ nội dung và chi phí trong báo giá này.<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="cust-modal-footer">
              <button className="btn-cust-cancel" onClick={() => setShowApprove(false)}>Hủy</button>
              <button className="btn-cust-confirm-green" onClick={handlePheDuyet} disabled={dangXuLy}>
                {dangXuLy ? '⏳ Đang xử lý...' : '✔️ Xác nhận phê duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận nghiệm thu */}
      {showConfirmNghiemThu && nghiemThuTarget && (
        <div className="cust-modal-overlay" onClick={() => setShowConfirmNghiemThu(false)}>
          <div className="cust-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-icon">🔖</div>
            <h3 className="cust-modal-title">Xác nhận nghiệm thu</h3>
            <p className="cust-modal-desc">
              Bạn xác nhận đã nhận bàn giao và kiểm tra máy <strong>{nghiemThuTarget.modelmay}</strong> sau khi sửa chữa xong.<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="cust-modal-footer">
              <button className="btn-cust-cancel" onClick={() => setShowConfirmNghiemThu(false)}>Hủy</button>
              <button className="btn-cust-confirm-green" onClick={handleXacNhanNghiemThu} disabled={dangXuLy}>
                {dangXuLy ? '⏳ Đang xử lý...' : '✔️ Xác nhận nghiệm thu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Yêu cầu điều chỉnh */}
      {showAdjust && (
        <div className="cust-modal-overlay" onClick={() => setShowAdjust(false)}>
          <div className="cust-modal-box cust-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="cust-modal-icon">📝</div>
            <h3 className="cust-modal-title">Yêu cầu điều chỉnh</h3>
            <p className="cust-modal-desc">Mô tả nội dung bạn muốn điều chỉnh trong báo giá:</p>
            <textarea
              className="cust-adjust-textarea"
              style={{ position: 'relative', zIndex: 1001 }}
              placeholder="VD: Đề nghị giảm chi phí vận chuyển, thay thế phụ tùng chính hãng..."
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              rows={4}
              autoFocus
            />
            <div className="cust-modal-footer">
              <button className="btn-cust-cancel" onClick={() => setShowAdjust(false)}>Hủy</button>
              <button
                className="btn-cust-confirm-purple"
                onClick={handleGuiDieuChinh}
                disabled={!adjustNote.trim() || dangXuLy}
              >
                {dangXuLy ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
