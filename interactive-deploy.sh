
#!/bin/bash
set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir com cores
print_color() {
    echo -e "${1}${2}${NC}"
}

# Função para lidar com erros
handle_error() {
    print_color $RED "❌ Erro detectado. Abortando instalação..."
    exit 1
}

# Função para perguntar com valor padrão
ask_with_default() {
    local prompt="$1"
    local default="$2"
    local result=""

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " result
        result="${result:-$default}"
    else
        read -p "$prompt: " result
    fi
    echo "$result"
}

# Função para perguntar sim/não
ask_yes_no() {
    local prompt="$1"
    local default="$2"
    local result=""

    while true; do
        if [ "$default" = "y" ]; then
            read -p "$prompt [Y/n]: " result
            result="${result:-y}"
        else
            read -p "$prompt [y/N]: " result
            result="${result:-n}"
        fi

        case "$result" in
            [Yy]* ) echo "y"; break;;
            [Nn]* ) echo "n"; break;;
            * ) echo "Por favor, responda yes ou no.";;
        esac
    done
}

clear
print_color $PURPLE "🚀 FAMILY CARE - SCRIPT DE DEPLOY SEGURO"
print_color $CYAN "========================================="
echo ""
print_color $YELLOW "Este script irá configurar completamente seu servidor Ubuntu"
print_color $YELLOW "para rodar a aplicação Family Care em produção com segurança."
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    print_color $RED "❌ Este script deve ser executado como root (use sudo)"
    exit 1
fi

# Verificar versão do Ubuntu
if ! lsb_release -d | grep -q "Ubuntu"; then
    print_color $YELLOW "⚠️  Este script foi testado no Ubuntu. Outras distribuições podem ter problemas."
fi

# Coletar informações do usuário
print_color $BLUE "📋 COLETANDO INFORMAÇÕES DE CONFIGURAÇÃO"
echo "----------------------------------------"

GITHUB_URL=$(ask_with_default "URL do repositório GitHub" "https://github.com/dataqoda/FamilyCare.git")
GIT_USER_NAME=$(ask_with_default "Seu nome para configuração do Git" "Data Qoda")
GIT_USER_EMAIL=$(ask_with_default "Seu email para configuração do Git" "dataqoda@gmail.com")
DOMAIN_NAME=$(ask_with_default "Domínio personalizado (deixe vazio se não tiver)" "portainer.ti.fac.unb.br")
APP_NAME=$(ask_with_default "Nome da aplicação para PM2" "family-care")
APP_USER=$(ask_with_default "Usuário do sistema para a aplicação" "familycare")
DB_NAME=$(ask_with_default "Nome do banco de dados" "familycare_db")
DB_USER=$(ask_with_default "Usuário do banco de dados" "familycare_user")

# Gerar senhas seguras
print_color $CYAN "🔐 Gerando senhas seguras..."
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)

echo "Senha do banco gerada: $DB_PASSWORD"
echo "Chave da sessão gerada: $SESSION_SECRET"

APP_PORT=$(ask_with_default "Porta da aplicação" "5000")

# Configurações avançadas
echo ""
print_color $BLUE "⚙️ CONFIGURAÇÕES AVANÇADAS"
echo "----------------------------"

SETUP_SSL=$(ask_yes_no "Configurar SSL automaticamente (precisa de domínio)" "n")
SETUP_FIREWALL=$(ask_yes_no "Configurar firewall UFW" "y")
SETUP_BACKUP=$(ask_yes_no "Configurar backup automático do banco" "y")
SETUP_FAIL2BAN=$(ask_yes_no "Instalar fail2ban para segurança" "y")

echo ""
print_color $GREEN "✅ INFORMAÇÕES COLETADAS!"
echo "=========================="
echo "GitHub URL: $GITHUB_URL"
echo "Git User: $GIT_USER_NAME <$GIT_USER_EMAIL>"
echo "Domínio: ${DOMAIN_NAME:-'Não configurado'}"
echo "App Name: $APP_NAME"
echo "App User: $APP_USER"
echo "Database: $DB_NAME ($DB_USER)"
echo "Port: $APP_PORT"
echo ""

if [ "$(ask_yes_no "Continuar com a instalação" "y")" = "n" ]; then
    print_color $YELLOW "❌ Instalação cancelada."
    exit 0
fi

echo ""
print_color $PURPLE "🚀 INICIANDO INSTALAÇÃO..."
echo ""

# Função para mostrar progresso
show_progress() {
    local step="$1"
    local total="$2"
    local description="$3"
    print_color $CYAN "[$step/$total] $description"
}

TOTAL_STEPS=16
CURRENT_STEP=1

# Função para incrementar step de forma segura
increment_step() {
    CURRENT_STEP=$(($CURRENT_STEP + 1))
}

# 1. Atualizar sistema
show_progress $CURRENT_STEP $TOTAL_STEPS "Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
increment_step

# 2. Instalar ferramentas básicas
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando ferramentas básicas..."
apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release unzip git build-essential
increment_step

# 3. Criar usuário dedicado para a aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando usuário dedicado para a aplicação..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$APP_USER"
    usermod -aG sudo "$APP_USER"
    print_color $GREEN "✅ Usuário $APP_USER criado"
else
    print_color $YELLOW "⚠️  Usuário $APP_USER já existe"
fi
increment_step

# 4. Instalar Node.js 20
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
print_color $GREEN "✅ Node.js $(node --version) instalado"
print_color $GREEN "✅ npm $(npm --version) instalado"
increment_step

# 5. Instalar PostgreSQL 16
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PostgreSQL 16..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update -y
apt-get install -y postgresql-16 postgresql-client-16
increment_step

# 6. Configurar PostgreSQL
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Aguardar PostgreSQL iniciar
sleep 3

# Criar usuário e banco
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || true
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" || true
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;" || true

# Configurar autenticação
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

if [ -f "$PG_CONFIG_DIR/pg_hba.conf" ]; then
    cp "$PG_CONFIG_DIR/pg_hba.conf" "$PG_CONFIG_DIR/pg_hba.conf.backup"

    cat > "$PG_CONFIG_DIR/pg_hba.conf" << EOL
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOL

    systemctl restart postgresql
fi

print_color $GREEN "✅ PostgreSQL configurado com banco '$DB_NAME'"
increment_step

# 7. Instalar Nginx
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando e configurando Nginx..."
apt-get install -y nginx

# Configurar Nginx
cat > /etc/nginx/sites-available/$APP_NAME << EOL
server {
    listen 80;
    server_name ${DOMAIN_NAME:-_};
    client_max_body_size 50M;

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Configurações de compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/${APP_NAME}_access.log;
    error_log /var/log/nginx/${APP_NAME}_error.log;
}
EOL

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t
print_color $GREEN "✅ Nginx configurado"
increment_step

# 8. Instalar PM2 globalmente
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PM2..."
npm install -g pm2@latest
print_color $GREEN "✅ PM2 instalado globalmente"
increment_step

# 9. Configurar Firewall (se solicitado)
if [ "$SETUP_FIREWALL" = "y" ]; then
    show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando firewall UFW..."
    ufw --force reset
    ufw --force enable
    ufw allow ssh
    ufw allow 'Nginx Full'
    ufw allow 80
    ufw allow 443
    print_color $GREEN "✅ Firewall configurado"
fi
increment_step

# 10. Instalar fail2ban (se solicitado)
if [ "$SETUP_FAIL2BAN" = "y" ]; then
    show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando fail2ban..."
    apt-get install -y fail2ban

    cat > /etc/fail2ban/jail.local << EOL
[DEFAULT]
bantime = 1800
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/*error.log

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOL

    systemctl enable fail2ban
    systemctl start fail2ban
    print_color $GREEN "✅ Fail2ban configurado"
fi
increment_step

# 11. Instalar Certbot
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando Certbot para SSL..."
apt-get install -y certbot python3-certbot-nginx
increment_step

# 12. Criar estrutura de diretórios
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando estrutura de diretórios..."
APP_DIR="/home/$APP_USER/$APP_NAME"
mkdir -p "$APP_DIR"
mkdir -p "/var/log/$APP_NAME"
mkdir -p "/home/$APP_USER/.pm2"

# Definir permissões corretas
chown -R "$APP_USER:$APP_USER" "/home/$APP_USER"
chown -R "$APP_USER:$APP_USER" "/var/log/$APP_NAME"
increment_step

# 13. Configurar Git e clonar repositório como usuário dedicado
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando Git e clonando repositório..."

# Executar comandos como usuário dedicado
sudo -u "$APP_USER" bash << EOF
cd "$APP_DIR"
git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"
git config --global init.defaultBranch main

# Clonar repositório
git clone $GITHUB_URL .
EOF

print_color $GREEN "✅ Repositório clonado de $GITHUB_URL"
increment_step

# 14. Configurar aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando aplicação..."

# Criar arquivo .env
sudo -u "$APP_USER" cat > "$APP_DIR/.env" << EOL
# Environment
NODE_ENV=production
PORT=$APP_PORT

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Security
SESSION_SECRET=$SESSION_SECRET

# Application
APP_NAME=$APP_NAME
EOL

print_color $GREEN "✅ Arquivo .env criado"

# Instalar dependências como usuário dedicado
sudo -u "$APP_USER" bash << EOF
cd "$APP_DIR"
npm install
npm run build
EOF

print_color $GREEN "✅ Dependências instaladas e build concluído"
increment_step

# 15. Configurar PM2 para usuário dedicado
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando PM2 para usuário dedicado..."

# Instalar PM2 para o usuário dedicado
sudo -u "$APP_USER" npm install -g pm2@latest

# Criar configuração PM2 correta
sudo -u "$APP_USER" cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'run start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: $APP_PORT
    },
    error_file: '/var/log/$APP_NAME/error.log',
    out_file: '/var/log/$APP_NAME/out.log',
    log_file: '/var/log/$APP_NAME/combined.log',
    time: true
  }]
};
EOF

# Verificar se package.json tem script start
if ! sudo -u "$APP_USER" grep -q '"start"' "$APP_DIR/package.json"; then
    print_color $YELLOW "⚠️  Script 'start' não encontrado. Usando 'dev'..."
    sudo -u "$APP_USER" sed -i 's/npm run start/npm run dev/g' "$APP_DIR/ecosystem.config.js"
fi

# Limpar PM2 existentes
sudo -u "$APP_USER" pm2 delete all 2>/dev/null || true
sudo -u "$APP_USER" pm2 kill 2>/dev/null || true

sleep 3

# Iniciar aplicação como usuário dedicado
print_color $CYAN "🚀 Iniciando aplicação com PM2..."
sudo -u "$APP_USER" bash << EOF
cd "$APP_DIR"
pm2 start ecosystem.config.js
pm2 save
EOF

# Configurar auto-start para o usuário dedicado
sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" | grep -E '^sudo' | bash

print_color $GREEN "✅ PM2 configurado para usuário $APP_USER"
increment_step

# 16. Criar scripts de manutenção
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando scripts de manutenção..."

# Script de deploy
sudo -u "$APP_USER" cat > "$APP_DIR/deploy.sh" << EOF
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Family Care..."

cd "$APP_DIR"

# Parar aplicação
pm2 stop $APP_NAME || true

# Backup do banco
echo "📦 Fazendo backup do banco..."
mkdir -p backups
PGPASSWORD='$DB_PASSWORD' pg_dump -U $DB_USER -h localhost $DB_NAME > backups/backup_\$(date +%Y%m%d_%H%M%S).sql

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Build
echo "🏗️ Executando build..."
npm run build

# Reiniciar aplicação
echo "▶️ Reiniciando aplicação..."
pm2 restart $APP_NAME

echo "✅ Deploy concluído!"
EOF

chmod +x "$APP_DIR/deploy.sh"

# Script de monitoramento
sudo -u "$APP_USER" cat > "$APP_DIR/monitor.sh" << EOF
#!/bin/bash

echo "=== FAMILY CARE - STATUS DO SISTEMA ==="
echo "Data: \$(date)"
echo ""

echo "=== SERVIÇOS ==="
echo "Nginx: \$(systemctl is-active nginx)"
echo "PostgreSQL: \$(systemctl is-active postgresql)"
echo "PM2: \$(pm2 list | grep -c online) processos online"
echo ""

echo "=== APLICAÇÃO ==="
pm2 show $APP_NAME 2>/dev/null || echo "Aplicação não encontrada"
echo ""

echo "=== RECURSOS ==="
echo "CPU: \$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | cut -d'%' -f1)%"
echo "RAM: \$(free -m | awk 'NR==2{printf "%.1f%%", \$3*100/\$2 }')"
echo "Disco: \$(df -h / | awk 'NR==2{print \$5}')"
echo ""

echo "=== LOGS RECENTES ==="
echo "--- PM2 (últimas 10 linhas) ---"
pm2 logs $APP_NAME --lines 10 2>/dev/null || echo "Sem logs PM2"
EOF

chmod +x "$APP_DIR/monitor.sh"

# Script de backup se solicitado
if [ "$SETUP_BACKUP" = "y" ]; then
    sudo -u "$APP_USER" cat > "$APP_DIR/backup.sh" << EOF
#!/bin/bash
set -e

BACKUP_DIR="$APP_DIR/backups"
mkdir -p \$BACKUP_DIR

# Fazer backup
BACKUP_FILE="\$BACKUP_DIR/backup_\$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD='$DB_PASSWORD' pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_FILE

# Comprimir backup
gzip \$BACKUP_FILE

echo "✅ Backup criado: \${BACKUP_FILE}.gz"

# Remover backups antigos (manter 7 dias)
find \$BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "🧹 Backups antigos removidos"
EOF

    chmod +x "$APP_DIR/backup.sh"
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/backups"

    # Agendar backup diário para o usuário dedicado
    sudo -u "$APP_USER" bash << EOF
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh >> /var/log/$APP_NAME/backup.log 2>&1") | crontab -
EOF
    print_color $GREEN "✅ Backup automático configurado"
fi

# Configurar SSL se solicitado
if [ "$SETUP_SSL" = "y" ] && [ -n "$DOMAIN_NAME" ]; then
    echo "🔒 Configurando SSL para $DOMAIN_NAME..."

    # Atualizar configuração Nginx
    sed -i "s/server_name _;/server_name $DOMAIN_NAME;/" /etc/nginx/sites-available/$APP_NAME
    systemctl reload nginx

    # Obter certificado SSL
    if [ -n "$GIT_USER_EMAIL" ]; then
        certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $GIT_USER_EMAIL
        # Agendar renovação automática
        (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
        print_color $GREEN "✅ SSL configurado para $DOMAIN_NAME"
    else
        print_color $YELLOW "⚠️  Email não fornecido. Configure SSL manualmente: certbot --nginx -d $DOMAIN_NAME"
    fi
fi

# Definir permissões finais
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "/var/log/$APP_NAME"

# Reiniciar serviços
systemctl restart nginx

echo ""
print_color $GREEN "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "===================================="
echo ""

print_color $BLUE "📊 INFORMAÇÕES DO SISTEMA:"
echo "App Name: $APP_NAME"
echo "App User: $APP_USER"
echo "App Directory: $APP_DIR"
echo "Database: $DB_NAME"
echo "DB User: $DB_USER"
echo "DB Password: $DB_PASSWORD"
echo "Port: $APP_PORT"
if [ -n "$DOMAIN_NAME" ]; then
    echo "Domain: $DOMAIN_NAME"
    if [ "$SETUP_SSL" = "y" ]; then
        echo "URL: https://$DOMAIN_NAME"
    else
        echo "URL: http://$DOMAIN_NAME"
    fi
else
    SERVER_IP=$(hostname -I | awk '{print $1}')
    echo "URL: http://$SERVER_IP"
fi
echo ""

print_color $BLUE "🔧 COMANDOS ÚTEIS (execute como usuário $APP_USER):"
echo "sudo -u $APP_USER pm2 list                    # Status da aplicação"
echo "sudo -u $APP_USER pm2 logs $APP_NAME         # Ver logs"
echo "sudo -u $APP_USER pm2 restart $APP_NAME      # Reiniciar app"
echo "sudo -u $APP_USER $APP_DIR/monitor.sh        # Status do sistema"
echo "sudo -u $APP_USER $APP_DIR/deploy.sh         # Deploy automático"
if [ "$SETUP_BACKUP" = "y" ]; then
    echo "sudo -u $APP_USER $APP_DIR/backup.sh         # Backup manual"
fi
echo ""

print_color $YELLOW "⚠️  IMPORTANTE - SEGURANÇA:"
echo "1. A aplicação roda como usuário '$APP_USER' (não root)"
echo "2. Guarde a senha do banco: $DB_PASSWORD"
echo "3. Guarde a chave da sessão: $SESSION_SECRET"
echo "4. Configure seu domínio DNS para apontar para este servidor"
echo ""

echo ""
print_color $PURPLE "✨ Family Care está pronto para uso com segurança!"

# Testar se a aplicação está rodando
sleep 5
if curl -s http://localhost:$APP_PORT > /dev/null; then
    print_color $GREEN "✅ Aplicação está respondendo na porta $APP_PORT"
else
    print_color $YELLOW "⚠️  Verificando status da aplicação..."
    sudo -u "$APP_USER" pm2 status || true
    print_color $YELLOW "Execute 'sudo -u $APP_USER pm2 logs $APP_NAME' para ver os logs"
fi
