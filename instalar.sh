#!/data/data/com.termux/files/usr/bin/bash
# Instalador automático do WhatsApp Resumo para Termux (Android)
set -e

echo ""
echo "==================================="
echo "  Instalando o WhatsApp Resumo"
echo "==================================="
echo ""

echo "1/4 - Atualizando o Termux (pode demorar)..."
pkg update -y && pkg upgrade -y

echo ""
echo "2/4 - Instalando Node.js e Git..."
pkg install -y nodejs git

echo ""
echo "3/4 - Baixando o projeto..."
cd ~
[ -d whatsapp-resumo ] && rm -rf whatsapp-resumo
git clone https://github.com/jailanne-maria/whatsapp-resumo.git
cd whatsapp-resumo

echo ""
echo "4/4 - Instalando dependências..."
npm install

echo ""
echo "Ativando o modo 'não dormir'..."
termux-wake-lock || true

echo ""
echo "==================================="
echo "  ✅ Instalado com sucesso!"
echo "==================================="
echo ""
echo "Para INICIAR o bot, rode:"
echo "   cd ~/whatsapp-resumo && node index.js"
echo ""
echo "Na primeira vez, vai aparecer um QR Code:"
echo "   abra o WhatsApp > Aparelhos conectados > Conectar um aparelho"
echo ""
echo "Para ATIVAR O RESUMO COM IA (opcional):"
echo "   pegue uma chave grátis em https://aistudio.google.com/apikey"
echo "   depois rode:  cd ~/whatsapp-resumo && nano config.local.js"
echo ""
