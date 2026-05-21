ZKP Identity - UI/UX Design System GuidelinesTài liệu này quy định các tiêu chuẩn thiết kế UI/UX cho hệ thống ZKP Identity. Mục tiêu là tạo ra một giao diện Cao cấp (Premium), Bảo mật (Secure), Kính mờ (Glassmorphism) và Phản hồi linh hoạt (Fully Responsive) hỗ trợ hoàn hảo cả Light Mode và Dark Mode.1. Hệ thống màu sắc (Color Palette)Hệ thống sử dụng CSS Variables để tự động chuyển đổi giữa Light và Dark mode. Màu sắc được phân chia theo vai trò (Role-based) để người dùng dễ nhận diện.CSS Variables (Đặt ở :root hoặc Global CSS)CSS:root {
  /* Nền và Khung (Light Mode default) */
  --bg-color: #f8fafc;          /* Nền trang web */
  --card-bg: rgba(255, 255, 255, 0.8); /* Nền thẻ card kính mờ */
  --card-border: rgba(0, 0, 0, 0.06);  /* Viền thẻ */
  
  /* Text */
  --text-main: #0f172a;         /* Text chính (Tiêu đề, nội dung) */
  --text-muted: #64748b;        /* Text phụ (Label, mô tả) */
  
  /* Input & Controls */
  --input-bg: #ffffff;
  --input-border: #cbd5e1;
  
  /* Role Colors - Doctor (Teal) */
  --primary-doc: #0d9488;
  --primary-doc-hover: #0f766e;
  
  /* Role Colors - Admin (Indigo) */
  --primary-adm: #4f46e5;
  --primary-adm-hover: #4338ca;
  
  /* Trạng thái */
  --error: #ef4444;
  --success: #10b981;
}

[data-theme="dark"] {
  --bg-color: #0f172a;
  --card-bg: rgba(30, 41, 59, 0.7);
  --card-border: rgba(255, 255, 255, 0.08);
  --text-main: #f8fafc;
  --text-muted: #94a3b8;
  --input-bg: #0f172a;
  --input-border: #334155;
  --primary-doc: #2dd4bf;       /* Sáng hơn để nổi bật trên nền tối */
  --primary-doc-hover: #14b8a6;
  --primary-adm: #818cf8;       /* Sáng hơn để nổi bật trên nền tối */
  --primary-adm-hover: #6366f1;
}
2. Typography (Nghệ thuật chữ)Font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif (Sử dụng font hệ thống để tối ưu tốc độ load và tạo cảm giác native).Tiêu đề (Headings): Font-weight 700 hoặc 800, letter-spacing hơi âm (-0.01em đến -0.02em) để tạo cảm giác hiện đại.Form Label: Rất quan trọng. Phải viết HOA toàn bộ, size nhỏ, in đậm và giãn chữ.Quy chuẩn CSS: font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);3. Kiến trúc Component (UI Components)3.1. Thẻ Kính mờ (Glassmorphism Card)Sử dụng cho form đăng nhập, modal, hoặc các khối thông tin quan trọng nhằm tôn lên vẻ đẹp của hệ thống Web3.CSS.saas-glass-card {
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
}
3.2. Form Input (Ô nhập liệu)Inputs cần to, rõ ràng và có hiệu ứng focus nổi bật phát sáng (Glow effect) theo màu chủ đề.CSS.saas-input {
  width: 100%;
  height: 48px; /* Dùng 38px cho các modal đông đúc */
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 12px; /* Modal: 6px */
  color: var(--text-main);
  outline: none;
  transition: all 0.2s ease;
}
/* Hiệu ứng Focus chuẩn Premium */
.saas-input:focus {
  border-color: var(--primary-doc); /* Thay đổi theo Role */
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.2); 
}
3.3. Nút bấm (Buttons)Nút bấm nguyên khối (Solid), khi hover sẽ hơi nảy lên (translateY) và đổ bóng cùng màu.CSS.saas-btn {
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.saas-btn:hover {
  transform: translateY(-1px);
  /* Bóng màu theo theme button */
  box-shadow: 0 6px 15px rgba(var(--primary-color-rgb), 0.3);
}
4. Bố cục & Responsive (Layout System)Hệ thống form (ví dụ tạo tài khoản, nhập liệu hồ sơ) phải tuân thủ chuẩn tự động co giãn bằng Media Queries:Kích thước màn hìnhGrid Form (Số cột)Chi tiết CSS Form tham khảoDesktop (>900px)3 Cột / 2 Cộtgrid-template-columns: 1fr 1fr 1fr;Tablet (681px - 900px)2 Cộtgrid-template-columns: 1fr 1fr;Mobile (<=680px)1 Cột (Dọc)grid-template-columns: 1fr;Lưu ý cho Mobile: Bỏ tất cả khoảng trống thừa (margins, paddings quá lớn) và cố định max-height của Modals là calc(100vh - 24px) để chừa không gian hiển thị bàn phím ảo.5. Animation (Hiệu ứng)Mọi khối xuất hiện trên màn hình không được "hiện ra" đột ngột. Bắt buộc phải có animation.Slide Up Fade (Dùng cho Card / Trang mới tải):CSS@keyframes slideUpFade { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}
Scale Up (Dùng cho Popup / Modal):CSS@keyframes modalScaleUp { 
  from { transform: scale(0.96); opacity: 0; } 
  to { transform: scale(1); opacity: 1; } 
}