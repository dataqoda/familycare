
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

# Coletar informações do usuário
print_color $BLUE "📋 COLETANDO INFORMAÇÕES DE CONFIGURAÇÃO"
echo "----------------------------------------"

GITHUB_URL=$(ask_with_default "URL do repositório GitHub" "https://github.com/dataqoda/familycare.git")
GIT_USER_NAME=$(ask_with_default "Seu nome para configuração do Git" "")
GIT_USER_EMAIL=$(ask_with_default "Seu email para configuração do Git" "")
DOMAIN_NAME=$(ask_with_default "Domínio personalizado (deixe vazio se não tiver)" "")
APP_NAME=$(ask_with_default "Nome da aplicação para PM2" "family-care")
DB_NAME=$(ask_with_default "Nome do banco de dados" "familycare_db")
DB_USER=$(ask_with_default "Usuário do banco de dados" "familycare_user")
DB_PASSWORD=$(ask_with_default "Senha do banco de dados" "$(openssl rand -base64 32)")
SESSION_SECRET=$(ask_with_default "Chave secreta da sessão" "$(openssl rand -base64 64)")
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
echo "Database: $DB_NAME"
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

TOTAL_STEPS=20
CURRENT_STEP=1

# 1. Atualizar sistema
show_progress $CURRENT_STEP $TOTAL_STEPS "Atualizando sistema..."
apt update && apt upgrade -y
((CURRENT_STEP++))

# 2. Instalar ferramentas básicas
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando ferramentas básicas..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release unzip git
((CURRENT_STEP++))

# 3. Instalar Node.js 20
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_color $GREEN "✅ Node.js $(node --version) instalado"
print_color $GREEN "✅ npm $(npm --version) instalado"
((CURRENT_STEP++))

# 4. Instalar PostgreSQL 16
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16 postgresql-client-16
((CURRENT_STEP++))

# 5. Configurar PostgreSQL
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Criar usuário e banco
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

# Configurar autenticação
PG_VERSION=16
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"
cp "$PG_CONFIG_DIR/pg_hba.conf" "$PG_CONFIG_DIR/pg_hba.conf.backup"

cat > "$PG_CONFIG_DIR/pg_hba.conf" << EOL
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOL

systemctl restart postgresql
print_color $GREEN "✅ PostgreSQL configurado com banco '$DB_NAME'"
((CURRENT_STEP++))

# 6. Instalar Nginx
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando e configurando Nginx..."
apt install -y nginx

# Configurar Nginx
cat > /etc/nginx/sites-available/$APP_NAME << EOL
server {
    listen 80;
    server_name ${DOMAIN_NAME:-_};

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header X-Robots-Tag "noindex, nofollow" always;

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

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=static:10m rate=50r/s;

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
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
        limit_req zone=static burst=100 nodelay;
        proxy_pass http://127.0.0.1:$APP_PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options "nosniff";
    }

    # Main application
    location / {
        limit_req zone=api burst=50 nodelay;
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
nginx -t
((CURRENT_STEP++))

# 7. Instalar PM2
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando PM2..."
npm install -g pm2
((CURRENT_STEP++))

# 8. Configurar Firewall (se solicitado)
if [ "$SETUP_FIREWALL" = "y" ]; then
    show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando firewall UFW..."
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
    apt install -y fail2ban
    
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
apt install -y certbot python3-certbot-nginx
((CURRENT_STEP++))

# 11. Criar diretório da aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando estrutura de diretórios..."
mkdir -p /opt/$APP_NAME
cd /opt/$APP_NAME
((CURRENT_STEP++))

# 12. Configurar Git
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando Git..."
if [ -n "$GIT_USER_NAME" ] && [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.name "$GIT_USER_NAME"
    git config --global user.email "$GIT_USER_EMAIL"
    print_color $GREEN "✅ Git configurado para $GIT_USER_NAME"
fi
((CURRENT_STEP++))

# 13. Clonar repositório
show_progress $CURRENT_STEP $TOTAL_STEPS "Clonando repositório Family Care..."
git clone $GITHUB_URL .
print_color $GREEN "✅ Repositório clonado de $GITHUB_URL"
((CURRENT_STEP++))

# 14. Criar arquivo .env
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando arquivo de configuração..."
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
((CURRENT_STEP++))

# 15. Instalar dependências
show_progress $CURRENT_STEP $TOTAL_STEPS "Instalando dependências do projeto..."
npm install --production
print_color $GREEN "✅ Dependências instaladas"
((CURRENT_STEP++))

# 16. Build da aplicação
show_progress $CURRENT_STEP $TOTAL_STEPS "Executando build da aplicação..."
npm run build
print_color $GREEN "✅ Build concluído"
((CURRENT_STEP++))

# 17. Configurar banco de dados
show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando banco de dados..."
npm run db:push
print_color $GREEN "✅ Schema do banco aplicado"
((CURRENT_STEP++))

# 18. Criar arquivo de configuração PM2
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

mkdir -p /var/log/pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root
print_color $GREEN "✅ PM2 configurado e aplicação iniciada"
((CURRENT_STEP++))

# 19. Criar scripts de manutenção
show_progress $CURRENT_STEP $TOTAL_STEPS "Criando scripts de manutenção..."

# Script de deploy
cat > /opt/$APP_NAME/deploy.sh << 'EOL'
#!/bin/bash
set -e

echo "🚀 Iniciando deploy do Family Care..."

cd /opt/REPLACE_APP_NAME

# Parar aplicação
pm2 stop REPLACE_APP_NAME || true

# Backup do banco
echo "📦 Fazendo backup do banco..."
pg_dump -U REPLACE_DB_USER -h localhost REPLACE_DB_NAME > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Build
echo "🏗️ Executando build..."
npm run build

# Migrar banco
echo "🗄️ Aplicando migrações..."
npm run db:push

# Reiniciar aplicação
echo "▶️ Reiniciando aplicação..."
pm2 restart REPLACE_APP_NAME

echo "✅ Deploy concluído!"
EOL

# Substituir placeholders
sed -i "s/REPLACE_APP_NAME/$APP_NAME/g" /opt/$APP_NAME/deploy.sh
sed -i "s/REPLACE_DB_USER/$DB_USER/g" /opt/$APP_NAME/deploy.sh
sed -i "s/REPLACE_DB_NAME/$DB_NAME/g" /opt/$APP_NAME/deploy.sh

chmod +x /opt/$APP_NAME/deploy.sh

# Script de monitoramento
cat > /opt/$APP_NAME/monitor.sh << 'EOL'
#!/bin/bash

echo "=== FAMILY CARE - STATUS DO SISTEMA ==="
echo "Data: $(date)"
echo ""

echo "=== SERVIÇOS ==="
echo "Nginx: $(systemctl is-active nginx)"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "PM2: $(pm2 list | grep -c online) processos online"
echo ""

echo "=== APLICAÇÃO ==="
pm2 show REPLACE_APP_NAME --nojs 2>/dev/null || echo "Aplicação não encontrada"
echo ""

echo "=== LOGS RECENTES ==="
echo "--- Nginx (últimas 5 linhas) ---"
tail -n 5 /var/log/nginx/REPLACE_APP_NAME_error.log 2>/dev/null || echo "Sem logs de erro"
echo ""

echo "--- PM2 (últimas 10 linhas) ---"
pm2 logs REPLACE_APP_NAME --lines 10 --nojs 2>/dev/null || echo "Sem logs PM2"
echo ""

echo "=== RECURSOS ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
echo ""

echo "=== CONEXÕES ==="
echo "Nginx: $(ss -tuln | grep :80 | wc -l) conexões na porta 80"
echo "App: $(ss -tuln | grep :REPLACE_APP_PORT | wc -l) conexões na porta REPLACE_APP_PORT"
echo ""

echo "=== BANCO DE DADOS ==="
sudo -u postgres psql -d REPLACE_DB_NAME -c "SELECT count(*) as total_connections FROM pg_stat_activity;" 2>/dev/null || echo "Erro ao verificar conexões do banco"
EOL

sed -i "s/REPLACE_APP_NAME/$APP_NAME/g" /opt/$APP_NAME/monitor.sh
sed -i "s/REPLACE_APP_PORT/$APP_PORT/g" /opt/$APP_NAME/monitor.sh
sed -i "s/REPLACE_DB_NAME/$DB_NAME/g" /opt/$APP_NAME/monitor.sh

chmod +x /opt/$APP_NAME/monitor.sh

# Script de backup
if [ "$SETUP_BACKUP" = "y" ]; then
    cat > /opt/$APP_NAME/backup.sh << 'EOL'
#!/bin/bash
set -e

BACKUP_DIR="/opt/REPLACE_APP_NAME/backups"
DB_NAME="REPLACE_DB_NAME"
DB_USER="REPLACE_DB_USER"
MAX_BACKUPS=7

mkdir -p $BACKUP_DIR

# Fazer backup
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -U $DB_USER -h localhost $DB_NAME > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

echo "✅ Backup criado: ${BACKUP_FILE}.gz"

# Remover backups antigos
find $BACKUP_DIR -name "backup_*.sql.gz" -type f -mtime +$MAX_BACKUPS -delete

echo "🧹 Backups antigos removidos (mantidos últimos $MAX_BACKUPS dias)"
EOL

    sed -i "s/REPLACE_APP_NAME/$APP_NAME/g" /opt/$APP_NAME/backup.sh
    sed -i "s/REPLACE_DB_NAME/$DB_NAME/g" /opt/$APP_NAME/backup.sh
    sed -i "s/REPLACE_DB_USER/$DB_USER/g" /opt/$APP_NAME/backup.sh
    
    chmod +x /opt/$APP_NAME/backup.sh
    mkdir -p /opt/$APP_NAME/backups
    
    # Agendar backup diário
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/$APP_NAME/backup.sh >> /var/log/backup.log 2>&1") | crontab -
    print_color $GREEN "✅ Backup automático configurado (diário às 2h)"
fi

((CURRENT_STEP++))

# 20. Configurar SSL (se solicitado e domínio fornecido)
if [ "$SETUP_SSL" = "y" ] && [ -n "$DOMAIN_NAME" ]; then
    show_progress $CURRENT_STEP $TOTAL_STEPS "Configurando SSL para $DOMAIN_NAME..."
    
    # Atualizar configuração Nginx com domínio correto
    sed -i "s/server_name _;/server_name $DOMAIN_NAME;/" /etc/nginx/sites-available/$APP_NAME
    systemctl reload nginx
    
    # Obter certificado SSL
    certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $GIT_USER_EMAIL
    
    # Agendar renovação automática
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    print_color $GREEN "✅ SSL configurado para $DOMAIN_NAME"
else
    # Criar script para configurar SSL posteriormente
    cat > /opt/$APP_NAME/setup-ssl.sh << 'EOL'
#!/bin/bash
if [ -z "$1" ]; then
  echo "Uso: ./setup-ssl.sh seudominio.com"
  exit 1
fi

DOMAIN=$1
APP_NAME="REPLACE_APP_NAME"

# Atualizar Nginx
sed -i "s/server_name _;/server_name $DOMAIN;/" /etc/nginx/sites-available/$APP_NAME
systemctl reload nginx

# Configurar SSL
certbot --nginx -d $DOMAIN

# Agendar renovação
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "✅ SSL configurado para $DOMAIN"
EOL
    
    sed -i "s/REPLACE_APP_NAME/$APP_NAME/g" /opt/$APP_NAME/setup-ssl.sh
    chmod +x /opt/$APP_NAME/setup-ssl.sh
fi
((CURRENT_STEP++))

# Definir permissões
chown -R www-data:www-data /opt/$APP_NAME
chmod -R 755 /opt/$APP_NAME

# Iniciar serviços
systemctl restart nginx

# Configurar logs rotativos
cat > /etc/logrotate.d/$APP_NAME << EOL
/var/log/nginx/${APP_NAME}_*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        systemctl reload nginx
    endscript
}

/var/log/pm2/${APP_NAME}-*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        pm2 reloadLogs
    endscript
}
EOL

echo ""
print_color $GREEN "🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "===================================="
echo ""

print_color $BLUE "📊 INFORMAÇÕES DO SISTEMA:"
echo "App Name: $APP_NAME"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Port: $APP_PORT"
if [ -n "$DOMAIN_NAME" ]; then
    echo "Domain: $DOMAIN_NAME"
    if [ "$SETUP_SSL" = "y" ]; then
        echo "URL: https://$DOMAIN_NAME"
    else
        echo "URL: http://$DOMAIN_NAME"
    fi
else
    echo "URL: http://$(hostname -I | awk '{print $1}')"
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
if [ -f "/opt/$APP_NAME/setup-ssl.sh" ]; then
    echo "./setup-ssl.sh DOMAIN      # Configurar SSL"
fi
echo ""

print_color $BLUE "📁 ARQUIVOS IMPORTANTES:"
echo "/opt/$APP_NAME/.env                    # Configurações"
echo "/var/log/nginx/${APP_NAME}_*.log       # Logs Nginx"
echo "/var/log/pm2/${APP_NAME}-*.log         # Logs da aplicação"
echo "/opt/$APP_NAME/backups/                # Backups do banco"
echo ""

print_color $YELLOW "⚠️  IMPORTANTE:"
echo "1. Guarde a senha do banco: $DB_PASSWORD"
echo "2. Guarde a chave da sessão: $SESSION_SECRET"
echo "3. Configure seu domínio DNS para apontar para este servidor"
echo "4. Execute './monitor.sh' regularmente para verificar o status"
echo ""

if [ -n "$DOMAIN_NAME" ] && [ "$SETUP_SSL" = "y" ]; then
    print_color $GREEN "🔒 SSL configurado! Sua aplicação está disponível em:"
    print_color $GREEN "   https://$DOMAIN_NAME"
else
    print_color $YELLOW "🌐 Sua aplicação está disponível em:"
    print_color $YELLOW "   http://$(hostname -I | awk '{print $1}')"
fi

echo ""
print_color $PURPLE "✨ Family Care está pronto para uso!"

# Testar se a aplicação está rodando
sleep 5
if curl -s http://localhost:$APP_PORT > /dev/null; then
    print_color $GREEN "✅ Aplicação está respondendo na porta $APP_PORT"
else
    print_color $RED "❌ Aplicação não está respondendo. Verifique os logs:"
    print_color $RED "   pm2 logs $APP_NAME"
fi
