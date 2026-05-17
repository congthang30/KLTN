#!/bin/bash

# Khởi động Hardhat Node ở background
npx hardhat node --hostname 0.0.0.0 &
NODE_PID=$!

# Đợi cho tới khi Hardhat node sẵn sàng nhận kết nối RPC
echo "⏳ Waiting for Hardhat local node to start..."
until curl -s -X POST --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -H "Content-Type: application/json" http://localhost:8545 > /dev/null; do
  sleep 1
done

echo "🚀 Hardhat node is running! Deploying smart contracts..."
npx hardhat run scripts/deploy.js --network localhost

# Giữ tiến trình Hardhat node chạy liên tục ở foreground
wait $NODE_PID
