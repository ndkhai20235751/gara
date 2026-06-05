import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import OwnerDashboard from './pages/Owner';
import TechnicianDashboard from './pages/Technicians';
import AccountantDashboard from './pages/Accountant';
import CustomerDashboard from './pages/Customers';

function App() {
  const [nguoiDungDangNhap, setNguoiDungDangNhap] = useState(null);
  const [trang, setTrang] = useState('login'); // 'login' | 'register'

  // Kiểm tra khi vào trang: đã đăng nhập trong tab này chưa?
  useEffect(() => {
    const duLieu = sessionStorage.getItem('nguoiDung');
    if (duLieu) {
      const user = JSON.parse(duLieu);
      setNguoiDungDangNhap(user);

      // Cập nhật title ngay khi load từ sessionStorage
      const titleMap = {
        'chuxuong': 'CHỦ XƯỞNG - HÓA ĐƠN ĐIỆN TỬ',
        'thokythuat': 'THỢ KỸ THUẬT - HÓA ĐƠN ĐIỆN TỬ',
        'ketoan': 'KẾ TOÁN - HÓA ĐƠN ĐIỆN TỬ',
        'khachhang': 'KHÁCH HÀNG - HÓA ĐƠN ĐIỆN TỬ',
      };
      document.title = titleMap[user.vai_tro] || 'HÓA ĐƠN ĐIỆN TỬ';
    }
  }, []);

  // Khi Login component báo đăng nhập thành công
  const handleDangNhapThanhCong = (nguoiDung) => {
    setNguoiDungDangNhap(nguoiDung);
  };

  // Cập nhật title khi vai trò thay đổi
  useEffect(() => {
    if (!nguoiDungDangNhap) return;

    const titleMap = {
      'chuxuong': 'CHỦ XƯỞNG - HÓA ĐƠN ĐIỆN TỬ',
      'thokythuat': 'THỢ KỸ THUẬT - HÓA ĐƠN ĐIỆN TỬ',
      'ketoan': 'KẾ TOÁN - HÓA ĐƠN ĐIỆN TỬ',
      'khachhang': 'KHÁCH HÀNG - HÓA ĐƠN ĐIỆN TỬ',
    };
    document.title = titleMap[nguoiDungDangNhap.vai_tro] || 'HÓA ĐƠN ĐIỆN TỬ';
  }, [nguoiDungDangNhap]);

  // Đăng xuất
  const handleDangXuat = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('nguoiDung');
    setNguoiDungDangNhap(null);
  };

  // Chưa đăng nhập → hiện Login hoặc Register
  if (!nguoiDungDangNhap) {
    if (trang === 'register') {
      return <Register onGoToLogin={() => setTrang('login')} />;
    }
    return <Login onLogin={handleDangNhapThanhCong} onGoToRegister={() => setTrang('register')} />;
  }

  // Đã đăng nhập → hiện dashboard theo vai trò
  const { vai_tro } = nguoiDungDangNhap;

  if (vai_tro === 'chuxuong') {
    return <OwnerDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'thokythuat') {
    return <TechnicianDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'ketoan') {
    return <AccountantDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  if (vai_tro === 'khachhang') {
    return <CustomerDashboard nguoiDung={nguoiDungDangNhap} onDangXuat={handleDangXuat} />;
  }

  // Vai trò không xác định
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Vai trò không hợp lệ. <button onClick={handleDangXuat}>Đăng xuất</button></p>
    </div>
  );
}

export default App;