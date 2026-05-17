# 🛡️ ZKP Identity Verification System

Hệ thống xác thực danh tính đa lớp tích hợp **Zero-Knowledge Proofs (Groth16)**, **Nhận diện khuôn mặt với Liveness Detection (MediaPipe & face-api.js)** và **Blockchain (Hardhat + Solidity)**.

Dự án này đã được nâng cấp lên cơ chế xác thực khuôn mặt tự động kiểu **Agribank E-Mobile Banking** (Liveness check quay mặt trái/phải/lên/xuống để xác định người thật) và cơ chế hiển thị mã bí mật ZKP bảo mật cao ngay trong lần đăng nhập đầu tiên.

---

## 🐳 1. HƯỚNG DẪN CHẠY FULL BẰNG DOCKER COMPOSE (CHI TIẾT NHẤT)

Chạy hệ thống qua Docker Compose là phương pháp tối ưu và đơn giản nhất vì toàn bộ Database (MSSQL), Blockchain Node (Hardhat + Solidity auto deploy), API Backend (NestJS + Prisma auto migration/seed) và React Frontend đều được đóng gói và cấu hình sẵn để tự động liên kết với nhau.

### 📋 Bước 1.1: Chuẩn bị môi trường
1. Tải và cài đặt **Docker Desktop** cho hệ điều hành của bạn (Windows/Mac/Linux).
2. Mở ứng dụng **Docker Desktop** và đảm bảo Docker engine đang ở trạng thái **Running** (màu xanh lá ở góc trái màn hình).

### 🚀 Bước 1.2: Khởi chạy hệ thống bằng 1 lệnh duy nhất
1. Mở Terminal (PowerShell, Command Prompt hoặc Git Bash) tại thư mục gốc của dự án (`KLTN`).
2. Chạy lệnh sau để build và khởi động toàn bộ 4 container:
   ```bash
   docker-compose up --build
   ```
   * *Giải thích:* Lệnh này sẽ build lại code mới nhất (bao gồm cả tính năng Liveness Detection và Secret Code Modal mới hoàn thành) và khởi chạy tất cả các dịch vụ ở chế độ xem log thời gian thực.

### ⏳ Bước 1.3: Xem tiến trình khởi chạy tự động của hệ thống
Hệ thống sẽ tự động điều phối thứ tự chạy cực kỳ thông minh:
1. **Container `zkp-mssql` (Database)** khởi chạy trước trên cổng `1433`.
2. **Container `zkp-blockchain`** khởi động Hardhat Node và tự động deploy Smart Contract lên mạng blockchain cục bộ (cổng `8545`).
3. **Container `zkp-backend`** sẽ liên tục kiểm tra cổng của MS SQL Server. Khi cổng mở, backend sẽ **chờ thêm 10 giây** để đảm bảo tài khoản quản trị hệ thống (`sa`) được SQL Server khởi tạo thành công hoàn toàn.
4. Sau đó backend tự động thực hiện **Prisma Migration (khởi tạo cấu trúc bảng)** và **Prisma Seed (tự động tạo tài khoản admin)**.
5. Cuối cùng, **Container `zkp-frontend`** khởi chạy giao diện web React trên cổng `5173`.

> Bạn biết hệ thống đã sẵn sàng 100% khi Terminal hiện dòng chữ:
> `zkp-frontend  |   VITE v5.4.21  ready in XX ms`

---

## 🔎 2. CÁC LỆNH DOCKER COMPOSE HỮU ÍCH KHI PHÁT TRIỂN

Trong quá trình chạy và phát triển dự án, bạn có thể sử dụng các lệnh sau để quản lý các container:

### 🔇 Chạy ẩn dưới nền (Background Mode):
Nếu bạn muốn giải phóng Terminal của mình và không hiển thị đống log chạy liên tục:
```bash
docker-compose up -d --build
```

### 📋 Xem Log của một Service cụ thể:
Nếu bạn muốn theo dõi xem Backend đang làm gì hoặc kiểm tra lỗi Prisma:
```bash
# Xem log của Backend
docker logs -f zkp-backend

# Xem log của Blockchain Node (xem lịch sử deploy contract/giao dịch gas)
docker logs -f zkp-blockchain
```

### 🛑 Dừng và Dọn Dẹp Toàn Bộ Hệ Thống:
Khi kiểm thử xong hoặc muốn tắt dự án:
```bash
docker-compose down
```

### 🔄 Dọn Dẹp Sạch Sẽ Volume (Reset hoàn toàn Database và Blockchain):
Nếu database của bạn bị lỗi hoặc bạn muốn reset sạch sẽ mọi tài khoản và trạng thái blockchain về trạng thái xuất xưởng:
```bash
docker-compose down -v
```
*(Lệnh này sẽ xóa ổ đĩa ảo MSSQL và bộ nhớ Hardhat Node, lần chạy tiếp theo hệ thống sẽ nạp lại từ đầu).*

---

## 🔑 3. THÔNG TIN ĐĂNG NHẬP ADMIN & LUỒNG ĐĂNG KÝ

Sau khi Docker khởi động thành công, bạn mở trình duyệt và truy cập: **`http://localhost:5173`**

### 🔐 Tài khoản Admin mặc định:
* **Username:** `admin` *(hoặc email: `duc19092005d@gmail.com`)*
* **Password:** `anhduc9A@5`

### 🔄 Luồng đăng ký danh tính đa lớp của Admin (First Login):
Vì Docker Seed tự động cấu hình tài khoản admin ở trạng thái Đăng nhập lần đầu (`firstLogin: true`), khi bạn đăng nhập thành công bằng mật khẩu trên:
1. **Đổi mật khẩu**: Hệ thống yêu cầu đổi mật khẩu mới để bảo mật.
2. **Cảnh Báo Đỏ (Secret Code)**: Hiển thị hộp thoại cảnh báo đỏ khẩn cấp cung cấp mã bí mật ZKP độc bản. **Hãy nhấn "Sao chép vào clipboard" và lưu trữ mã này thật kỹ.**
3. **Liveness Verification (Kiểu Agribank)**: Camera sẽ tự động bật. Bạn đưa khuôn mặt vào giữa khung oval. Hệ thống sẽ chọn ngẫu nhiên 3 hướng quay đầu. Hãy quay đầu theo mũi tên chỉ dẫn (Trái/Phải/Lên/Xuống) và giữ nguyên tư thế ~2 giây mỗi hướng để thanh tiến trình chạy đầy.
4. **Liên kết ví MetaMask**: Hệ thống yêu cầu kết nối ví MetaMask của bạn (Xem hướng dẫn import ví Hardhat bên dưới).
5. **Đăng ký thành công**: Hệ thống tạo Proof ZKP gửi lên Blockchain Smart Contract để lưu trữ và kích hoạt tài khoản Admin ACTIVE hoàn toàn!

---

## 🦊 4. CẤU HÌNH METAMASK VỚI MẠNG BLOCKCHAIN LOCAL DOCKER

Mạng blockchain cục bộ của dự án đang chạy bên trong Docker trên cổng `8545`. Để MetaMask có thể tương tác:

### 🌐 Bước 4.1: Thêm Mạng Hardhat Network vào MetaMask
1. Mở extension **MetaMask** trên trình duyệt của bạn.
2. Nhấp vào menu chọn Mạng -> Chọn **Add network** (Thêm mạng) -> **Add a network manually** (Thêm mạng thủ công).
3. Điền các thông tin như sau:
   * **Network Name:** `Hardhat Localhost`
   * **New RPC URL:** `http://localhost:8545` *(Hoặc `http://127.0.0.1:8545`)*
   * **Chain ID:** `31337`
   * **Currency Symbol:** `ETH`
4. Nhấn **Save** (Lưu) và chuyển sang mạng vừa tạo.

### 🔑 Bước 4.2: Import Ví Thử Nghiệm có sẵn 10,000 ETH
Mạng local của Hardhat cung cấp sẵn các tài khoản có sẵn 10,000 ETH để dev kiểm thử. Bạn hãy copy một trong các Private Key dưới đây để import vào MetaMask làm ví Admin/User:

| Tài khoản | Địa chỉ Ví (Public Address) | Khóa Bí Mật (Private Key) |
| :---: | :--- | :--- |
| **Account #0 (Khuyên dùng cho Admin)** | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Account #1 (Khuyên dùng để Khôi phục/User)** | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |

**Cách thêm ví vào MetaMask:**
1. Trên MetaMask, nhấp vào biểu tượng danh sách tài khoản (hình tròn màu sắc ở góc trên bên phải).
2. Chọn **Add account or hardware wallet** -> Chọn **Import account** (Nhập tài khoản).
3. Dán chuỗi **Private Key** ở bảng trên vào ô nhập liệu.
4. Nhấn **Import** (Nhập). Bạn sẽ nhận ngay ví có **10,000 ETH** lập tức!

---

## 🛠️ 5. HƯỚNG DẪN CHẠY BẰNG TAY TỪNG SERVICE (NẾU KHÔNG DÙNG DOCKER)

Nếu bạn không muốn chạy bằng Docker mà muốn chạy thủ công từng phần bằng NodeJS trên máy:

### 🖥️ Terminal 1: Mạng Blockchain Node
```bash
cd blockchain
npm install
npm run node
```

### 🖥️ Terminal 2: Biên dịch và Deploy Smart Contract
```bash
cd blockchain
npm run deploy:local
```
*Ghi lại địa chỉ contract `IdentityRegistry` được in ra màn hình.*

### 🖥️ Terminal 3: API Backend (NestJS)
1. Cấu hình file `backend/.env` (DATABASE_URL và IDENTITY_REGISTRY_ADDRESS).
2. Chạy prisma và server:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npx prisma db seed
   npm run start:dev
   ```

### 🖥️ Terminal 4: Frontend (React Vite)
1. Cấu hình file `frontend/.env` (VITE_IDENTITY_REGISTRY_ADDRESS).
2. Chạy server phát triển:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Truy cập: `http://localhost:5173`.
