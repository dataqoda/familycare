#!/bin/bash
set -e

echo "🚀 Configurando Ubuntu Server para Prontuário Familiar..."

# Atualizar sistema
echo "📦 Atualizando sistema..."
apt update && apt upgrade -y

# Instalar curl e wget se não estiverem instalados
echo "🔧 Instalando ferramentas básicas..."
apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates lsb-release

# Instalar Node.js 20 LTS
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalação Node.js
echo "✅ Node.js versão: $(node --version)"
echo "✅ npm versão: $(npm --version)"

# Instalar PostgreSQL 16
echo "🗄️ Instalando PostgreSQL 16..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16 postgresql-client-16

# Configurar PostgreSQL
echo "🔐 Configurando PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Configurar usuário postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres createdb prontuario_db

# Configurar PostgreSQL para aceitar conexões locais
echo "📝 Configurando autenticação PostgreSQL..."
PG_VERSION=16
PG_CONFIG_DIR="/etc/postgresql/$PG_VERSION/main"

# Backup do arquivo original
cp "$PG_CONFIG_DIR/pg_hba.conf" "$PG_CONFIG_DIR/pg_hba.conf.backup"

# Configurar autenticação MD5 para conexões locais
cat > "$PG_CONFIG_DIR/pg_hba.conf" << 'EOL'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
EOL

# Reiniciar PostgreSQL
systemctl restart postgresql

# Instalar Nginx
echo "🌐 Instalando Nginx..."
apt install -y nginx

# Configurar Nginx
echo "⚙️ Configurando Nginx..."
cat > /etc/nginx/sites-available/prontuario-app << 'EOL'
server {
    listen 80;
    server_name _;

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Configurações para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/prontuario_access.log;
    error_log /var/log/nginx/prontuario_error.log;
}
EOL

# Habilitar site
ln -sf /etc/nginx/sites-available/prontuario-app /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testar configuração Nginx
nginx -t

# Instalar PM2 globalmente
echo "📊 Instalando PM2..."
npm install -g pm2

# Instalar Certbot para SSL
echo "🔒 Instalando Certbot para SSL..."
apt install -y certbot python3-certbot-nginx

# Configurar firewall
echo "🔥 Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 80
ufw allow 443

# Criar diretório da aplicação
echo "📁 Criando diretório da aplicação..."
mkdir -p /opt/prontuario-app
cd /opt/prontuario-app

# Criar arquivo .env
echo "📝 Criando arquivo de configuração..."
cat > /opt/prontuario-app/.env << 'EOL'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/prontuario_db
SESSION_SECRET=sua_chave_secreta_super_segura_aqui_123456789
EOL

# Criar script de deploy
echo "📋 Criando script de deploy..."
cat > /opt/prontuario-app/deploy.sh << 'EOL'
#!/bin/bash
set -e

echo "🚀 Iniciando deploy..."

# Ir para diretório da aplicação
cd /opt/prontuario-app

# Parar aplicação se estiver rodando
pm2 stop prontuario-app || true

# Fazer backup do banco (opcional)
# pg_dump -U postgres prontuario_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Atualizar código do Git
if [ -d ".git" ]; then
  echo "📥 Atualizando código do repositório..."
  git pull origin main
else
  echo "⚠️  Repositório Git não encontrado. Clone manualmente:"
  echo "git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git ."
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install --production

# Executar build
echo "🏗️ Executando build..."
npm run build

# Executar migrações do banco
echo "🗄️ Executando migrações..."
npm run db:push

# Iniciar aplicação com PM2
echo "▶️ Iniciando aplicação..."
pm2 start npm --name "prontuario-app" -- start

# Salvar configuração PM2
pm2 save

echo "✅ Deploy concluído!"
echo "📱 Aplicação rodando em: http://$(hostname -I | awk '{print $1}')"
EOL

# Tornar script executável
chmod +x /opt/prontuario-app/deploy.sh

# Configurar PM2 para inicializar no boot
echo "🔄 Configurando PM2 para auto-start..."
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# Definir permissões
chown -R www-data:www-data /opt/prontuario-app
chmod -R 755 /opt/prontuario-app

# Iniciar serviços
echo "▶️ Iniciando serviços..."
systemctl restart nginx
systemctl restart postgresql

# Criar script para configurar SSL (executar após ter domínio)
echo "🔒 Criando script para configurar SSL..."
cat > /opt/prontuario-app/setup-ssl.sh << 'EOL'
#!/bin/bash
# Execute este script após configurar seu domínio
# Uso: ./setup-ssl.sh seudominio.com

if [ -z "$1" ]; then
  echo "Uso: ./setup-ssl.sh seudominio.com"
  exit 1
fi

DOMAIN=$1

# Configurar SSL com Certbot
certbot --nginx -d $DOMAIN

# Configurar renovação automática
crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -

echo "✅ SSL configurado para $DOMAIN"
EOL

chmod +x /opt/prontuario-app/setup-ssl.sh

# Criar script para monitoramento
cat > /opt/prontuario-app/monitor.sh << 'EOL'
#!/bin/bash

echo "=== STATUS DOS SERVIÇOS ==="
echo "Nginx: $(systemctl is-active nginx)"
echo "PostgreSQL: $(systemctl is-active postgresql)"
echo "PM2: $(pm2 list | grep -c online) processos online"

echo ""
echo "=== LOGS RECENTES ==="
echo "--- Nginx ---"
tail -n 5 /var/log/nginx/prontuario_error.log

echo ""
echo "--- PM2 ---"
pm2 logs --lines 5

echo ""
echo "=== USO DE RECURSOS ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
EOL

chmod +x /opt/prontuario-app/monitor.sh

echo ""
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo ""
echo "=== PRÓXIMOS PASSOS ==="
echo "1. Clone seu repositório Family Care:"
echo "   cd /opt/prontuario-app"
echo "   git clone https://github.com/dataqoda/familycare.git ."
echo ""
echo "2. Configure o Git (se necessário):"
echo "   git config --global user.name 'Seu Nome'"
echo "   git config --global user.email 'seu@email.com'"
echo ""
echo "3. Execute o primeiro deploy:"
echo "   ./deploy.sh"
echo ""
echo "4. Configure SSL (se tiver domínio):"
echo "   ./setup-ssl.sh seudominio.com"
echo ""
echo "=== INFORMAÇÕES IMPORTANTES ==="
echo "📱 Aplicação rodará em: http://$(hostname -I | awk '{print $1}')"
echo "🗄️ PostgreSQL: localhost:5432"
echo "   Usuário: postgres"
echo "   Senha: postgres"
echo "   Banco: prontuario_db"
echo ""
echo "🔧 Comandos úteis:"
echo "   pm2 list              # Ver status da aplicação"
echo "   pm2 logs              # Ver logs"
echo "   pm2 restart all       # Reiniciar aplicação"
echo "   ./monitor.sh          # Monitorar sistema"
echo "   ./deploy.sh           # Deploy automático"
echo ""
echo "📁 Arquivos importantes:"
echo "   /opt/prontuario-app/.env      # Configurações"
echo "   /var/log/nginx/               # Logs Nginx"
echo "   /opt/prontuario-app/          # Aplicação"