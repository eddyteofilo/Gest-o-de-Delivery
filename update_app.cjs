const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(srcPath, 'utf8');

const targetRegex = /\{\/\*\s*Estimated Arrival\s*\*\/\}/;
const match = content.match(targetRegex);

if (match) {
const replacement = `            {/* Pagamento PIX */}
            {order.payment_method === 'pix' && order.payment_status === 'pending' && order.payment_qr_code_base64 && (
              <div className="card bg-white border-2 border-primary p-8 text-center space-y-4">
                <h3 className="text-xl font-black text-text-main">Pague com PIX</h3>
                <p className="text-sm text-text-muted">Escaneie o QR Code abaixo no app do seu banco para confirmar o pedido.</p>
                <img src={\`data:image/png;base64,\${order.payment_qr_code_base64}\`} alt="QR Code PIX" className="w-48 h-48 mx-auto rounded-xl shadow-sm border border-border" />
                <div className="pt-4">
                   <p className="text-xs font-bold text-text-muted mb-2 uppercase tracking-widest">Código Copia e Cola:</p>
                   <div className="flex bg-secondary p-3 rounded-xl gap-2 items-center">
                     <p className="text-xs text-text-main truncate flex-1 font-mono">{order.payment_qr_code}</p>
                     <button onClick={() => { navigator.clipboard.writeText(order.payment_qr_code); alert('Copiado!'); }} className="btn-primary text-xs py-2 px-4 shadow-none">Copiar</button>
                   </div>
                </div>
              </div>
            )}
            
            {order.payment_method === 'pix' && order.payment_status === 'approved' && (
              <div className="card bg-[#E8F8EE] border-none p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-[#2ECC71] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check size={24} />
                </div>
                <h3 className="text-lg font-black text-[#27AE60]">Pagamento Confirmado</h3>
                <p className="text-sm text-[#27AE60]/80">Seu PIX foi aprovado com sucesso!</p>
              </div>
            )}

            {/* Estimated Arrival */}`;

  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(srcPath, content, 'utf8');
  console.log('App.tsx atualizado com sucesso via script!');
} else {
  console.log('Alvo não encontrado');
}
