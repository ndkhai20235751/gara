import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const authHeader = () => ({ Authorization: `Bearer ${sessionStorage.getItem('token')}` });

const handleError = (error) => {
  if (error.response) throw new Error(error.response.data.message || 'Lỗi từ server');
  throw new Error('Không kết nối được đến server');
};

// ─── AUTH ──────────────────────────────────────────────────────────────────────

export const dangNhap = async (email, matkhau, vaitro) => {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, matkhau, vaitro });
    return res.data;
  } catch (error) { handleError(error); }
};

export const dangKy = async ({ hoten, sodienthoai, email, matkhau, vaitro }) => {
  try {
    const res = await axios.post(`${API_URL}/auth/register`, { hoten, sodienthoai, email, matkhau, vaitro });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── KHÁCH HÀNG ────────────────────────────────────────────────────────────────

export const guiYeuCau = async (formData) => {
  try {
    const res = await axios.post(`${API_URL}/phieu-yeu-cau`, formData, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layDanhSachYeuCau = async () => {
  try {
    const res = await axios.get(`${API_URL}/phieu-yeu-cau`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── CHỦ XƯỞNG ─────────────────────────────────────────────────────────────────

export const layTatCaYeuCau = async () => {
  try {
    const res = await axios.get(`${API_URL}/chu-xuong/yeu-cau`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layDanhSachTho = async () => {
  try {
    const res = await axios.get(`${API_URL}/chu-xuong/danh-sach-tho`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const duyetVaPhanCong = async ({ mayeucau, matho, mucdouutien }) => {
  try {
    const res = await axios.post(`${API_URL}/chu-xuong/duyet`, { mayeucau, matho, mucdouutien }, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layTatCaLenh = async () => {
  try {
    const res = await axios.get(`${API_URL}/chu-xuong/lenh`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const tuChoiYeuCau = async (mayeucau) => {
  try {
    const res = await axios.patch(`${API_URL}/chu-xuong/tuchoi/${mayeucau}`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const capNhatTrangThaiYeuCau = async (mayeucau, trangthai) => {
  try {
    const res = await axios.patch(`${API_URL}/chu-xuong/cap-nhat/${mayeucau}`, { trangthai }, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── THỢ KỸ THUẬT ──────────────────────────────────────────────────────────────

export const layLenhCuaTho = async () => {
  try {
    const res = await axios.get(`${API_URL}/tho/lenh`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const nhanLenh = async (malenh) => {
  try {
    const res = await axios.patch(`${API_URL}/tho/lenh/${malenh}/nhan`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const denHienTruong = async (malenh) => {
  try {
    const res = await axios.patch(`${API_URL}/tho/lenh/${malenh}/den`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const nopPhieuGiamDinh = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/tho/phieu-bao-kham`, data, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── KẾ TOÁN ───────────────────────────────────────────────────────────────────

export const layPhieuChoBaoGia = async () => {
  try {
    const res = await axios.get(`${API_URL}/ke-toan/phieu-bao-kham`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layYeuCauDieuChinh = async () => {
  try {
    const res = await axios.get(`${API_URL}/ke-toan/yeu-cau-dieu-chinh`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const taoBaoGia = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/ke-toan/phieu-bao-gia`, data, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── CHỦ XƯỞNG — BÁO GIÁ ───────────────────────────────────────────────────────

export const layBaoGiaChuXuong = async () => {
  try {
    const res = await axios.get(`${API_URL}/chu-xuong/bao-gia`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layChiTietBaoGia = async (mabaogia) => {
  try {
    const res = await axios.get(`${API_URL}/chu-xuong/bao-gia/${mabaogia}`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const suaBaoGia = async (mabaogia, chiPhi) => {
  try {
    const res = await axios.patch(`${API_URL}/chu-xuong/bao-gia/${mabaogia}`, chiPhi, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const duyetVaGuiKhach = async (mabaogia) => {
  try {
    const res = await axios.patch(`${API_URL}/chu-xuong/bao-gia/${mabaogia}/duyet`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── KHÁCH HÀNG — BÁO GIÁ ───────────────────────────────────────────────────

export const layBaoGiaKhachHang = async () => {
  try {
    const res = await axios.get(`${API_URL}/khach-hang/bao-gia`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layChiTietBaoGiaKhachHang = async (mabaogia) => {
  try {
    const res = await axios.get(`${API_URL}/khach-hang/bao-gia/${mabaogia}`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const pheDuyetBaoGia = async (mabaogia) => {
  try {
    const res = await axios.post(`${API_URL}/khach-hang/bao-gia/${mabaogia}/duyet`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const yeuCauDieuChinhBaoGia = async (mabaogia, lydo) => {
  try {
    const res = await axios.post(`${API_URL}/khach-hang/bao-gia/${mabaogia}/dieu-chinh`, { lydo }, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

// ─── THÔNG BÁO ───────────────────────────────────────────────────────────────

export const layThongBao = async () => {
  try {
    const res = await axios.get(`${API_URL}/thong-bao`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const danhDauDaDoc = async (mathongbao) => {
  try {
    const res = await axios.put(`${API_URL}/thong-bao/${mathongbao}/doc`, {}, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};

export const layChiTietBaoGiaDieuChinh = async (mabaogia) => {
  try {
    const res = await axios.get(`${API_URL}/thong-bao/chi-tiet/${mabaogia}`, { headers: authHeader() });
    return res.data;
  } catch (error) { handleError(error); }
};
