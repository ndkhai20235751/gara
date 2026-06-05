import React, { useState, useEffect, useCallback } from 'react';
import './BaoGia.css';

const EMPTY_INFO = { kinhGui: '', diaChi: '', sdt: '', nguoiLienHe: '', tenMay: '' };

function BaoGia({ isOpen, onClose, phieu, onSave, dangGui, readOnly }) {
  const [customerInfo, setCustomerInfo] = useState(EMPTY_INFO);
  const [laborList, setLaborList]           = useState([]);
  const [partsList, setPartsList]           = useState([]);
  const [processingList, setProcessingList] = useState([]);
  const [otherList, setOtherList]           = useState([]);

  // Restore dữ liệu khi mở popup
  const loadData = useCallback(() => {
    if (!phieu) return;

    const baoGia = phieu.phieu_bao_gia;

    if (baoGia && baoGia.mabaogia) {
      // Đã có báo giá - load dữ liệu
      const saved = baoGia.noidung;
      
      if (saved) {
        // Load từ noidung (JSON)
        const ci = saved.customerInfo || {};
        setCustomerInfo({
          kinhGui: ci.kinhGui || baoGia.tendonvi || '',
          diaChi: ci.diaChi || baoGia.diachidonvi || '',
          sdt: ci.sdt || baoGia.sodienthoaidonvi || '',
          nguoiLienHe: ci.nguoiLienHe || '',
          tenMay: ci.tenMay || '',
        });
        setLaborList(saved.laborList || []);
        setPartsList(saved.partsList || []);
        setProcessingList(saved.processingList || []);
        setOtherList(saved.otherList || []);
      } else {
        // Load từ các cột riêng lẻ
        setCustomerInfo({
          kinhGui: baoGia.tendonvi || '',
          diaChi: baoGia.diachidonvi || '',
          sdt: baoGia.sodienthoaidonvi || '',
          nguoiLienHe: '',
          tenMay: '',
        });
        setLaborList([]);
        setPartsList([]);
        setProcessingList([]);
        setOtherList([]);
      }
    } else {
      // Chưa có báo giá - reset form
      setCustomerInfo(EMPTY_INFO);
      setLaborList([]);
      setPartsList([]);
      setProcessingList([]);
      setOtherList([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phieu?.mabaokham, phieu?.phieu_bao_gia?.mabaogia]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (listType, id, field, value) => {
    const updateList = (list) => list.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated[field] = Number(value) || 0;
        }
        return updated;
      }
      return item;
    });
    if (listType === 'labor') setLaborList(updateList);
    if (listType === 'parts') setPartsList(updateList);
    if (listType === 'processing') setProcessingList(updateList);
    if (listType === 'other') setOtherList(updateList);
  };

  const handleAddItem = (listType) => {
    const newItem = { id: Date.now(), name: '', unit: '', quantity: 1, price: 0 };
    if (listType === 'labor') setLaborList(prev => [...prev, newItem]);
    if (listType === 'parts') setPartsList(prev => [...prev, newItem]);
    if (listType === 'processing') setProcessingList(prev => [...prev, newItem]);
    if (listType === 'other') setOtherList(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (listType, id) => {
    if (listType === 'labor') setLaborList(prev => prev.filter(item => item.id !== id));
    if (listType === 'parts') setPartsList(prev => prev.filter(item => item.id !== id));
    if (listType === 'processing') setProcessingList(prev => prev.filter(item => item.id !== id));
    if (listType === 'other') setOtherList(prev => prev.filter(item => item.id !== id));
  };

  const calculateSectionTotal = (list) =>
    list.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const grandTotal =
    calculateSectionTotal(laborList) +
    calculateSectionTotal(partsList) +
    calculateSectionTotal(processingList) +
    calculateSectionTotal(otherList);

  const formatMoneyToWords = (amount) => {
    if (amount === 0) return 'Không đồng chẵn./';
    return amount.toLocaleString('vi-VN') + ' đồng chẵn./';
  };

  const renderTableRows = (list, listType, labelGroup) => (
    <>
      <tr className="group-row">
        <td className="center bold">{labelGroup}</td>
        <td className="bold" colSpan="5">
          {listType === 'labor' ? 'Nhân công' : listType === 'parts' ? 'Phụ tùng' : listType === 'processing' ? 'Gia công' : 'Chi phí khác'}
        </td>
      </tr>
      {list.map((item, index) => (
        <tr key={item.id}>
          <td className="center">{index + 1}</td>
          <td>
            <input type="text" className="editable-input text-left" value={item.name}
              onChange={(e) => handleItemChange(listType, item.id, 'name', e.target.value)}
              placeholder="Nhập tên hạng mục..." readOnly={readOnly} />
          </td>
          <td className="center">
            <input type="text" className="editable-input text-center" value={item.unit}
              onChange={(e) => handleItemChange(listType, item.id, 'unit', e.target.value)}
              placeholder="đv" readOnly={readOnly} />
          </td>
          <td className="center">
            <input type="number" className="editable-input text-center"
              value={item.quantity === 0 ? '' : item.quantity}
              onChange={(e) => handleItemChange(listType, item.id, 'quantity', e.target.value)}
              placeholder="0" readOnly={readOnly} />
          </td>
          <td className="right">
            <input type="number" className="editable-input text-right"
              value={item.price === 0 ? '' : item.price}
              onChange={(e) => handleItemChange(listType, item.id, 'price', e.target.value)}
              placeholder="0" readOnly={readOnly} />
          </td>
          <td className="right relative-cell">
            <span className="amount-text">{(item.quantity * item.price).toLocaleString('vi-VN')}</span>
            {!readOnly && (
              <button className="btn-delete-row no-print" onClick={() => handleRemoveItem(listType, item.id)}>×</button>
            )}
          </td>
        </tr>
      ))}
      {!readOnly && (
        <tr className="no-print action-row-inside">
          <td colSpan="6">
            <button className="btn-add-row" onClick={() => handleAddItem(listType)}>
              + Thêm mục ({listType === 'labor' ? 'nhân công' : listType === 'parts' ? 'phụ tùng' : listType === 'processing' ? 'gia công' : 'chi phí'})
            </button>
          </td>
        </tr>
      )}
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header-actions no-print">
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
          {onSave && !readOnly && (
            <button className="btn-secondary" style={{ background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}
              disabled={dangGui}
              onClick={() => onSave({
                mabaogia: phieu?.phieu_bao_gia?.mabaogia || null,
                tendonvi: customerInfo.kinhGui,
                diachidonvi: customerInfo.diaChi,
                sodienthoaidonvi: customerInfo.sdt,
                chiphinhancong: calculateSectionTotal(laborList),
                chiphiphutung:  calculateSectionTotal(partsList),
                chiphikhac:     calculateSectionTotal(processingList) + calculateSectionTotal(otherList),
                tongcong:       grandTotal,
                noidung: {
                  customerInfo,
                  laborList,
                  partsList,
                  processingList,
                  otherList,
                },
              })}>
              {dangGui ? '⏳ Đang lưu...' : '💾 Lưu báo giá'}
            </button>
          )}
          <button className="btn-primary" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            In báo giá (PDF)
          </button>
        </div>

        <div className="quotation-document-paper">

          <div className="doc-header">
            <h1 className="company-name">MÁY CÔNG TRÌNH KHÁNH NGUYÊN</h1>
            <p className="company-meta">SĐT: 086 289 2021</p>
            <p className="company-meta italic">Địa chỉ: Số 629, Tổ 36, Phường Cự Khối, Quận Long Biên, Thành Phố Hà Nội</p>
            <div className="doc-date">Hà Nội, Ngày {new Date().getDate()} Tháng {new Date().getMonth() + 1} Năm {new Date().getFullYear()}</div>
          </div>

          <table className="info-grid-table">
            <tbody>
              <tr>
                <td className="w-50">
                  <span className="bold">Kính gửi:</span>
                  <input type="text" name="kinhGui" className="editable-input-header" value={customerInfo.kinhGui} onChange={handleCustomerChange} placeholder="Nhập tên đơn vị..." readOnly={readOnly} />
                </td>
                <td className="w-50">
                  <span className="bold">Địa chỉ:</span>
                  <input type="text" name="diaChi" className="editable-input-header" value={customerInfo.diaChi} onChange={handleCustomerChange} placeholder="Nhập địa chỉ..." readOnly={readOnly} />
                </td>
              </tr>
              <tr>
                <td className="w-50">
                  <span className="bold">Người liên hệ:</span>
                  <input type="text" name="nguoiLienHe" className="editable-input-header" value={customerInfo.nguoiLienHe} onChange={handleCustomerChange} placeholder="Nhập tên người liên hệ..." readOnly={readOnly} />
                </td>
                <td className="w-50">
                  <span className="bold">SĐT:</span>
                  <input type="text" name="sdt" className="editable-input-header" value={customerInfo.sdt} onChange={handleCustomerChange} placeholder="Nhập SĐT..." readOnly={readOnly} />
                </td>
              </tr>
            </tbody>
          </table>

          <div className="doc-title-section">
            <h2 className="main-title">BẢNG GIÁ DỊCH VỤ</h2>
            <div className="intro-text-flex">
              Chúng tôi xin chân thành cảm ơn sự quan tâm của Quý Công ty với dịch vụ do chúng tôi cung cấp. Sau đây, chúng tôi xin gửi tới Quý Công ty bảng giá sản phẩm dịch vụ sửa chữa
              <input type="text" name="tenMay" className="editable-input-inline bold" value={customerInfo.tenMay} onChange={handleCustomerChange} placeholder="[Nhập tên máy]" readOnly={readOnly} />
              theo yêu cầu của Quý khách như sau:
            </div>
          </div>

          <h3 className="section-title">GIÁ DỊCH VỤ</h3>

          <table className="data-pricing-table">
            <thead>
              <tr>
                <th style={{ width: '6%' }}>STT</th>
                <th style={{ width: '46%', textAlign: 'left' }}>Tên hạng mục và phụ tùng sửa chữa</th>
                <th style={{ width: '8%' }}>ĐVT</th>
                <th style={{ width: '6%' }}>SL</th>
                <th style={{ width: '14%' }}>Đơn giá (VND)</th>
                <th style={{ width: '20%' }}>Thành Tiền (VND)</th>
              </tr>
            </thead>
            <tbody>
              {renderTableRows(laborList, 'labor', 'I')}
              {renderTableRows(partsList, 'parts', 'II')}
              {renderTableRows(processingList, 'processing', 'III')}
              {renderTableRows(otherList, 'other', 'IV')}
              <tr className="total-row">
                <td className="bold uppercase" colSpan="5">TỔNG</td>
                <td className="right bold" style={{ fontSize: '14px', color: '#000' }}>
                  {grandTotal.toLocaleString('vi-VN')}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="words-total italic">
            Bằng chữ: <span className="bold">{formatMoneyToWords(grandTotal)}</span>
          </div>

          <div className="commercial-conditions">
            <h4 className="conditions-title">ĐIỀU KIỆN THƯƠNG MẠI</h4>
            <ol className="conditions-list">
              <li><span className="bold">Tiêu chuẩn kỹ thuật:</span> Đáp ứng đúng tiêu chuẩn kỹ thuật của nhà sản xuất.</li>
              <li>
                <span className="bold">Thanh toán:</span> Thanh toán 100% bằng VNĐ qua phương thức chuyển khoản.
                <ul className="sub-list">
                  <li><span className="bold">Tên tài khoản:</span> Nguyễn Văn Khánh</li>
                  <li><span className="bold">Số tài khoản:</span> 1268300490 tại Techcombank</li>
                </ul>
              </li>
              <li><span className="bold">Thời hạn hiệu lực:</span> 7 ngày kể từ ngày báo giá.</li>
            </ol>
          </div>

          <div className="doc-footer">
            <div className="footer-line"></div>
            <div className="footer-contact-grid">
              <span className="bold">Nguyễn Văn Khánh</span>
              <span>Hotline (zalo): 086 289 2021</span>
              <span>Email: nguyennhatnguyen2892021@gmail.com</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default BaoGia;
