#!/bin/bash
set -e

# ============================================
# AI-LOP 一键部署脚本
# 目标: 阿里云轻量应用服务器 Ubuntu 24.04
# ============================================

echo "=========================================="
echo "🚀 AI-LOP 一键部署脚本"
echo "=========================================="

# --- 阶段 1: 系统初始化 ---
echo ""
echo "📦 [1/8] 系统初始化..."

# 配置 2GB swap
if [ ! -f /swapfile ]; then
    echo "  → 配置 2GB swap..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "  ✅ Swap 已配置"
else
    echo "  ✅ Swap 已存在"
fi

# 系统更新 & 基础工具
echo "  → 更新系统包..."
export DEBIAN_FRONTEND=noninteractive
apt update -y && apt upgrade -y
apt install -y curl git build-essential

echo "  ✅ 系统初始化完成"

# --- 阶段 2: 安装 Node.js ---
echo ""
echo "📦 [2/8] 安装 Node.js 22.x..."

if command -v node &> /dev/null; then
    echo "  ✅ Node.js 已安装: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
    echo "  ✅ Node.js $(node -v) 安装完成"
fi

# --- 阶段 3: 安装 PostgreSQL ---
echo ""
echo "📦 [3/8] 安装 PostgreSQL..."

if command -v psql &> /dev/null; then
    echo "  ✅ PostgreSQL 已安装"
else
    apt install -y postgresql postgresql-contrib
    echo "  ✅ PostgreSQL 安装完成"
fi

# 启动 PostgreSQL
systemctl enable postgresql
systemctl start postgresql

# 创建数据库和用户
echo "  → 配置数据库..."
sudo -u postgres psql -c "CREATE USER ailop WITH PASSWORD 'ailop_secure_2026' SUPERUSER;" 2>/dev/null || echo "  (用户已存在)"
sudo -u postgres psql -c "CREATE DATABASE ailop OWNER ailop;" 2>/dev/null || echo "  (数据库已存在)"
echo "  ✅ 数据库配置完成"

# --- 阶段 4: 安装 PM2 ---
echo ""
echo "📦 [4/8] 安装 PM2..."

if command -v pm2 &> /dev/null; then
    echo "  ✅ PM2 已安装"
else
    npm install -g pm2
    echo "  ✅ PM2 安装完成"
fi

# --- 阶段 5: 安装 Nginx ---
echo ""
echo "📦 [5/8] 安装 Nginx..."

if command -v nginx &> /dev/null; then
    echo "  ✅ Nginx 已安装"
else
    apt install -y nginx
    echo "  ✅ Nginx 安装完成"
fi

systemctl enable nginx

# --- 阶段 6: 克隆代码 & 安装依赖 ---
echo ""
echo "📦 [6/8] 克隆代码 & 安装依赖..."

APP_DIR="/www/wwwroot/ai-lop"

if [ -d "$APP_DIR/.git" ]; then
    echo "  → 代码已存在，执行 git pull..."
    cd "$APP_DIR"
    git pull origin main || git pull origin master
else
    echo "  → 克隆代码仓库..."
    mkdir -p /www/wwwroot
    cd /www/wwwroot
    git clone https://github.com/wangdoudou-edu/interactive-story-platform.git ai-lop
    cd ai-lop
fi

# 后端依赖
echo "  → 安装后端依赖..."
cd "$APP_DIR/server"
npm install

# 配置 .env
echo "  → 配置环境变量..."
cat > .env << 'ENVEOF'
# Server Configuration
PORT=3001
CLIENT_URL=http://8.222.132.0
NODE_ENV=production

# Database Connection
DATABASE_URL="postgresql://ailop:ailop_secure_2026@localhost:5432/ailop?schema=public"

# JWT Secret
JWT_SECRET=ailop_jwt_secret_2026_singapore

# AI API Keys (从旧服务器迁移或手动填写)
GEMINI_API_KEY=placeholder_update_me
OPENAI_API_KEY=placeholder_update_me
DEEPSEEK_API_KEY=placeholder_update_me
DASHSCOPE_API_KEY=placeholder_update_me
ENVEOF

echo "  ✅ .env 已创建"

# Prisma 迁移
echo "  → 执行数据库迁移..."
npx prisma generate
npx prisma db push

# 构建后端
echo "  → 构建后端..."
npm run build

# 前端依赖和构建
echo "  → 安装前端依赖..."
cd "$APP_DIR/client"
npm install

echo "  → 构建前端..."
npm run build

echo "  ✅ 代码部署完成"

# --- 阶段 7: 配置 Nginx ---
echo ""
echo "📦 [7/8] 配置 Nginx..."

cat > /etc/nginx/sites-available/ai-lop << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    root /www/wwwroot/ai-lop/client/dist;
    index index.html;

    # 前端静态文件
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # 文件上传代理
    location /uploads {
        proxy_pass http://127.0.0.1:3001/uploads;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    client_max_body_size 50M;
}
NGINXEOF

# 启用站点配置
ln -sf /etc/nginx/sites-available/ai-lop /etc/nginx/sites-enabled/ai-lop
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t
systemctl restart nginx

echo "  ✅ Nginx 配置完成"

# --- 阶段 8: 启动服务 ---
echo ""
echo "📦 [8/8] 启动后端服务..."

cd "$APP_DIR/server"

# 停止旧进程（如果存在）
pm2 delete ailop-server 2>/dev/null || true

# 启动后端
pm2 start dist/index.js --name ailop-server --env production
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true
pm2 save

echo "  ✅ PM2 服务启动完成"

# --- 初始化数据 ---
echo ""
echo "📦 初始化测试账户..."
cd "$APP_DIR/server"
npx ts-node scripts/create-test-accounts.ts 2>/dev/null || echo "  ⚠️ 测试账户创建失败（可能已存在）"

echo ""
echo "📦 同步 AI 模型配置..."
npx ts-node scripts/manage-ai-models.ts sync 2>/dev/null || echo "  ⚠️ AI 模型同步失败（API Key 可能需要更新）"

# --- 验证 ---
echo ""
echo "=========================================="
echo "🔍 部署验证"
echo "=========================================="

echo ""
echo "PM2 进程状态:"
pm2 status

echo ""
echo "API 健康检查:"
sleep 2
curl -s http://127.0.0.1:3001/api/health || echo "⚠️ API 未响应"

echo ""
echo "Nginx 状态:"
systemctl status nginx --no-pager -l | head -5

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "=========================================="
echo ""
echo "📌 访问地址: http://8.222.132.0"
echo "📌 API 地址: http://8.222.132.0/api/health"
echo "📌 测试账户: student / student123"
echo "📌 测试账户: teacher / teacher123"
echo ""
echo "⚠️ 待办事项:"
echo "  1. 更新 /www/wwwroot/ai-lop/server/.env 中的 AI API Keys"
echo "  2. 在阿里云控制台防火墙中开放 80 端口"
echo "  3. 更新完 .env 后执行: cd /www/wwwroot/ai-lop/server && pm2 restart ailop-server"
echo ""
