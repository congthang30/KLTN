#!/bin/sh

# Khởi động Hardhat Node ở background
npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!

# Đợi cho tới khi Hardhat node sẵn sàng nhận kết nối RPC
echo "⏳ Waiting for Hardhat local node to start..."
until node -e "
const http = require('http');
const req = http.request({
  hostname: '127.0.0.1',
  port: 8545,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  res.on('data', () => {});
  res.on('end', () => process.exit(0));
});
req.on('error', () => process.exit(1));
req.write(JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }));
req.end();
" >/dev/null 2>&1; do
  sleep 1
done

echo "🚀 Hardhat node is running! Deploying smart contracts..."
# --no-compile: Dùng artifacts đã biên dịch sẵn trong Dockerfile, không cần tải compiler
npx hardhat run scripts/deploy.js --network localhost --no-compile

# Giữ tiến trình Hardhat node chạy liên tục ở foreground
wait $NODE_PID
