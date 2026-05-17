FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Cài đặt bash và curl để chạy script kiểm tra trạng thái node
RUN apk add --no-cache bash curl
EXPOSE 8545
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]
