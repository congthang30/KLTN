# 🛡️ ZKP Identity Verification System — Hospital Management

Hệ thống xác thực danh tính đa lớp tích hợp **Zero-Knowledge Proofs (ZKP - Groth16)**, **Sinh trắc học nhận diện khuôn mặt kèm kiểm tra thực thể sống (Liveness Detection - MediaPipe & face-api.js)**, và **Blockchain (Solidity & Hardhat)** để bảo vệ hệ thống quản lý bệnh viện.

---

## 📖 Tổng quan dự án

Hệ thống này được phát triển nhằm giải quyết triệt để vấn đề rò rỉ dữ liệu y tế do bị chiếm quyền tài khoản quản trị viên.

Bằng cách áp dụng mô hình bảo mật phi tập trung và Zero-Knowledge Proofs (ZKP), hệ thống đảm bảo:
1. **Admin đăng nhập không cần mật khẩu:** Admin chỉ cần Ví Web3 + Biometric khuôn mặt để tạo ZKP đăng ký và đăng nhập.
2. **Bác sĩ đăng nhập bằng sinh trắc học:** Sau lần thiết lập mật khẩu đầu tiên, Bác sĩ chỉ cần quét khuôn mặt (kiểm tra liveness) để truy cập nhanh chóng và an toàn.
3. **Bảo mật Cookies HTTP-Only:** Phiên đăng nhập được quản lý bằng JWT Token lưu trong Cookie HTTP-Only để chống lại các cuộc tấn công XSS và đánh cắp token.

---

## 🛡️ Kiến trúc bảo mật đa lớp (Multi-layered Security)

Hệ thống bảo vệ dữ liệu nhạy cảm của bệnh viện qua 3 lớp phòng thủ độc lập:

```
                            [ YÊU CẦU TRUY CẬP ]
                                     │
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Lớp 1: Khóa Ví Web3 & Chữ ký mật mã                     │
        │ └─ Kiểm tra quyền hạn ví đã đăng ký on-chain            │
        └────────────────────────────┬────────────────────────────┘
                                     │ (Hợp lệ)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Lớp 2: Quét Sinh trắc học & Kiểm tra Liveness            │
        │ └─ Chống giả mạo ảnh chụp, deepfake bằng cử chỉ đầu    │
        └────────────────────────────┬────────────────────────────┘
                                     │ (Khớp khuôn mặt & Liveness)
                                     ▼
        ┌─────────────────────────────────────────────────────────┐
        │ Lớp 3: Tạo và Kiểm tra Zero-Knowledge Proofs (ZKP)      │
        │ └─ Chứng minh quyền sở hữu cam kết mà không tiết lộ khóa│
        └────────────────────────────┬────────────────────────────┘
                                     │ (Proof hợp lệ)
                                     ▼
                          [ ĐĂNG NHẬP THÀNH CÔNG ]
```

### Chi tiết các lớp bảo mật:
* **Lớp 1: Chữ ký Ví Web3 (Cryptography):** Yêu cầu người dùng ký một thông báo nonce ngẫu nhiên bằng khóa cá nhân thông qua MetaMask. Địa chỉ ví này phải khớp với ví đã được đăng ký và ủy quyền trong hợp đồng thông minh Smart Contract.
* **Lớp 2: Xác thực Liveness sinh trắc học (Biometrics):** Yêu cầu người dùng quay đầu theo các góc ngẫu nhiên (lên, xuống, trái, phải, thẳng). Hệ thống so khớp đặc trưng khuôn mặt (128-dimensional embedding) với cơ sở dữ liệu với ngưỡng tin cậy cao (Threshold > 0.85).
* **Lớp 3: Zero-Knowledge Proofs (ZKP):** Sử dụng Poseidon Hash tạo mật mã cam kết (commitment) từ khóa bí mật MFA và hash khuôn mặt. Khi đăng nhập, một bằng chứng Groth16 Proof được tạo ở phía client để chứng minh danh tính mà không làm lộ khóa bí mật hoặc dữ liệu khuôn mặt.

---

## 🛠️ Công nghệ sử dụng (Technology Stack)

### 1. Zero-Knowledge Cryptography
* **Circom & SnarkJS:** Dùng để biên dịch mạch số (circuits) ZKP và tạo/kiểm tra bằng chứng Groth16 trên trình duyệt và backend.

### 2. Blockchain & Smart Contracts
* **Solidity & Hardhat:** Viết và kiểm thử các Smart Contract quản lý ví được ủy quyền (`IdentityRegistry.sol`) và bộ kiểm thử Proof (`Verifier.sol`).
* **Ethers.js:** Thư viện giao tiếp giữa Node.js/React và mạng Blockchain Ethereum Local (Hardhat Node).

### 3. Biometric & Computer Vision
* **face-api.js & MediaPipe:** Nhận diện điểm mốc khuôn mặt (facial landmarks) và trích xuất vector đặc trưng khuôn mặt ngay trên trình duyệt.

### 4. Backend & Database
* **NestJS (TypeScript):** Hệ khung làm việc cho API backend, tổ chức module rõ ràng.
* **Prisma ORM & PostgreSQL:** Quản lý cơ sở dữ liệu quan hệ, lưu trữ thông tin bác sĩ, admin, cấu hình sinh trắc học đã mã hóa và lịch sử hệ thống.

### 5. Frontend & Security
* **React.js & Vite:** Giao diện SPA nhanh, mượt mà và trực quan.
* **Cookies HTTP-Only:** Bảo mật thông tin phiên làm việc (JWT) chống tấn công lấy cắp Token.

---

## 📂 Cơ cấu thư mục dự án

```text
├── backend/            # NestJS Backend API
│   ├── src/
│   │   ├── auth/       # Mô-đun xác thực & quản lý phiên bằng Cookies
│   │   ├── face/       # Mô-đun xác thực sinh trắc học khuôn mặt
│   │   ├── users/      # Quản lý người dùng, tạo mã mời
│   │   └── zkp/        # Xác minh Proof sinh ra từ trình duyệt
│   ├── prisma/         # Schema cơ sở dữ liệu & dữ liệu mẫu (seeds)
│   └── Dockerfile
│
├── frontend/           # React.js SPA (Vite)
│   ├── src/
│   │   ├── components/ # Camera quét khuôn mặt, Liveness detection, Ví Web3
│   │   ├── contexts/   # AuthContext quản lý cookies & WalletContext
│   │   ├── pages/      # Login, Dashboard, Admin Recovery
│   │   └── services/   # Gọi API giao tiếp Backend
│   └── Dockerfile
│
├── blockchain/         # Mạng Blockchain Local & Smart Contracts
│   ├── contracts/      # Hợp đồng thông minh Solidity
│   ├── scripts/        # Kịch bản Deploy Smart Contract tự động
│   └── start.sh        # Script khởi động tự động trong container
│
├── docker-compose.yml  # File orchestration khởi chạy toàn bộ hệ thống
└── RUN.md              # Hướng dẫn khởi chạy & thiết lập chi tiết
```

---

## 📄 Tài liệu hướng dẫn liên quan

Vui lòng xem file [RUN.md](file:///home/trananhduc/Documents/KLTN/RUN.md) để biết cách:
* Cấu hình biến môi trường `.env`.
* Khởi chạy dự án bằng **Docker Compose** hoặc chạy **thủ công (Manual)**.
* Cấu hình ví **MetaMask** kết nối với mạng blockchain localhost.
* Gọi API **Bootstrap** tạo tài khoản Admin đầu tiên và thông tin đăng nhập mẫu.
