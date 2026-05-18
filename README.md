# 🛡️ ZKP Identity Verification System — Hospital Management

Hệ thống xác thực danh tính đa lớp tích hợp **Zero-Knowledge Proofs (Groth16)**, **Nhận diện khuôn mặt với Liveness Detection (MediaPipe & face-api.js)** và **Blockchain (Hardhat + Solidity)**.

Admin đăng nhập hoàn toàn **không cần username/password** — chỉ dùng **Ví Web3 + Khuôn mặt + ZKP**. Doctor giữ nguyên cơ chế username/password truyền thống.

---

## 📋 Mục lục
1. [Cách tạo tài khoản Admin](#-1-cách-tạo-tài-khoản-admin-quan-trọng-nhất)
2. [Chạy bằng Docker Compose](#-2-hướng-dẫn-chạy-full-bằng-docker-compose)
3. [Chạy thủ công từng service](#-3-hướng-dẫn-chạy-bằng-tay-từng-service)
4. [Cấu hình MetaMask](#-4-cấu-hình-metamask-với-mạng-blockchain-local)
5. [Thông tin tài khoản Doctor](#-5-thông-tin-đăng-nhập-doctor)
6. [Kiến trúc bảo mật](#-6-kiến-trúc-bảo-mật-3-lớp-anti-hacker)

---

## 🔐 1. CÁCH TẠO TÀI KHOẢN ADMIN (QUAN TRỌNG NHẤT)

> **Admin KHÔNG có username/password.** Thay vào đó, Admin dùng **Ví Web3 + Face Biometric + ZKP** để đăng nhập.

### ⚡ Bước 1: Tạo Admin đầu tiên (Bootstrap)

Khi hệ thống mới được deploy, **chưa có Admin nào tồn tại**. Bạn cần gọi API Bootstrap để tạo Admin đầu tiên.

**Sử dụng cURL hoặc Postman:**

```bash
curl -X POST http://localhost:3001/api/auth/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@hospital.vn",
    "superAdminSecret": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  }'
```

**Hoặc dùng PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/auth/bootstrap" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","email":"admin@hospital.vn","superAdminSecret":"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"}'
```

> ⚠️ **`superAdminSecret`** chính là giá trị `SUPER_ADMIN_PRIVATE_KEY` trong file `.env`. Cho môi trường dev, đây là private key của Hardhat Account #0.

**Kết quả trả về:**
```json
{
  "message": "First Admin account created successfully!",
  "user": { "id": "...", "username": "admin", "email": "admin@hospital.vn", "role": "ADMIN" },
  "inviteToken": "a1b2c3d4e5f6...64_hex_chars...",
  "instructions": "Use this invite token on the Login page → Admin tab → \"Invite Code\" to complete registration."
}
```

> 🔒 **API này chỉ hoạt động 1 LẦN DUY NHẤT** — khi đã có Admin trong hệ thống, endpoint này sẽ trả về lỗi `403 Forbidden`.

### ⚡ Bước 2: Đăng nhập lần đầu bằng Invite Token

1. Mở trình duyệt → `http://localhost:5173`
2. Chọn tab **🔐 Admin (Ví Web3)**
3. Nhấn nút **🎟️ Mã mời (Lần đầu)**
4. Dán **invite token** từ Bước 1 vào ô nhập
5. Nhấn **Xác nhận mã mời**

### ⚡ Bước 3: Hoàn tất đăng ký danh tính (3 bước)

Sau khi nhập invite token thành công, hệ thống sẽ:

| Bước | Mô tả |
|------|-------|
| **📷 Face Scan** | Camera tự bật → Quay đầu theo 3 hướng (Liveness Detection kiểu Agribank) → Lưu face embedding |
| **🦊 Connect Wallet** | Kết nối ví MetaMask bất kỳ (hoặc chọn Hardhat account cho dev) |
| **🛡️ ZKP Identity** | Tạo commitment = Poseidon(secret, faceHash) → Đăng ký on-chain qua Super Admin Relayer |

> 💡 **Mã bí mật MFA** sẽ xuất hiện 1 LẦN DUY NHẤT sau khi nhập invite token. **Copy và lưu giữ cẩn thận** — dùng để khôi phục tài khoản khi mất ví.

### ⚡ Bước 4: Đăng nhập lại sau này (không cần password!)

Từ lần sau, Admin đăng nhập chỉ cần:
1. Mở web → Tab **Admin** → Nhấn **🦊 Kết nối MetaMask & Đăng nhập**
2. MetaMask popup → Ký xác nhận (Sign)
3. Quét khuôn mặt → Vào Dashboard!

### ⚡ Tạo thêm Admin (sau khi đã có Admin đầu tiên)

Admin đầu tiên có thể tạo thêm Admin khác qua Dashboard:
- Vào **Dashboard → Quản lý Users → Tạo User mới** với role `ADMIN`
- Hoặc gọi API:

```bash
curl -X POST http://localhost:3001/api/users/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -d '{"username": "admin2", "email": "admin2@hospital.vn", "role": "ADMIN"}'
```

Hệ thống sẽ tạo invite token mới và gửi qua email (hoặc trả về trong response cho dev).

---

## 🐳 2. HƯỚNG DẪN CHẠY FULL BẰNG DOCKER COMPOSE

### 📋 Bước 2.1: Chuẩn bị
1. Cài đặt **Docker Desktop** và đảm bảo đang chạy (biểu tượng xanh lá).
2. Kiểm tra file `.env` ở thư mục gốc đã có `SUPER_ADMIN_PRIVATE_KEY`.

### 🚀 Bước 2.2: Khởi chạy
```bash
docker-compose up --build
```

### ⏳ Bước 2.3: Thứ tự khởi động tự động
1. **`zkp-postgres`** — PostgreSQL database (cổng `5432`)
2. **`zkp-blockchain`** — Hardhat Node + auto deploy Smart Contract (cổng `8545`)
3. **`zkp-backend`** — NestJS API + Prisma migration + seed (cổng `3001`)
4. **`zkp-frontend`** — React Vite (cổng `5173`)

> Hệ thống sẵn sàng khi Terminal hiện: `zkp-frontend  |   VITE v5.4.21  ready in XX ms`

### 🛑 Các lệnh Docker hữu ích

```bash
# Chạy nền (background)
docker-compose up -d --build

# Xem log backend
docker logs -f zkp-backend

# Dừng hệ thống
docker-compose down

# Reset hoàn toàn DB + Blockchain (⚠️ xóa hết data!)
docker-compose down -v
```

---

## 🛠️ 3. HƯỚNG DẪN CHẠY BẰNG TAY TỪNG SERVICE

### 🖥️ Terminal 1: Blockchain Node
```bash
cd blockchain
npm install
npm run node
```

### 🖥️ Terminal 2: Deploy Smart Contract
```bash
cd blockchain
npm run deploy:local
```
*Ghi lại địa chỉ `IdentityRegistry` được in ra.*

### 🖥️ Terminal 3: Backend (NestJS)
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
npm run start:dev
```

### 🖥️ Terminal 4: Frontend (React Vite)
```bash
cd frontend
npm install
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 🦊 4. CẤU HÌNH METAMASK VỚI MẠNG BLOCKCHAIN LOCAL

### 🌐 Thêm Mạng Hardhat Network
1. MetaMask → **Add network** → **Add a network manually**
2. Điền:
   - **Network Name:** `Hardhat Localhost`
   - **New RPC URL:** `http://localhost:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`

### 🔑 Import Ví thử nghiệm (10,000 ETH)

| Tài khoản | Địa chỉ | Private Key |
|-----------|---------|-------------|
| **Account #0** (Super Admin) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Account #1** (Admin/User) | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Account #2** (Doctor) | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa73f9876e5228e37186140b6e9b40ba9c195609ee7def409a5ae9cd` |

**Import:** MetaMask → Biểu tượng tài khoản → **Import account** → Dán Private Key → **Import**

---

## 👨‍⚕️ 5. THÔNG TIN ĐĂNG NHẬP DOCTOR

Doctor sử dụng **username + password** truyền thống. Tài khoản mẫu (từ seed):

| Username | Password tạm | Email |
|----------|-------------|-------|
| `dr.john.doe` | `doctor123` | john.doe@hospital.vn |
| `dr.jane.smith` | `doctor123` | jane.smith@hospital.vn |
| `dr.alan.turing` | `doctor123` | alan.turing@hospital.vn |

Khi đăng nhập lần đầu, Doctor phải đổi mật khẩu → Quét khuôn mặt → Kết nối ví → Đăng ký ZKP.

---

## 🛡️ 6. KIẾN TRÚC BẢO MẬT 3 LỚP (ANTI-HACKER)

```
Hacker chiếm được Database?
    ↓
Lớp 1: Connect Wallet → Backend gọi isAuthorized() ON-CHAIN
        → Ví chưa đăng ký trên blockchain ❌ BLOCKED!
        → Chỉ Super Admin Relayer mới đăng ký được ví on-chain
    ↓
Lớp 2: Face Biometric → Liveness Detection (quay đầu)
        → Không thể fake khuôn mặt ❌ BLOCKED!
    ↓
Lớp 3: ZKP Proof → Cần biết secret + faceHash
        → Secret chỉ hiện 1 lần, mã hóa AES trong DB ❌ BLOCKED!
```

**Kết luận:** Dù hacker chiếm quyền Database, KHÔNG THỂ đăng nhập vì blockchain bất biến, khuôn mặt không thể fake, và ZKP secret không thể đoán.
