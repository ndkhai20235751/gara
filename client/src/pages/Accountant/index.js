import React, { useState, useEffect, useCallback } from 'react';
import './style.css';
import BaoGia from './Popus/BaoGia';
import { layPhieuChoBaoGia, taoBaoGia, layYeuCauDieuChinh, layChiTietBaoGiaDieuChinh } from '../../services/api';

export default function AccountantDashboard({ nguoiDung, onDangXuat }) {
  const [phieuList, setPhieuList] = useState([]);
  const [dangTai, setDangTai]     = useState(true);
  const [loiApi, setLoiApi]       = useState('');

  // Yêu cầu điều chỉnh từ khách hàng
  const [yeuCauDieuChinhList, setYeuCauDieuChinhList] = useState([]);
  const [dangTaiYeuCau, setDangTaiYeuCau] = useState(true);

  // BaoGia popup state
  const [showBaoGia, setShowBaoGia]     = useState(false);
  const [selectedPhieu, setSelectedPhieu] = useState(null);
  const [dangGui, setDangGui]           = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoiApi('');
    try {
      const res = await layPhieuChoBaoGia();
      setPhieuList(res.danhSach || []);
    } catch (err) {
      setLoiApi('Không tải được dữ liệu: ' + err.message);
    } finally {
      setDangTai(false);
    }
  }, []);

  // Tải yêu cầu điều chỉnh từ khách hàng
  const taiYeuCauDieuChinh = useCallback(async () => {
    setDangTaiYeuCau(true);
    try {
      const res = await layYeuCauDieuChinh();
      setYeuCauDieuChinhList(res.danhSach || []);
    } catch (err) {
      console.error('Lỗi tải yêu cầu điều chỉnh:', err);
    } finally {
      setDangTaiYeuCau(false);
    }
  }, []);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);
  useEffect(() => { taiYeuCauDieuChinh(); }, [taiYeuCauDieuChinh]);

  // Xem chi tiết yêu cầu điều chỉnh
  const handleXemYeuCau = async (item) => {
    try {
      const res = await layChiTietBaoGiaDieuChinh(item.mabaogia);
      const phieu = {
        mabaokham: res.chiTiet.phieu_bao_kham?.mabaokham,
        phieu_bao_gia: res.chiTiet,
        lenh_sua_chua: res.chiTiet.phieu_bao_kham?.lenh_sua_chua,
      };
      setSelectedPhieu(phieu);
      setShowBaoGia(true);
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleMoBaoGia = (phieu) => {
    setSelectedPhieu(phieu);
    setShowBaoGia(true);
  };

  const handleLuuBaoGia = async ({ mabaogia, tendonvi, diachidonvi, sodienthoaidonvi, chiphinhancong, chiphiphutung, chiphikhac, tongcong, noidung }) => {
    if (!selectedPhieu) return;
    setDangGui(true);
    try {
      await taoBaoGia({
        mabaogia,
        mabaokham:      selectedPhieu.mabaokham,
        mayeucau:       selectedPhieu.lenh_sua_chua?.phieu_yeu_cau?.mayeucau,
        tendonvi,
        diachidonvi,
        sodienthoaidonvi,
        chiphinhancong,
        chiphiphutung,
        chiphikhac,
        tongcong,
        noidung,
      });
      setShowBaoGia(false);
      setSelectedPhieu(null);
      await taiDuLieu();
      await taiYeuCauDieuChinh();
    } catch (err) {
      alert('Lỗi lưu báo giá: ' + err.message);
    } finally {
      setDangGui(false);
    }
  };

  // Tách nội dung motachitiet thành object
  const parseNoiDung = (text = '') => {
    const lines = text.split('\n');
    const get = (label) => {
      const line = lines.find((l) => l.startsWith(label));
      return line ? line.replace(label, '').trim() : '';
    };
    return {
      sogiodongho: get('Số giờ đồng hồ:'),
      chandoan:    get('Chẩn đoán:'),
      phutung:     get('Phụ tùng cần thay:'),
      giocong:     get('Giờ công dự kiến:'),
      ghichu:      get('Ghi chú:'),
    };
  };

  const getPYC = (p) => p.lenh_sua_chua?.phieu_yeu_cau;
  const getBaoGia = (p) => p.phieu_bao_gia;
  const choBaoGia = phieuList.filter((p) => !getBaoGia(p)?.mabaogia);
  const daBaoGia  = phieuList.filter((p) => !!getBaoGia(p)?.mabaogia);

  // State cho tabs
  const [activeTab, setActiveTab] = useState('phieugiamdinh'); // 'yeucau' | 'phieugiamdinh'

  return (
    <div className="accountant-dashboard">

      {/* Header */}
      <div className="acc-header">
        <div className="header-left">
          <div className="acc-icon-box">🖨️</div>
          <div>
            <h1>Dashboard Kế toán</h1>
            <p className="acc-sub">{nguoiDung?.ho_ten || 'Quản lý báo giá & thanh toán'}</p>
          </div>
        </div>
        <div className="header-right">
          <button onClick={onDangXuat} className="btn-logout">Đăng xuất</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem 1rem' }}>
        <div className="acc-stat-card" style={{ background: '#fef3c7', borderRadius: '0.75rem', padding: '1rem 1.5rem', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>{choBaoGia.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#92400e' }}>Chờ báo giá</div>
        </div>
        <div className="acc-stat-card" style={{ background: '#d1fae5', borderRadius: '0.75rem', padding: '1rem 1.5rem', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669' }}>{daBaoGia.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#065f46' }}>Đã báo giá</div>
        </div>
        <div className="acc-stat-card" style={{ background: '#fee2e2', borderRadius: '0.75rem', padding: '1rem 1.5rem', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626' }}>{yeuCauDieuChinhList.length}</div>
          <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>Cần điều chỉnh</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="acc-tabs">
        <button 
          className={`acc-tab ${activeTab === 'yeucau' ? 'active' : ''}`}
          onClick={() => setActiveTab('yeucau')}
        >
          📋 Yêu cầu khách hàng
          {yeuCauDieuChinhList.length > 0 && <span className="tab-badge">{yeuCauDieuChinhList.length}</span>}
        </button>
        <button 
          className={`acc-tab ${activeTab === 'phieugiamdinh' ? 'active' : ''}`}
          onClick={() => setActiveTab('phieugiamdinh')}
        >
          🔧 Phiếu giám định
          <span className="tab-count">{phieuList.length}</span>
        </button>
      </div>

      {/* TAB YÊU CẦU KHÁCH HÀNG */}
      {activeTab === 'yeucau' && (
        <div className="yeucau-container">
          {dangTaiYeuCau && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Đang tải...</div>}
          
          {yeuCauDieuChinhList.length === 0 && !dangTaiYeuCau ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h3>Không có yêu cầu nào</h3>
              <p>Tất cả yêu cầu điều chỉnh từ khách hàng sẽ hiển thị tại đây</p>
            </div>
          ) : (
            <div className="yeucau-list">
              {yeuCauDieuChinhList.map(item => {
                const pyc = item.phieu_bao_kham?.lenh_sua_chua?.phieu_yeu_cau;
                const khachHang = pyc?.khach_hang;
                const lyDo = item.noidung?.lydieuchinh || pyc?.motaloi || '';
                
                return (
                  <div key={item.mabaogia} className="yeucau-card chua-doc">
                    <div className="yeucau-card-header">
                      <div className="yeucau-header-left">
                        <span className="yeucau-id">Báo giá #{item.mabaogia}</span>
                        <span className="yeucau-new">MỚI</span>
                      </div>
                      <div className="yeucau-header-right">
                        <span className="yeucau-date">
                          📅 {item.thoigiandapung ? new Date(item.thoigiandapung).toLocaleDateString('vi-VN', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          }) : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="yeucau-card-body">
                      <div className="yeucau-info-row">
                        <span className="yeucau-label">🏢 Khách hàng:</span>
                        <span className="yeucau-value">{khachHang?.tencongty || '—'}</span>
                      </div>
                      <div className="yeucau-info-row">
                        <span className="yeucau-label">📧 Điện thoại:</span>
                        <span className="yeucau-value">{khachHang?.sodienthoai || '—'}</span>
                      </div>
                      <div className="yeucau-info-row">
                        <span className="yeucau-label">📝 Lý do điều chỉnh:</span>
                      </div>
                      <div className="yeucau-lydo-box">
                        {lyDo}
                      </div>
                    </div>
                    
                    <div className="yeucau-card-footer">
                      <button 
                        className="btn-chinh-sua"
                        onClick={() => handleXemYeuCau(item)}
                      >
                        📄 Xem & Chỉnh sửa báo giá
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {dangTai && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Đang tải...</div>}
      {loiApi  && <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626' }}>{loiApi}</div>}

      {!dangTai && phieuList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Chưa có phiếu giám định nào từ thợ.
        </div>
      )}

      {/* TAB PHIẾU GIÁM ĐỊNH */}
      {activeTab === 'phieugiamdinh' && (
        <div className="phieugiamdinh-container">
          {dangTai && <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Đang tải...</div>}
          {loiApi && <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626' }}>{loiApi}</div>}

          {!dangTai && phieuList.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Chưa có phiếu giám định</h3>
              <p>Phiếu giám định từ thợ sẽ hiển thị tại đây</p>
            </div>
          )}

          <div className="invoices-list">
            {phieuList.map((phieu) => {
              const nd       = parseNoiDung(phieu.motachitiet);
              const pyc      = getPYC(phieu);
              const baoGia  = getBaoGia(phieu);
              const daBaoGiaRoi = !!baoGia?.mabaogia;
              const tenKH    = pyc?.khach_hang?.tencongty || '—';
              const tenMay   = pyc?.modelmay || '—';
              const tenTho   = phieu.lenh_sua_chua?.tho_ky_thuat?.hoten || '—';
              const ngayLap  = phieu.thoigianlap
                ? new Date(phieu.thoigianlap).toLocaleDateString('vi-VN') : '';

              return (
                <div key={phieu.mabaokham} className="invoice-card">
                  <div className="invoice-card-header">
                    <div className="invoice-title-group">
                      <span className="invoice-id">Phiếu #{phieu.mabaokham}</span>
                      <span className={`invoice-status-badge ${daBaoGiaRoi ? 'status-sent' : 'status-pending'}`}>
                        {daBaoGiaRoi ? 'Đã báo giá' : 'Chờ báo giá'}
                      </span>
                    </div>
                    <div className="invoice-actions">
                      <button onClick={() => setDetailTarget(pyc)} className="btn-acc-detail">
                        👁 Chi tiết
                      </button>
                      {!daBaoGiaRoi ? (
                        <button onClick={() => handleMoBaoGia(phieu)} className="btn-create">
                          📝 Tạo báo giá
                        </button>
                      ) : (
                        <button onClick={() => handleMoBaoGia(phieu)} className="btn-edit">
                          📄 Xem / In báo giá
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="invoice-card-body">
                    <h3 className="company-client-name">{tenKH}</h3>
                    <p className="machine-title">{tenMay}</p>
                    <p className="tech-meta">Thợ: {tenTho} | Ngày lập: {ngayLap}</p>

                    {nd.chandoan && (
                      <div className="diagnosis-box">
                        <span className="box-title">Chẩn đoán kỹ thuật:</span>
                        <p className="box-content">{nd.chandoan}</p>
                      </div>
                    )}

                    {nd.phutung && (
                      <div className="parts-section">
                        <span className="box-title">Phụ tùng cần thay:</span>
                        <div className="parts-badges-group">
                          {nd.phutung.split(',').map((p, i) => (
                            <span key={i} className="part-badge">{p.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {nd.sogiodongho && (
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>
                        Giờ đồng hồ: {nd.sogiodongho} | Giờ công dự kiến: {nd.giocong}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Chi tiết phiếu yêu cầu */}
      {detailTarget && (
        <div className="acc-modal-overlay" onClick={() => setDetailTarget(null)}>
          <div className="acc-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="acc-modal-head">
              <h3>📋 Chi tiết phiếu yêu cầu</h3>
              <button className="acc-modal-close" onClick={() => setDetailTarget(null)}>×</button>
            </div>
            <div className="acc-detail-grid">
              <div className="acc-detail-item">
                <div className="acc-detail-lbl">Khách hàng</div>
                <div className="acc-detail-val">{detailTarget?.khach_hang?.tencongty || '—'}</div>
              </div>
              <div className="acc-detail-item">
                <div className="acc-detail-lbl">Thiết bị / Model máy</div>
                <div className="acc-detail-val">{detailTarget?.modelmay || '—'}</div>
              </div>
              <div className="acc-detail-item acc-detail-full">
                <div className="acc-detail-lbl">Vị trí công trường</div>
                <div className="acc-detail-val">📍 {detailTarget?.vitricongtruong || '—'}</div>
              </div>
              <div className="acc-detail-item">
                <div className="acc-detail-lbl">Người liên hệ</div>
                <div className="acc-detail-val">{detailTarget?.nguoilienhe || '—'}</div>
              </div>
              <div className="acc-detail-item">
                <div className="acc-detail-lbl">Số điện thoại</div>
                <div className="acc-detail-val">
                  {detailTarget?.sodienthoai
                    ? <a href={`tel:${detailTarget.sodienthoai}`} style={{ color: '#16a34a', fontWeight: 600 }}>📞 {detailTarget.sodienthoai}</a>
                    : '—'}
                </div>
              </div>
              <div className="acc-detail-item acc-detail-full">
                <div className="acc-detail-lbl">Mô tả hư hỏng</div>
                <div className="acc-detail-val" style={{ whiteSpace: 'pre-wrap' }}>{detailTarget?.motaloi || '—'}</div>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="btn-acc-close" onClick={() => setDetailTarget(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      <BaoGia
        key={selectedPhieu?.mabaokham}
        isOpen={showBaoGia}
        onClose={() => { setShowBaoGia(false); setSelectedPhieu(null); }}
        phieu={selectedPhieu}
        onSave={handleLuuBaoGia}
        dangGui={dangGui}
      />
    </div>
  );
}
