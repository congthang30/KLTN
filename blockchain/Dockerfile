FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Cài đặt bash và curl để chạy script kiểm tra trạng thái node
RUN apk add --no-cache bash curl
# Pre-compile smart contracts during build (khi build Docker CÓ internet)
# Nhờ vậy lúc runtime (start.sh) không cần tải compiler nữa
RUN npx hardhat compile
EXPOSE 8545
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
