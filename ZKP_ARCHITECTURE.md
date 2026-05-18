# 🔐 Kiến trúc Xác thực Kép: Sinh trắc học & Zero-Knowledge Proof (ZKP)

Tài liệu này giải thích chi tiết cơ chế hoạt động, luồng dữ liệu và vai trò xác minh của từng thành phần trong hệ thống xác thực không mật khẩu (Passwordless) dành cho Admin.

Hệ thống của chúng ta sử dụng kiến trúc **Xác thực Kép (Dual Verification)** kết hợp giữa Off-chain (Backend truyền thống) và On-chain (Blockchain).

---

## 👁️ 1. Xác thực Khuôn mặt (Biometric Authentication - Off-chain)

Đây là lớp bảo vệ thứ 2 (Layer 2) dùng cho quá trình đăng nhập hàng ngày.

### Ai là người xác minh (Verify)?
👉 **Backend Server (NestJS)** là người xác minh.

### Cơ chế hoạt động:
1. **Lúc đăng ký:** Camera quét khuôn mặt của Admin. Trình duyệt (Frontend) dùng AI (MediaPipe) để trích xuất ra một mảng gồm hàng trăm con số thập phân đặc trưng cho khuôn mặt. Mảng số này gọi là `faceEmbedding`. Mảng này được gửi lên Backend và lưu vào Database (PostgreSQL).
2. **Lúc đăng nhập hàng ngày:** 
   - Bạn mở camera quét lại khuôn mặt. Hệ thống sinh ra một `faceEmbedding_Mới`.
   - Backend sẽ dùng một thuật toán gọi là **Cosine Similarity (Đo góc giữa 2 vector)** để chấm điểm xem `faceEmbedding_Mới` giống với cái đang lưu trong DB bao nhiêu phần trăm.
   - Nếu độ giống nhau **> 90%**, Backend sẽ xác nhận "Pass" và cho phép bạn đăng nhập.

### Tại sao lại cần Backend xác minh cái này?
- **Tốc độ và Chi phí:** Chạy Cosine Similarity trên Backend mất chưa tới `0.1 giây` và hoàn toàn **miễn phí**. Nếu đưa khuôn mặt lên Blockchain để so sánh, hệ thống sẽ sập hoặc bạn sẽ tốn hàng chục đô la (Phí Gas) cho mỗi lần đăng nhập.
- **Xử lý sai số (Fuzziness):** Khuôn mặt con người mỗi ngày mỗi khác (đeo kính, thiếu sáng...). Backend có thể chấp nhận sai số (giống 90% là cho qua), trong khi Blockchain (Toán học ZKP) yêu cầu phải chính xác tuyệt đối 100%.

---

## 🛡️ 2. Xác thực Zero-Knowledge Proof (ZKP - On-chain)

Đây là lớp bảo vệ tối thượng (Layer 3), dùng cho các tác vụ mang tính sống còn như: Tạo danh tính gốc, Khôi phục tài khoản khi mất ví MetaMask.

### Ai là người xác minh (Verify)?
👉 **Smart Contract trên Blockchain (`Groth16Verifier.sol`)** là người xác minh.

### Cơ chế hoạt động (Giải quyết bài toán "Sai số"):
Như đã nói, ZKP yêu cầu dữ liệu phải chính xác tuyệt đối 100%, sai 1 bit là ZKP sẽ báo False. Vậy làm sao để xử lý sai số của khuôn mặt khi khôi phục tài khoản?

1. **Vùng đệm thông minh (Smart Buffer):** 
   - Lúc đăng ký, Backend bí mật lấy `faceEmbedding` chuẩn, băm (Hash) nó thành một con số nguyên khổng lồ gọi là `faceHash`. Con số này được lưu tĩnh trong DB.
   - Khi tạo danh tính, `faceHash` trộn với mã bí mật (`zkpSecret`) tạo ra một cái ổ khóa gọi là `zkpCommitment`. Ổ khóa này được **khắc vĩnh viễn lên Blockchain**.
2. **Lúc khôi phục tài khoản (Mất ví):**
   - Người dùng gõ mã `zkpSecret` (lưu trên giấy) vào máy tính.
   - Người dùng quét lại khuôn mặt. Backend lại dùng Cosine Similarity chấm điểm (Giống phần 1).
   - Nếu mặt giống > 90%, Backend mới **"chìa" cái `faceHash` chuẩn tuyệt đối 100%** từ trong DB ra, trả về cho máy tính người dùng.
   - Frontend trên máy người dùng sẽ lấy `zkpSecret` + `faceHash chuẩn` đưa vào thuật toán ZKP (snarkjs) để sinh ra **Bằng Chứng (Proof)**.
3. **Quá trình Verify trên Blockchain:**
   - Bằng chứng này được ném lên Smart Contract.
   - Smart Contract chạy các ma trận toán học khổng lồ để kiểm tra xem Bằng chứng này có mở được cái ổ khóa `zkpCommitment` không.
   - Nếu mở được, Smart Contract (Blockchain) xác nhận bạn là chủ sở hữu hợp pháp và cho phép đổi ví.

### Tại sao lại cần Blockchain xác minh cái này?
- **Chống Hacker tuyệt đối:** Ngay cả khi hacker chiếm được toàn bộ Backend và Database, chúng cũng không thể giả mạo được danh tính của bạn để cướp ví. Vì Smart Contract trên Blockchain chỉ chấp nhận Bằng chứng ZKP, mà Bằng chứng đó lại cần `zkpSecret` (thứ duy nhất bạn giữ ở ngoài đời).
- **Tính phi tập trung (Decentralization):** Danh tính của bạn không nằm trong tay bất kỳ Server nào, nó nằm trên mạng lưới Blockchain toàn cầu.

---

## 📝 BẢNG TÓM TẮT TRÁCH NHIỆM

| Tính năng | Lưu trữ ở đâu? | Ai Verify? | Thuật toán sử dụng | Tác dụng |
| :--- | :--- | :--- | :--- | :--- |
| **Sinh trắc học** (`faceEmbedding`) | PostgreSQL (Backend DB) | **Backend Server** | Cosine Similarity (Mức độ tương đồng > 90%) | Cho phép đăng nhập hàng ngày cực nhanh, miễn phí, và linh hoạt với sự thay đổi của khuôn mặt. |
| **Danh tính ZKP** (`zkpCommitment`) | Blockchain (Smart Contract) | **Smart Contract** (`IdentityRegistry`) | Toán học mật mã đường cong elip (Elliptic Curve - Groth16) | Lớp khóa chết chống hacker. Chỉ xác nhận khi có chính xác 100% mã bí mật. Dùng để khôi phục tài khoản. |
