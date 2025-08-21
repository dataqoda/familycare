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
    local line_no=$1
    print_color $RED "❌ Erro na linha $line_no. Abortando instalação..."
    exit 1
}

# Configurar trap para capturar erros
trap 'handle_error $LINENO' ERR

# Função para perguntar com valor padrão
ask_with_default() {
    local prompt="$1"
    local default="$2"
    local result

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " result
        echo "${result:-$default}"
    else
        read -p "$prompt: " result
        echo "$result"
    fi
}

# Função para perguntar sim/não
ask_yes_no() {
    local prompt="$1"
    local default="$2"
    local result

    while true; do
        if [ "$default" = "y" ]; then
            read -p "$prompt [Y/n]: " result
            result=${result:-y}
        else
            read -p "$prompt [y/N]: " result
            result=${result:-n}
        fi

        case $result in
            [Yy]* ) echo "y"; break;;
            [Nn]* ) echo "n"; break;;
            * ) echo "Por favor, responda yes ou no.";;
        esac
    done
}

clear
print_color $PURPLE "🚀 FAMILY CARE - SCRIPT DE DEPLOY INTERATIVO"
print_color $CYAN "============================================="
echo ""
print_color $YELLOW "Este script irá configurar completamente seu servidor Ubuntu"
print_color $YELLOW "para rodar a aplicação Family Care em produção."
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

GITHUB_URL=$(ask_with_default "URL do repositório GitHub" "https://github.com/dataqoda/familycare.git")
GIT_USER_NAME=$(ask_with_default "Seu nome para configuração do Git" "Family Care Admin")
GIT_USER_EMAIL=$(ask_with_default "Seu email para configuração do Git" "admin@familycare.com")
DOMAIN_NAME=$(ask_with_default "Domínio personalizado (deixe vazio se não tiver)" "")
APP_NAME=$(ask_with_default "Nome da aplicação para PM2" "family-care")
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
SETUP_MONITORING=$(ask_yes_no "Instalar monitoramento básico" "y")
SETUP_FAIL2BAN=$(ask_yes_no "Instalar fail2ban para segurança" "y")

echo ""
print_color $GREEN "✅ INFORMAÇÕES COLETADAS!"
echo "=========================="
echo "GitHub URL: $GITHUB_URL"
echo "Git User: $GIT_USER_NAME <$GIT_USER_EMAIL>"
echo "Domínio: ${DOMAIN_NAME:-'Não configurado'}"
echo "App Name: $APP_NAME"
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

TOTAL_STEPS=15
CURRENT_STEP=1

# 1. Atualizar sistema
show_progress $CURRENT_STEP $TOTAL_STEPS "Atualizando sistema..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
((CURRENT_STEP++))

# 2. Instalar ferramentas básicas
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando ferramentas básicas..."
apt-get install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release unzip git build-essential
((CURRENT_STEP++))

# 3. Instalar Node.js 20
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
print_color $GREEN "✅ Node.js $(node --version) instalado"
print_color $GREEN "✅ npm $(npm --version) instalado"
((CURRENT_STEP++))

# 4. Instalar PostgreSQL 16
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PostgreSQL 16..."
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt-get update -y
apt-get install -y postgresql-16 postgresql-client-16
((CURRENT_STEP++))

# 5. Configurar PostgreSQL
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
((CURRENT_STEP++))

# 6. Instalar Nginx
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
((CURRENT_STEP++))

# 7. Instalar PM2
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PM2..."
npm install -g pm2@latest
print_color $GREEN "✅ PM2 instalado"
((CURRENT_STEP++))

# 8. Configurar Firewall (se solicitado)
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
((CURRENT_STEP++))

# 9. Instalar fail2ban (se solicitado)
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
((CURRENT_STEP++))

# 10. Instalar Certbot
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando Certbot para SSL..."
apt-get install -y certbot python3-certbot-nginx
((CURRENT_STEP++))

# 11. Criar diretório da aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando estrutura de diretórios..."
mkdir -p /opt/$APP_NAME
mkdir -p /var/log/pm2
cd /opt/$APP_NAME
((CURRENT_STEP++))

# 12. Configurar Git e clonar repositório
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando Git e clonando repositório..."
git config --global user.name "$GIT_USER_NAME"
git config --global user.email "$GIT_USER_EMAIL"
git config --global init.defaultBranch main

# Clonar repositório
git clone $GITHUB_URL .
print_color $GREEN "✅ Repositório clonado de $GITHUB_URL"
((CURRENT_STEP++))

# 13. Criar arquivo .env e instalar dependências
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando aplicação..."
cat > /opt/$APP_NAME/.env << EOL
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

# Instalar dependências
npm install
print_color $GREEN "✅ Dependências instaladas"

# Build da aplicação
npm run build
print_color $GREEN "✅ Build concluído"
((CURRENT_STEP++))

# 14. Configurar PM2 e iniciar aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando PM2..."
cat > /opt/$APP_NAME/ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: '$APP_PORT'
    },
    error_file: '/var/log/pm2/$APP_NAME-error.log',
    out_file: '/var/log/pm2/$APP_NAME-out.log',
    log_file: '/var/log/pm2/$APP_NAME-combined.log',
    time: true
  }]
};
EOL

# Iniciar aplicação
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

print_color $GREEN "✅ PM2 configurado e aplicação iniciada"
((CURRENT_STEP++))

# 15. Criar scripts de manutenção
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando scripts de manutenção..."

# Script de deploy
cat > /opt/$APP_NAME/deploy.sh << EOL
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Family Care..."

cd /opt/$APP_NAME

# Parar aplicação
pm2 stop $APP_NAME || true

# Backup do banco
echo "📦 Fazendo backup do banco..."
mkdir -p backups
pg_dump -U $DB_USER -h localhost $DB_NAME > backups/backup_\$(date +%Y%m%d_%H%M%S).sql

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
EOL

chmod +x /opt/$APP_NAME/deploy.sh

# Script de monitoramento
cat > /opt/$APP_NAME/monitor.sh << EOL
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
pm2 show $APP_NAME --nojs 2>/dev/null || echo "Aplicação não encontrada"
echo ""

echo "=== RECURSOS ==="
echo "CPU: \$(top -bn1 | grep "Cpu(s)" | awk '{print \$2}' | cut -d'%' -f1)%"
echo "RAM: \$(free -m | awk 'NR==2{printf "%.1f%%", \$3*100/\$2 }')"
echo "Disco: \$(df -h / | awk 'NR==2{print \$5}')"
echo ""

echo "=== LOGS RECENTES ==="
echo "--- PM2 (últimas 10 linhas) ---"
pm2 logs $APP_NAME --lines 10 --nojs 2>/dev/null || echo "Sem logs PM2"
EOL

chmod +x /opt/$APP_NAME/monitor.sh

# Script de backup se solicitado
if [ "$SETUP_BACKUP" = "y" ]; then
    cat > /opt/$APP_NAME/backup.sh << EOL
#!/bin/bash
set -e

BACKUP_DIR="/opt/$APP_NAME/backups"
mkdir -p \$BACKUP_DIR

# Fazer backup
BACKUP_FILE="\$BACKUP_DIR/backup_\$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U $DB_USER -h localhost $DB_NAME > \$BACKUP_FILE

# Comprimir backup
gzip \$BACKUP_FILE

echo "✅ Backup criado: \${BACKUP_FILE}.gz"

# Remover backups antigos (manter 7 dias)
find \$BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +7 -delete

echo "🧹 Backups antigos removidos"
EOL

    chmod +x /opt/$APP_NAME/backup.sh
    mkdir -p /opt/$APP_NAME/backups

    # Agendar backup diário
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/$APP_NAME/backup.sh >> /var/log/backup.log 2>&1") | crontab -
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

# Definir permissões
chown -R www-data:www-data /opt/$APP_NAME
chmod -R 755 /opt/$APP_NAME

# Reiniciar serviços
systemctl restart nginx

echo ""
print_color $GREEN "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "===================================="
echo ""

print_color $BLUE "📊 INFORMAÇÕES DO SISTEMA:"
echo "App Name: $APP_NAME"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASSWORD"
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

print_color $BLUE "🔧 COMANDOS ÚTEIS:"
echo "pm2 list                    # Status da aplicação"
echo "pm2 logs $APP_NAME         # Ver logs"
echo "pm2 restart $APP_NAME      # Reiniciar app"
echo "./monitor.sh               # Status do sistema"
echo "./deploy.sh                # Deploy automático"
if [ "$SETUP_BACKUP" = "y" ]; then
    echo "./backup.sh                # Backup manual"
fi
echo ""

print_color $YELLOW "⚠️  IMPORTANTE:"
echo "1. Guarde a senha do banco: $DB_PASSWORD"
echo "2. Guarde a chave da sessão: $SESSION_SECRET"
echo "3. Configure seu domínio DNS para apontar para este servidor"
echo ""

echo ""
print_color $PURPLE "✨ Family Care está pronto para uso!"

# Testar se a aplicação está rodando
sleep 5
if curl -s http://localhost:$APP_PORT > /dev/null; then
    print_color $GREEN "✅ Aplicação está respondendo na porta $APP_PORT"
else
    print_color $YELLOW "⚠️  Verificando status da aplicação..."
    pm2 status
    print_color $YELLOW "Execute 'pm2 logs $APP_NAME' para ver os logs"
fi