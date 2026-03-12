import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Truck,
  BarChart3,
  LogOut,
  Menu as MenuIcon,
  X,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  UserPlus,
  Search,
  Users,
  Settings,
  CreditCard,
  ArrowLeft,
  Heart,
  User,
  MapPin,
  Bike,
  Check,
  Home,
  FileText,
  Star,
  Map,
  Globe,
  Shield,
  Brain,
  MessageSquare,
  BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from './utils';
import { Restaurant, Product, Order, Courier, Category, ProductOption, Customer, Promotion, Plan } from './types';
import Papa from 'papaparse';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
      active ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-muted hover:bg-gray-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Toast = ({ error, success, setError, setSuccess }: { error: string | null, success: string | null, setError: (v: string | null) => void, setSuccess: (v: string | null) => void }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
    <AnimatePresence>
      {error && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{success}</span>
          <button onClick={() => setSuccess(null)}><X size={14} /></button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const OrderDetailModal = ({ order, isOpen, onClose, onUpdateStatus, couriers, token }: { order: Order | null, isOpen: boolean, onClose: () => void, onUpdateStatus: (id: number, status: string) => void, couriers: Courier[], token: string | null }) => (
  <AnimatePresence>
    {isOpen && order && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div>
              <h3 className="font-bold text-xl">Pedido #{order.id}</h3>
              <p className="text-sm text-text-muted">{formatDate(order.created_at)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <span className={cn("px-3 py-1 rounded-full text-sm font-bold", ORDER_STATUS_COLORS[order.status])}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                  className="bg-white border-gray-200 rounded-lg text-sm py-1.5 px-3 focus:ring-2 ring-primary/20 cursor-pointer hover:border-primary/50 transition-colors"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-muted">Entregador:</span>
                <select
                  value={order.courier_id || ''}
                  onChange={async (e) => {
                    const courierId = e.target.value ? parseInt(e.target.value) : null;
                    await fetch(`/api/restaurant/orders/${order.id}/status`, {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ status: order.status, courier_id: courierId })
                    });
                    onUpdateStatus(order.id, order.status); // Trigger refresh
                  }}
                  className="bg-white border-gray-200 rounded-lg text-sm py-1.5 px-3 focus:ring-2 ring-primary/20"
                >
                  <option value="">Selecione...</option>
                  {couriers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.vehicle_type})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase text-text-muted">Cliente</h4>
                <p className="font-medium text-lg">{order.customer_name}</p>
                <p className="text-text-muted flex items-center gap-2">
                  <span className="bg-gray-100 p-1 rounded text-xs">📞</span> {order.customer_phone}
                </p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase text-text-muted">Endereço de Entrega</h4>
                <p className="font-medium bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {order.customer_address}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-text-muted mb-3">Itens do Pedido</h4>
              <div className="space-y-3">
                {order.items?.map((item, idx) => {
                  let options = [];
                  try {
                    options = item.options ? JSON.parse(item.options) : [];
                  } catch (e) { }

                  return (
                    <div key={idx} className="flex justify-between items-start p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex gap-3">
                        <div className="bg-gray-100 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-gray-600">
                          {item.quantity}x
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{item.product_name}</p>
                          {options.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {options.map((opt: any, i: number) => (
                                <span key={i} className="text-xs bg-white border border-gray-200 px-1.5 py-0.5 rounded text-text-muted">
                                  + {opt.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">
                        {formatCurrency((item.price + options.reduce((acc: number, curr: any) => acc + curr.price, 0)) * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-text-muted font-medium">Total do Pedido</span>
            <span className="text-2xl font-black text-primary">{formatCurrency(order.total)}</span>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ProductModal = ({ isOpen, onClose, onSubmit, categories }: { isOpen: boolean, onClose: () => void, onSubmit: (e: React.FormEvent) => void, categories: Category[] }) => {
  const [optionRows, setOptionRows] = useState([0]);
  const [isNewCategory, setIsNewCategory] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg">Novo Produto</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">Nome</label>
                  <input name="name" required className="input" placeholder="Ex: X-Bacon" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">Preço (R$)</label>
                  <input name="price" type="number" step="0.01" required className="input" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Descrição</label>
                <textarea name="description" className="input min-h-[80px]" placeholder="Ingredientes, detalhes..." />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Categoria</label>
                <select
                  name="category_id"
                  className="input"
                  onChange={(e) => setIsNewCategory(e.target.value === 'new')}
                >
                  <option value="">Sem Categoria</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value="new">+ Nova Categoria</option>
                </select>
                {isNewCategory && (
                  <input name="new_category" className="input mt-2" placeholder="Nome da nova categoria" />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Imagem</label>
                <div className="flex gap-2">
                  <input name="image_url" className="input" placeholder="URL da imagem (opcional)" />
                </div>
                <p className="text-xs text-center text-text-muted my-1">- OU -</p>
                <input name="image_file" type="file" accept="image/*" className="input text-sm" />
              </div>

              <div className="space-y-2 border-t border-gray-100 pt-4">
                <label className="text-xs font-bold uppercase text-text-muted flex justify-between items-center">
                  Opções / Adicionais
                  <button type="button" onClick={() => setOptionRows(prev => [...prev, prev.length])} className="text-primary text-xs">+ Adicionar</button>
                </label>
                {optionRows.map((idx) => (
                  <div key={idx} className="flex gap-2 option-row">
                    <input className="input opt-name" placeholder="Nome (ex: Bacon Extra)" />
                    <input className="input opt-price w-24" type="number" step="0.01" placeholder="R$ 0.00" />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" name="is_daily_offer" id="daily_offer" className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
                <label htmlFor="daily_offer" className="text-sm font-medium">Oferta do Dia (Destaque)</label>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full">Salvar Produto</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CourierModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (e: React.FormEvent) => void }) => {
  const [vehicleType, setVehicleType] = useState('moto');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-bold text-lg">Novo Entregador</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Nome Completo</label>
                <input name="name" required className="input" placeholder="Ex: João da Silva" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">Telefone</label>
                  <input name="phone" required className="input" placeholder="(00) 00000-0000" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">RG</label>
                  <input name="rg" required className="input" placeholder="00.000.000-0" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Endereço</label>
                <input name="address" required className="input" placeholder="Rua, Número, Bairro" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Tipo de Veículo</label>
                <select
                  name="vehicle_type"
                  className="input"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="moto">Moto</option>
                  <option value="carro">Carro</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="ape">A Pé</option>
                </select>
              </div>

              {(vehicleType === 'moto' || vehicleType === 'carro') && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-text-muted">Placa</label>
                    <input name="vehicle_plate" required className="input bg-white" placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-text-muted">Renavam</label>
                    <input name="vehicle_renavam" required className="input bg-white" placeholder="00000000000" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Foto do Entregador</label>
                <div className="flex gap-2">
                  <input name="photo_url" className="input" placeholder="URL da foto (opcional)" />
                </div>
                <p className="text-xs text-center text-text-muted my-1">- OU -</p>
                <input name="photo_file" type="file" accept="image/*" className="input text-sm" />
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full">Cadastrar Entregador</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const PromotionModal = ({ isOpen, onClose, onSubmit, promotion }: { isOpen: boolean, onClose: () => void, onSubmit: (e: React.FormEvent) => void, promotion: Promotion | null }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-text-main">{promotion ? 'Editar Promoção' : 'Nova Promoção'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Título da Campanha</label>
              <input name="title" required defaultValue={promotion?.title} placeholder="Ex: Combos de Verão" className="input" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Texto do Desconto</label>
              <input name="discount_text" required defaultValue={promotion?.discount_text} placeholder="Ex: 30% OFF" className="input" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Imagem da Promoção</label>
              <input name="image_url" defaultValue={promotion?.image_url} placeholder="Cole a URL da imagem (https://...)" className="input" />
              <p className="text-xs text-center text-text-muted my-1">— OU —</p>
              <input name="image_file" type="file" accept="image/*" className="input text-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Válido Até (Opcional)</label>
              <input name="valid_until" type="datetime-local" defaultValue={promotion?.valid_until ? new Date(promotion.valid_until).toISOString().slice(0, 16) : ''} className="input" />
            </div>

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-50 text-text-main font-black rounded-2xl hover:bg-gray-100 uppercase tracking-widest text-xs">Cancelar</button>
              <button type="submit" className="flex-[2] btn-primary py-4 shadow-xl shadow-primary/20">{promotion ? 'Salvar Alterações' : 'Criar Promoção'}</button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const DailyOfferModal = ({ isOpen, product, onClose, onAddToCart }: { isOpen: boolean, product: Product | null, onClose: () => void, onAddToCart: (p: Product) => void }) => (
  <AnimatePresence>
    {isOpen && product && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/80 rounded-full p-1 z-10 hover:bg-white"
          >
            <X size={20} />
          </button>

          <div className="h-48 bg-gray-100 relative">
            {product.image_url ? (
              <img src={product.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-primary/20">
                <Utensils size={64} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
              <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Oferta do Dia
              </span>
            </div>
          </div>

          <div className="p-6 text-center space-y-4">
            <div>
              <h3 className="text-2xl font-black text-gray-900">{product.name}</h3>
              <p className="text-text-muted text-sm mt-1 line-clamp-2">{product.description}</p>
            </div>

            <div className="text-3xl font-bold text-primary">
              {formatCurrency(product.price)}
            </div>

            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="btn-primary w-full py-3 shadow-lg shadow-primary/30"
            >
              Eu Quero!
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart }: { product: Product | null, isOpen: boolean, onClose: () => void, onAddToCart: (p: Product, opts: ProductOption[]) => void }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="h-48 bg-gray-100 relative flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Utensils size={48} />
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/80 rounded-full p-2 hover:bg-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="text-2xl font-bold">{product.name}</h3>
              <p className="text-text-muted mt-2">{product.description}</p>
              <p className="text-xl font-bold text-primary mt-4">{formatCurrency(product.price)}</p>

              {product.options && product.options.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-bold text-sm uppercase text-text-muted">Adicionais</h4>
                  {product.options.map(opt => (
                    <label key={opt.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                          checked={selectedOptions.includes(opt.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedOptions(prev => [...prev, opt.id]);
                            else setSelectedOptions(prev => prev.filter(id => id !== opt.id));
                          }}
                        />
                        <span>{opt.name}</span>
                      </div>
                      <span className="font-medium text-text-muted">+{formatCurrency(opt.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-white">
              <button
                onClick={() => {
                  const options = product.options?.filter(o => selectedOptions.includes(o.id)) || [];
                  onAddToCart(product, options);
                  onClose();
                }}
                className="btn-primary w-full py-3 flex justify-between items-center px-6"
              >
                <span>Adicionar ao Pedido</span>
                <span>
                  {formatCurrency(
                    product.price +
                    (product.options?.filter(o => selectedOptions.includes(o.id)).reduce((acc, curr) => acc + curr.price, 0) || 0)
                  )}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Views ---

const FeatureGuard = ({ 
  enabled, 
  title, 
  description, 
  onUpgrade, 
  children 
}: { 
  enabled: boolean, 
  title: string, 
  description: string, 
  onUpgrade: () => void, 
  children: React.ReactNode 
}) => {
  if (enabled) return <>{children}</>;
  
  return (
    <div className="relative min-h-[400px]">
      <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 max-w-sm"
        >
          <div className="w-16 h-16 bg-primary-soft text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h4 className="font-black text-xl text-text-main mb-2">Funcionalidade Premium</h4>
          <p className="text-sm text-text-muted mb-6">{description}</p>
          <button 
            type="button" 
            onClick={onUpgrade} 
            className="w-full py-3 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Fazer Upgrade Agora
          </button>
        </motion.div>
      </div>
      <div className="opacity-40 grayscale pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
};

const DashboardView = ({ summary, showAdvanced }: { summary: any, showAdvanced: boolean }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-black text-text-main">Visão Geral</h2>
      {!showAdvanced && (
        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg">Plano Básico</span>
      )}
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="card p-6 border-none shadow-premium bg-white">
        <p className="text-text-muted text-xs font-black uppercase tracking-widest">Pedidos Totais</p>
        <p className="text-4xl font-black mt-2 text-text-main">{summary?.total_orders || 0}</p>
      </div>
      <div className="card p-6 border-none shadow-premium bg-white">
        <p className="text-text-muted text-xs font-black uppercase tracking-widest">Receita Total</p>
        <p className="text-4xl font-black mt-2 text-primary">{formatCurrency(summary?.total_revenue || 0)}</p>
      </div>
      <div className="card p-6 border-none shadow-premium bg-white">
        <p className="text-text-muted text-xs font-black uppercase tracking-widest">Ticket Médio</p>
        <p className="text-4xl font-black mt-2 text-text-main">{formatCurrency(summary?.total_revenue / (summary?.total_orders || 1))}</p>
      </div>
    </div>

    {showAdvanced ? (
      <div className="card p-8 border-none shadow-premium bg-white space-y-6">
        <div className="flex items-center gap-2">
          <BarChart2 size={24} className="text-primary" />
          <h3 className="text-lg font-black text-text-main">Análise de Performance</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-xs font-black uppercase text-text-muted">Top Produtos</p>
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="font-bold text-sm">Produto {i}</span>
                  <span className="text-xs font-black text-primary">{(40 - i * 5)} vendas</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-black uppercase text-text-muted">Horários de Pico</p>
            <div className="h-40 bg-gray-50 rounded-2xl flex items-end gap-2 p-4">
              {[40, 70, 90, 60, 30, 80, 100].map((h, i) => (
                <div key={i} className="flex-1 bg-primary/20 rounded-t-lg hover:bg-primary transition-all cursor-help" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="card p-8 border-none shadow-premium bg-gray-50/50 border-2 border-dashed border-gray-100 flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
          <BarChart2 size={24} />
        </div>
        <div>
          <h4 className="font-bold text-text-main">Relatórios Avançados</h4>
          <p className="text-xs text-text-muted max-w-xs mt-1">Desbloqueie análises detalhadas de produtos, horários e comportamento de clientes.</p>
        </div>
        <button onClick={() => {}} className="text-xs font-black text-primary hover:underline">Upgrade para Profissional</button>
      </div>
    )}
  </div>
);

const AIView = ({ restaurant, token }: { restaurant: Restaurant | null, token: string | null }) => {
  const [enabled, setEnabled] = useState(false);
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-text-main">Assistente de IA</h2>
          <p className="text-text-muted font-medium mt-1">Configure o Chatbot inteligente para automatizar seus pedidos no WhatsApp e Web.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
          <span className="text-xs font-black uppercase text-text-muted ml-2">Status do Bot</span>
          <button 
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "relative w-12 h-6 rounded-full transition-all flex items-center px-1",
              enabled ? "bg-primary" : "bg-gray-200"
            )}
          >
            <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-all", enabled ? "translate-x-6" : "translate-x-0")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 bg-white border-none shadow-premium space-y-6">
          <h3 className="font-black text-lg flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            Configurações do Cérebro
          </h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Personalidade da IA</label>
              <select className="input text-sm">
                <option>Atendente Amigável</option>
                <option>Formal e Eficiente</option>
                <option>Vendedor Persuasivo</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Instruções Customizadas</label>
              <textarea 
                className="input min-h-[120px] text-sm resize-none" 
                placeholder="Ex: Ofereça sempre uma bebida se o cliente pedir um hambúrguer..."
              />
            </div>
            <button className="btn-primary w-full py-4 text-sm font-black rounded-2xl">Salvar Cérebro</button>
          </div>
        </div>

        <div className="card p-8 bg-black text-white border-none shadow-premium flex flex-col h-full">
          <h3 className="font-black text-lg flex items-center gap-2 mb-6 text-primary">
            <MessageSquare size={20} />
            Simulador de Chat
          </h3>
          <div className="flex-1 bg-white/5 rounded-2xl p-4 overflow-y-auto space-y-4 mb-4">
            <div className="flex flex-col gap-2">
              <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none max-w-[80%]">
                <p className="text-xs font-medium">Olá! Eu sou o assistente de IA do {restaurant?.name}. Como posso te ajudar hoje?</p>
              </div>
              <div className="bg-primary p-3 rounded-2xl rounded-br-none max-w-[80%] self-end">
                <p className="text-xs font-medium">Quero ver o cardápio!</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 bg-white/10 border-none rounded-xl px-4 py-3 text-xs focus:ring-1 ring-primary" placeholder="Digite para testar..." />
            <button className="p-3 bg-primary rounded-xl"><Plus size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsView = ({ products, onAdd, onViewOnline, onDelete }: { products: Product[], onAdd: () => void, onViewOnline: () => void, onDelete: (id: number) => void }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Cardápio</h2>
      <div className="flex gap-2">
        <button onClick={onViewOnline} className="btn-secondary flex items-center gap-2">
          <Eye size={18} /> Ver Online
        </button>
        <button onClick={onAdd} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Produto
        </button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id} className="card flex gap-4 relative group">
          <button
            onClick={() => onDelete(p.id)}
            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
          >
            <Trash2 size={14} />
          </button>
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Utensils size={24} />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold">{p.name}</h3>
            <p className="text-sm text-text-muted line-clamp-1">{p.description}</p>
            <p className="font-bold text-primary mt-1">{formatCurrency(p.price)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const OrdersView = ({ orders, onUpdateStatus, onViewOrder, onDeleteOrder }: { orders: Order[], onUpdateStatus: (id: number, status: string) => void, onViewOrder: (order: Order) => void, onDeleteOrder: (id: number) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Pedidos</h2>
    <div className="space-y-3">
      {orders.map(o => (
        <div key={o.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 transition-colors cursor-pointer group relative" onClick={() => onViewOrder(o)}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteOrder(o.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
            title="Excluir Pedido"
          >
            <Trash2 size={14} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">#{o.id}</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", ORDER_STATUS_COLORS[o.status])}>
                {ORDER_STATUS_LABELS[o.status]}
              </span>
            </div>
            <p className="text-sm text-text-muted">{o.customer_name} • {formatDate(o.created_at)}</p>
            <p className="text-sm font-medium mt-1">{o.customer_address}</p>
          </div>
          <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-lg mr-4">{formatCurrency(o.total)}</p>
            <select
              value={o.status}
              onChange={(e) => onUpdateStatus(o.id, e.target.value)}
              className="bg-secondary border-none rounded-lg px-3 py-1.5 text-sm focus:ring-2 ring-primary/20"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button onClick={() => onViewOrder(o)} className="btn-secondary px-3 py-1.5 text-sm">
              Detalhes
            </button>
          </div>
        </div>
      ))}
      {orders.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-text-muted">Nenhum pedido encontrado</p>
        </div>
      )}
    </div>
  </div>
);

const CustomersView = ({ customers, onImport, onDelete, token }: { customers: Customer[], onImport: (data: any[]) => void, onDelete: (id: number) => void, token: string | null }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validatedData = results.data.map((row: any) => ({
          name: row.name || row.Nome || '',
          phone: row.phone || row.Telefone || '',
          address: row.address || row.Endereco || row.Endereço || '',
          whatsapp: row.whatsapp || row.WhatsApp || ''
        })).filter((c: any) => c.name && c.phone);

        if (validatedData.length > 0) {
          onImport(validatedData);
        } else {
          alert('Nenhum dado válido encontrado na planilha. Verifique se as colunas são: name, phone, address, whatsapp.');
        }
        setImporting(false);
      },
      error: (error) => {
        console.error('Erro no parsing do CSV:', error);
        alert('Erro ao ler o arquivo.');
        setImporting(false);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Clientes</h2>
        <div className="flex gap-2">
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Plus size={18} /> {importing ? 'Importando...' : 'Importar Planilha (CSV)'}
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
          </label>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold uppercase text-text-muted border-b border-gray-100">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Endereço</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-sm">{c.phone}</td>
                  <td className="px-4 py-3 text-sm">{c.whatsapp || '-'}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{c.address}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(c.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-text-muted">Nenhum cliente cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProductionView = ({ orders, onUpdateStatus, onViewOrder, couriers, token }: { orders: Order[], onUpdateStatus: (id: number, status: string) => void, onViewOrder: (order: Order) => void, couriers: Courier[], token: string | null }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const stages = [
    { id: 'pending', label: 'Pendentes', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', activeBg: 'bg-orange-600' },
    { id: 'preparing', label: 'Em Preparo', icon: Utensils, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', activeBg: 'bg-blue-600' },
    { id: 'ready', label: 'Para Entrega', icon: Truck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', activeBg: 'bg-green-600' },
    { id: 'completed', label: 'Concluídos', icon: CheckCircle2, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-100', activeBg: 'bg-gray-600' },
  ];

  const filteredOrders = orders.filter(o =>
    o.status === activeTab &&
    (o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.toString().includes(searchQuery))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Painel de Produção</h2>
          <p className="text-text-muted mt-1 font-medium">Gerencie o fluxo de pedidos em tempo real</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente ou Nº..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium placeholder:text-text-muted/40 shadow-sm"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-[2rem] overflow-x-auto no-scrollbar">
        {stages.map(stage => (
          <button
            key={stage.id}
            onClick={() => setActiveTab(stage.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-3.5 rounded-[1.5rem] font-black text-sm transition-all whitespace-nowrap",
              activeTab === stage.id
                ? `${stage.activeBg} text-white shadow-lg`
                : "bg-transparent text-text-muted hover:bg-white hover:shadow-sm"
            )}
          >
            <stage.icon size={18} />
            {stage.label}
            <span className={cn(
              "ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black",
              activeTab === stage.id ? "bg-white/20 text-white" : "bg-gray-200 text-text-muted"
            )}>
              {orders.filter(o => o.status === stage.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? filteredOrders.map(order => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={order.id}
              className="card p-0 overflow-hidden border-none shadow-premium hover:ring-2 ring-primary/20 bg-white group"
              onClick={() => onViewOrder(order)}
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    stages.find(s => s.id === order.status)?.bg,
                    stages.find(s => s.id === order.status)?.color,
                    stages.find(s => s.id === order.status)?.border
                  )}>
                    {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                  </div>
                  <span className="text-[10px] font-bold text-text-muted">{formatDate(order.created_at)}</span>
                </div>

                <div>
                  <h4 className="text-xl font-black text-text-main flex items-center gap-2">
                    #{order.id}
                    <span className="text-sm font-medium text-text-muted">— mesa {Math.floor(Math.random() * 20) + 1}</span>
                  </h4>
                  <p className="text-sm font-bold text-text-main mt-1 line-clamp-1">{order.customer_name}</p>
                </div>

                <div className="space-y-2 py-2 border-y border-gray-50">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Itens do Pedido</p>
                  <div className="space-y-1">
                    {order.items?.slice(0, 3).map((item: any, i: number) => (
                      <p key={i} className="text-xs font-bold text-text-main flex gap-2">
                        <span className="text-primary">{item.quantity}x</span>
                        <span className="line-clamp-1">{item.product_name}</span>
                      </p>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-xs text-primary font-bold">+{order.items.length - 3} outros itens</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total</span>
                    <span className="text-lg font-black text-primary">{formatCurrency(order.total)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewOrder(order); }}
                      className="p-3 bg-gray-50 text-text-muted rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'preparing'); }}
                        className="bg-orange-600 text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg shadow-orange-200 hover:bg-orange-700 active:scale-95 transition-all"
                      >
                        CONFIRMAR
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'ready'); }}
                        className="bg-blue-600 text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
                      >
                        PRONTO
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'delivering'); }}
                        className="bg-green-600 text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 transition-all"
                      >
                        ENVIAR
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'completed'); }}
                        className="bg-primary text-white px-5 py-3 rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
                      >
                        CONCLUIR
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black">Nenhum pedido aqui</h3>
                <p className="text-text-muted">Aguardando novos pedidos entrarem na fila.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TrackingView = ({ onBack, initialOrder }: { onBack: () => void, initialOrder: Order | null }) => {
  const [orderId, setOrderId] = useState(initialOrder?.id.toString() || '');
  const [order, setOrder] = useState<any>(initialOrder);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/public/orders/${orderId}`);
      if (res.ok) {
        setOrder(await res.json());
      } else {
        setError('Pedido não encontrado');
      }
    } catch (err) {
      setError('Erro ao buscar pedido');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { status: 'pending', label: 'Aguardando', timeKey: 'created_at', icon: Check, color: 'bg-primary' },
    { status: 'preparing', label: 'Preparando', timeKey: 'updated_at', icon: Utensils, color: 'bg-[#FF9E80]' },
    { status: 'ready', label: 'Saiu para Entrega', timeKey: 'updated_at', icon: Bike, color: 'bg-primary' },
    { status: 'delivering', label: 'Chegando', timeKey: 'updated_at', icon: MapPin, color: 'bg-gray-200' },
    { status: 'completed', label: 'Entregue', timeKey: 'updated_at', icon: Check, color: 'bg-gray-100' },
  ];

  const currentStepIndex = order ? steps.findIndex(s => s.status === order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      {/* Header */}
      <header className="bg-white px-6 py-6 flex items-center justify-between border-b border-gray-50 sticky top-0 z-50">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-main flex-1 text-center pr-8">Acompanhe seu Pedido</h1>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {!order ? (
          <div className="card p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-primary-soft text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black">Rastrear Pedido</h2>
              <p className="text-text-muted">Informe o número do pedido impresso no seu canhoto ou no WhatsApp.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Nº do Pedido (ex: 123)"
                className="input text-center text-lg font-bold"
              />
            </div>
            <button onClick={handleTrack} disabled={loading} className="btn-primary w-full py-5 text-lg">
              {loading ? 'Buscando...' : 'Localizar Pedido'}
            </button>
            {error && <p className="text-error font-bold">{error}</p>}
          </div>
        ) : (
          <>
            {/* Map Placeholder Card */}
            <div className="card overflow-hidden p-0 border-none shadow-premium bg-white">
              <div className="h-64 relative bg-[#E3EAFA]">
                {/* Fake Map Content */}
                <div className="absolute inset-0 opacity-40 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-23.5505,-46.6333&zoom=14&size=600x400&sensor=false')] bg-cover grayscale" />

                {/* Float Courier Info */}
                <div className="absolute top-4 left-4 right-4 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="glass px-4 py-3 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                      <Bike size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Entregador</p>
                      <p className="text-sm font-bold text-text-main">Equipe {order.restaurant_name} está a caminho</p>
                    </div>
                  </div>
                </div>

                {/* Pin points */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                    <div className="w-6 h-6 bg-primary border-2 border-white rounded-full shadow-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Arrival */}
            <div className="card bg-primary-soft border-none p-8 text-center space-y-4">
              <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Chegada Estimada</p>
              <h2 className="text-6xl font-black text-primary tracking-tighter">
                {new Date(new Date(order.created_at).getTime() + 45 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </h2>
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-[11px] font-bold uppercase text-primary">
                  <span>{ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}</span>
                  <span>{order.status === 'completed' ? '100' : (currentStepIndex + 1) * 20}%</span>
                </div>
                <div className="h-4 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStepIndex + 1) * 20}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>

            {/* Status Stepper */}
            <div className="card space-y-8 p-8">
              <h3 className="text-lg font-black tracking-tight">Status do Pedido</h3>
              <div className="space-y-0 relative ml-4">
                {/* Vertical Line */}
                <div className="absolute left-[3px] top-6 bottom-6 w-[2px] bg-gray-100" />

                {steps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;

                  return (
                    <div key={idx} className="relative pl-10 pb-10 last:pb-0">
                      {/* Circle Indicator */}
                      <div className={cn(
                        "absolute left-[-16px] top-0 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-all duration-500",
                        isActive ? "bg-primary text-white scale-110" : "bg-gray-100 text-gray-300"
                      )}>
                        <step.icon size={16} strokeWidth={isActive ? 3 : 2} />
                      </div>

                      {/* Content */}
                      <div className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-40")}>
                        <p className={cn("text-base font-black tracking-tight", isCurrent ? "text-primary mt-1" : "text-text-main")}>
                          {step.label}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {isActive ? formatDate(order.updated_at) : 'Aguardando...'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Resume Card */}
            <div className="card p-8 space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <h3 className="text-lg font-black tracking-tight">Resumo do Pedido</h3>
              </div>

              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <p className="font-bold text-text-main">
                      <span className="text-text-muted font-medium mr-2">{item.quantity}x</span>
                      {item.product_name}
                    </p>
                    <span className="font-bold text-text-main">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 space-y-3 border-t border-gray-50">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-text-muted">Taxa de entrega</span>
                  <span className="font-black text-primary">Grátis</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black text-text-main">Total</span>
                  <span className="text-2xl font-black text-primary tracking-tighter">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <button onClick={() => setOrder(null)} className="w-full text-text-muted font-bold text-sm py-4 hover:text-primary transition-colors">
              Rastrear outro pedido
            </button>
          </>
        )}
      </div>

      {/* Bottom Navigation (Image 1 style) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-50 h-[80px] px-6 flex items-center justify-around z-50">
        <button onClick={onBack} className="flex flex-col items-center gap-1 text-text-muted opacity-40">
          <Home size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Início</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <FileText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Pedidos</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted opacity-40">
          <Search size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Explorar</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-text-muted opacity-40">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </nav>
    </div>
  );
};

const CounterOrderView = ({ products, customers, promotions, onOrderCreated, token }: { products: Product[], customers: Customer[], promotions: Promotion[], onOrderCreated: () => void, token: string | null }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [counterCart, setCounterCart] = useState<{ product: Product, quantity: number, selectedOptions: ProductOption[] }[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleAddProduct = (p: Product) => {
    const existing = counterCart.find(item => item.product.id === p.id);
    if (existing) {
      setCounterCart(prev => prev.map(item =>
        item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCounterCart(prev => [...prev, { product: p, quantity: 1, selectedOptions: [] }]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setCounterCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCounterCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;
    const customerData = {
      name: form.name.value,
      address: form.address.value,
      phone: form.phone.value,
      whatsapp: form.whatsapp.value
    };

    try {
      const res = await fetch('/api/restaurant/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(customerData)
      });
      if (res.ok) {
        const newCustomer = await res.json();
        setSelectedCustomer(newCustomer);
        setShowCustomerForm(false);
        onOrderCreated(); // Refresh customers list
      }
    } catch (err) {
      console.error('Erro ao criar cliente', err);
    }
  };

  const handleFinalizeOrder = async () => {
    if (!selectedCustomer || counterCart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/orders/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          customer_phone: selectedCustomer.phone,
          customer_address: selectedCustomer.address,
          items: counterCart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
            selectedOptions: item.selectedOptions
          }))
        })
      });
      if (res.ok) {
        setCounterCart([]);
        setSelectedCustomer(null);
        onOrderCreated();
        alert('Pedido realizado com sucesso! Pagamento gerado.');
      }
    } catch (err) {
      console.error('Erro ao finalizar pedido', err);
    } finally {
      setLoading(false);
    }
  };

  const total = counterCart.reduce((acc, item) => {
    const itemPrice = item.product.price + item.selectedOptions.reduce((a, o) => a + o.price, 0);
    return acc + (itemPrice * item.quantity);
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="card space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Users size={20} className="text-primary" />
              Cliente
            </h3>
            {!selectedCustomer && (
              <button
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="text-primary text-sm font-bold flex items-center gap-1"
              >
                {showCustomerForm ? 'Cancelar' : <><UserPlus size={16} /> Novo Cliente</>}
              </button>
            )}
          </div>

          {showCustomerForm ? (
            <form onSubmit={handleCreateCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <input name="name" required className="input" placeholder="Nome do Cliente" />
              <input name="phone" required className="input" placeholder="Telefone" />
              <input name="whatsapp" className="input" placeholder="WhatsApp (opcional)" />
              <input name="address" required className="input" placeholder="Endereço Completo" />
              <button type="submit" className="btn-primary md:col-span-2">Cadastrar e Selecionar</button>
            </form>
          ) : selectedCustomer ? (
            <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
              <div>
                <p className="font-bold text-lg">{selectedCustomer.name}</p>
                <p className="text-sm text-text-muted">{selectedCustomer.phone} • {selectedCustomer.address}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-red-500 text-sm font-bold">Trocar</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar por nome ou telefone..."
                  className="input pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery && (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-2">
                  {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold">{c.name}</p>
                        <p className="text-xs text-text-muted">{c.phone}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400" />
                    </button>
                  )) : (
                    <p className="text-center py-4 text-text-muted text-sm">Nenhum cliente encontrado</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Utensils size={20} className="text-primary" />
            Produtos
          </h3>

          {/* Active Promotions in Counter */}
          {promotions && promotions.length > 0 && (
            <div className="space-y-2 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1"><Star size={12} /> Promoções Ativas</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {promotions.filter(p => p.active).map(promo => (
                  <div key={promo.id} className="flex-shrink-0 w-52 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-3 space-y-1">
                    {promo.image_url && (
                      <div className="h-20 rounded-xl overflow-hidden mb-2">
                        <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <p className="font-black text-sm text-text-main leading-tight">{promo.title}</p>
                    <span className="inline-block bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{promo.discount_text}</span>
                    {promo.valid_until && (
                      <p className="text-[10px] text-text-muted flex items-center gap-0.5"><Clock size={10} /> Até {new Date(promo.valid_until).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => handleAddProduct(p)}
                className="flex items-center gap-3 p-3 border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Utensils size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-text-muted">{formatCurrency(p.price)}</p>
                </div>
                <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card sticky top-6 flex flex-col h-fit max-h-[calc(100vh-120px)]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary" />
            Resumo do Pedido
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {counterCart.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <ShoppingBag size={24} />
                </div>
                <p className="text-text-muted text-sm">Seu carrinho está vazio</p>
              </div>
            ) : (
              counterCart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.product.name}</p>
                    <p className="text-xs text-text-muted">{formatCurrency(item.product.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => handleUpdateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white border rounded-md text-xs hover:bg-gray-100">-</button>
                      <span className="text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white border rounded-md text-xs hover:bg-gray-100">+</button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">{formatCurrency(item.product.price * item.quantity)}</p>
                    <button onClick={() => handleRemoveProduct(item.product.id)} className="text-red-500 text-[10px] font-bold mt-2">Remover</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-medium">Total</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
            </div>

            <button
              onClick={handleFinalizeOrder}
              disabled={loading || !selectedCustomer || counterCart.length === 0}
              className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              {loading ? 'Processando...' : 'Finalizar e Pagar'}
            </button>

            {!selectedCustomer && counterCart.length > 0 && (
              <p className="text-[10px] text-center text-red-500 font-bold uppercase">Selecione um cliente para finalizar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const SettingsView = ({ 
  restaurant, 
  onUpdate, 
  token, 
  setError, 
  setSuccess,
  setAdminTab
}: { 
  restaurant: Restaurant | null, 
  onUpdate: () => void, 
  token: string | null, 
  setError: (v: string | null) => void, 
  setSuccess: (v: string | null) => void,
  setAdminTab: (tab: any) => void
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target as any;

    let logo_url = form.logo_url.value;
    const fileInput = form.logo_file;
    if (fileInput.files.length > 0) {
      logo_url = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(fileInput.files[0]);
      });
    }

    const data = {
      name: form.name.value,
      slogan: form.slogan.value,
      phone: form.phone.value,
      address: form.address.value,
      logo_url,
      mercadopago_token: form.mercadopago_token.value,
      pagseguro_token: form.pagseguro_token.value,
      google_tag_id: form.google_tag_id?.value || '',
      fb_pixel_id: form.fb_pixel_id?.value || '',
      tiktok_pixel_id: form.tiktok_pixel_id?.value || '',
      primary_color: form.primary_color?.value || '#FF4C29',
      secondary_color: form.secondary_color?.value || '#FDFDFD',
    };

    try {
      const res = await fetch('/api/restaurant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        setSuccess('Configurações atualizadas com sucesso!');
        onUpdate();
      } else {
        setError('Erro ao atualizar configurações');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configurações do Restaurante</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Perfil da Empresa
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Nome do Restaurante</label>
              <input name="name" defaultValue={restaurant?.name} className="input" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Slogan / Descrição Curta</label>
              <input name="slogan" defaultValue={restaurant?.slogan || ''} className="input" placeholder="Ex: Sabor incomparável a cada mordida" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Telefone</label>
              <input name="phone" defaultValue={restaurant?.phone || ''} className="input" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Endereço</label>
              <input name="address" defaultValue={restaurant?.address || ''} className="input" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-text-muted">Logo do Restaurante</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border flex-shrink-0">
                {restaurant?.logo_url ? (
                  <img src={restaurant.logo_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Utensils size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input name="logo_url" defaultValue={restaurant?.logo_url || ''} className="input text-sm" placeholder="URL da Logo (ou use upload abaixo)" />
                <input name="logo_file" type="file" accept="image/*" className="text-xs block w-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <CreditCard size={20} className="text-primary" />
            Pagamento Online
          </h3>
          <p className="text-sm text-text-muted">Configure suas credenciais para aceitar pagamentos diretamente pelo cardápio.</p>
          <div className="space-y-4">
            <div className="space-y-2 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-2048.png" className="h-6" alt="Mercado Pago" />
                <span className="font-bold">Mercado Pago</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Access Token</label>
                <input name="mercadopago_token" defaultValue={restaurant?.mercadopago_token || ''} className="input bg-white" placeholder="APP_USR-..." type="password" />
              </div>
            </div>

            <div className="space-y-2 p-4 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <img src="https://logospng.org/download/pagseguro/logo-pagseguro-4096.png" className="h-6" alt="PagSeguro" />
                <span className="font-bold">PagSeguro</span>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-text-muted">Token / Email</label>
                <input name="pagseguro_token" defaultValue={restaurant?.pagseguro_token || ''} className="input bg-white" placeholder="Seu Token PagSeguro" type="password" />
              </div>
            </div>
          </div>
        </div>
        <div className={cn("card space-y-4 relative overflow-hidden", !restaurant?.plan?.features?.marketing_tags && "opacity-75 grayscale-[0.5]")}>
          {!restaurant?.plan?.features?.marketing_tags && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-xs">
                <Shield size={32} className="text-primary mx-auto mb-2" />
                <h4 className="font-bold text-sm">Funcionalidade Premium</h4>
                <p className="text-xs text-text-muted mb-3">O rastreamento de marketing está disponível apenas nos planos Profissional e Premium.</p>
                <button type="button" onClick={() => setAdminTab('dashboard')} className="text-xs font-bold text-primary hover:underline">Fazer Upgrade Agora</button>
              </div>
            </div>
          )}
          <h3 className="font-bold text-lg flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Marketing & Rastreamento
          </h3>
          <p className="text-sm text-text-muted">Adicione tags para medir o desempenho do seu cardápio.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Google Analytics (G-...) </label>
              <input name="google_tag_id" defaultValue={restaurant?.google_tag_id || ''} className="input" placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Facebook Pixel ID</label>
              <input name="fb_pixel_id" defaultValue={restaurant?.fb_pixel_id || ''} className="input" placeholder="123456789012345" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">TikTok Pixel ID</label>
              <input name="tiktok_pixel_id" defaultValue={restaurant?.tiktok_pixel_id || ''} className="input" placeholder="CVO..." />
            </div>
          </div>
        </div>

        <div className={cn("card space-y-4 relative overflow-hidden", !restaurant?.plan?.features?.custom_colors && "opacity-75 grayscale-[0.5]")}>
          {!restaurant?.plan?.features?.custom_colors && (
            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-6 text-center">
              <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-xs">
                <Shield size={32} className="text-primary mx-auto mb-2" />
                <h4 className="font-bold text-sm">Funcionalidade Premium</h4>
                <p className="text-xs text-text-muted mb-3">A personalização de cores está disponível apenas nos planos Profissional e Premium.</p>
                <button type="button" onClick={() => setAdminTab('dashboard')} className="text-xs font-bold text-primary hover:underline">Fazer Upgrade Agora</button>
              </div>
            </div>
          )}
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            Identidade Visual
          </h3>
          <p className="text-sm text-text-muted">Personalize as cores do seu cardápio online.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Cor Principal (Primária)</label>
              <div className="flex gap-2">
                <input type="color" name="primary_color" defaultValue={restaurant?.primary_color || '#FF4C29'} className="w-12 h-12 rounded-lg cursor-pointer p-1" />
                <input defaultValue={restaurant?.primary_color || '#FF4C29'} className="input flex-1" readOnly />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Cor de Fundo (Páginas)</label>
              <div className="flex gap-2">
                <input type="color" name="secondary_color" defaultValue={restaurant?.secondary_color || '#FDFDFD'} className="w-12 h-12 rounded-lg cursor-pointer p-1" />
                <input defaultValue={restaurant?.secondary_color || '#FDFDFD'} className="input flex-1" readOnly />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
};

// --- Main App ---

const PromotionsView = ({ promotions, onAdd, onEdit, onDelete, onToggle }: { promotions: Promotion[], onAdd: () => void, onEdit: (p: Promotion) => void, onDelete: (id: number) => void, onToggle: (p: Promotion) => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Gestão de Promoções</h2>
          <p className="text-text-muted mt-1 font-medium">Crie campanhas e cupons para atrair mais clientes</p>
        </div>
        <button onClick={onAdd} className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
          <Plus size={18} />
          Nova Promoção
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Promoções Ativas', value: promotions.filter(p => p.active).length, icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary-soft' },
          { label: 'Desativadas', value: promotions.filter(p => !p.active).length, icon: X, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Total de Campanhas', value: promotions.length, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="card p-6 flex items-center gap-6 border-none shadow-premium bg-white">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-2xl font-black text-text-main mt-1">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promo => (
          <div key={promo.id} className="card p-0 overflow-hidden border-none shadow-premium bg-white group hover:ring-2 ring-primary/20 transition-all">
            <div className="h-40 relative overflow-hidden">
              {promo.image_url ? (
                <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                  <Star size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider shadow-lg">
                  {promo.discount_text}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => onToggle(promo)}
                    className={cn(
                      "w-10 h-6 rounded-full relative transition-colors cursor-pointer",
                      promo.active ? "bg-primary" : "bg-gray-300"
                    )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      promo.active ? "left-5" : "left-1"
                    )} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h4 className="text-lg font-black text-text-main leading-tight">{promo.title}</h4>
              <p className="text-xs text-text-muted mt-2 font-medium flex items-center gap-2">
                <Clock size={12} />
                {promo.valid_until ? `Válido até ${new Date(promo.valid_until).toLocaleDateString()}` : 'Sem expiração'}
              </p>
              <div className="mt-6 flex gap-2">
                <button onClick={() => onEdit(promo)} className="flex-1 py-2.5 bg-gray-50 text-text-main text-[10px] font-black rounded-xl hover:bg-gray-100 uppercase tracking-widest">Editar</button>
                <button onClick={() => onDelete(promo.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
// --- Plan Modal ---
const PlanModal = ({ 
  plan, 
  onClose, 
  onSave 
}: { 
  plan: Plan | null, 
  onClose: () => void, 
  onSave: (data: Partial<Plan>) => void 
}) => {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    price: plan?.price || 0,
    max_products: plan?.max_products || 0,
    features: plan?.features ? { ...plan.features } : {
      marketing_tags: false,
      custom_colors: false,
      online_payment: false,
      ai_assistant: false,
      advanced_reports: false,
      promotions: false,
      couriers_management: false,
      custom_domain: false,
      multi_user: false
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-text-main">
            {plan ? `Editar Plano: ${plan.name}` : 'Criar Novo Plano'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-text-muted tracking-widest">Nome do Plano</label>
              <input 
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input" 
                required 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-text-muted tracking-widest">Preço Mensal</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="input" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-text-muted tracking-widest">Limite de Produtos</label>
                <input 
                  type="number"
                  value={formData.max_products}
                  onChange={e => setFormData(prev => ({ ...prev, max_products: parseInt(e.target.value) }))}
                  className="input" 
                  required 
                />
                <p className="text-[10px] text-text-muted italic">* 0 para ilimitado</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-text-muted tracking-widest">Funcionalidades</label>
              
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.marketing_tags}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, marketing_tags: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Marketing Tags</p>
                  <p className="text-[10px] text-text-muted">Pixels de FB, Google e TikTok</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.custom_colors}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, custom_colors: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Cores Customizadas</p>
                  <p className="text-[10px] text-text-muted">Personalização visual do menu</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.online_payment}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, online_payment: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Pagamento Online</p>
                  <p className="text-[10px] text-text-muted">Mercado Pago e PagSeguro</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.ai_assistant}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, ai_assistant: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Assistente de IA</p>
                  <p className="text-[10px] text-text-muted">Chatbot Gemini para pedidos</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.advanced_reports}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, advanced_reports: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Relatórios Avançados</p>
                  <p className="text-[10px] text-text-muted">Análise de dados e vendas</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.promotions}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, promotions: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Banners & Promoções</p>
                  <p className="text-[10px] text-text-muted">Gestão de ofertas especiais</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.couriers_management}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, couriers_management: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Gestão de Entregadores</p>
                  <p className="text-[10px] text-text-muted">Controle de entregas e motoboys</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.custom_domain}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, custom_domain: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Domínio Customizado</p>
                  <p className="text-[10px] text-text-muted">Use seu próprio link (ex: delivery.seusite.com)</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="checkbox"
                  checked={formData.features.multi_user}
                  onChange={e => setFormData(prev => ({ 
                    ...prev, 
                    features: { ...prev.features, multi_user: e.target.checked } 
                  }))}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-bold">Múltiplos Usuários</p>
                  <p className="text-[10px] text-text-muted">Acesso para gerente, caixa e atendente</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Salvar Alterações</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Super Admin View ---
const SuperAdminView = ({ 
  restaurants, 
  stats, 
  plans,
  onToggleStatus, 
  onLogout,
  onUpdatePlan,
  onUpdatePlanDetails,
  onCreatePlan
}: { 
  restaurants: Restaurant[], 
  stats: any, 
  plans: Plan[],
  onToggleStatus: (id: number, active: boolean) => void,
  onLogout: () => void,
  onUpdatePlan: (restaurantId: number, planId: number) => void,
  onUpdatePlanDetails: (planId: number, data: Partial<Plan>) => void,
  onCreatePlan: (data: Partial<Plan>) => void
}) => {
  const [activeTab, setActiveTab] = useState<'workspaces' | 'plans' | 'settings'>('workspaces');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showCreatePlan, setShowCreatePlan] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <LayoutDashboard size={20} />
          </div>
          <span className="font-black text-xl tracking-tighter">Super<span className="text-primary italic">Admin</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={Users} label="Workspaces" active={activeTab === 'workspaces'} onClick={() => setActiveTab('workspaces')} />
          <SidebarItem icon={BarChart3} label="Planos SaaS" active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
          <SidebarItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <button onClick={onLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-all w-full">
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-text-main">Gestão Global</h1>
              <p className="text-text-muted mt-1 font-medium">Controle todos os workspaces e inquilinos da plataforma</p>
            </div>
          </div>

          {activeTab === 'workspaces' && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 bg-primary-soft text-primary rounded-2xl flex items-center justify-center">
                    <LayoutDashboard size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Workspaces</p>
                    <h4 className="text-2xl font-black text-text-main mt-1">{stats?.totalRestaurants || 0}</h4>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Pedidos Globais</p>
                    <h4 className="text-2xl font-black text-text-main mt-1">{stats?.totalOrders || 0}</h4>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Faturamento</p>
                    <h4 className="text-2xl font-black text-text-main mt-1">{formatCurrency(stats?.totalRevenue || 0)}</h4>
                  </div>
                </div>
              </div>

              {/* Workspace List */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-black text-text-main">Lista de Workspaces</h3>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -track-y-1/2 text-text-muted" />
                    <input placeholder="Buscar workspace..." className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 ring-primary/20" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">
                        <th className="px-6 py-4">Workspace</th>
                        <th className="px-6 py-4">Plano Atual</th>
                        <th className="px-6 py-4">Criado em</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {restaurants.map(res => (
                        <tr key={res.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-primary font-black uppercase">
                                {res.name.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-text-main">{res.name}</p>
                                <p className="text-xs text-text-muted italic">/{res.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              defaultValue={res.plan_id} 
                              onChange={(e) => onUpdatePlan(res.id, parseInt(e.target.value))}
                              className="text-xs font-bold p-2 bg-secondary rounded-lg border-none focus:ring-1 ring-primary/30"
                            >
                              <option value="">Sem Plano</option>
                              {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.max_products} prod.)</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-text-muted">{res.created_at ? new Date(res.created_at).toLocaleDateString() : '-'}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm",
                              res.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {res.is_active ? 'Ativo' : 'Suspenso'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => onToggleStatus(res.id, !res.is_active)}
                              className={cn(
                                "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all",
                                res.is_active ? "text-red-500 border-red-100 hover:bg-neutral-50" : "text-green-600 border-green-100 hover:bg-neutral-50"
                              )}
                            >
                              {res.is_active ? 'Suspender' : 'Ativar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'plans' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-text-main">Configuração de Planos SaaS</h3>
                <button 
                  onClick={() => setShowCreatePlan(true)}
                  className="px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={20} />
                  Novo Plano
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length > 0 ? (
                  plans.map(plan => (
                    <div key={plan.id} className="card p-6 border-none shadow-premium bg-gray-50 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xl font-black text-primary">{plan.name}</h4>
                        <button 
                          onClick={() => setEditingPlan(plan)}
                          className="p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-text-muted hover:text-primary transition-colors"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                      <p className="text-2xl font-black">{formatCurrency(plan.price)}/mês</p>
                      <ul className="space-y-2 flex-1">
                        <li className="text-sm font-bold flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          Até {plan.max_products === 0 ? 'ilimitados' : plan.max_products} produtos
                        </li>
                        <li className="text-sm font-bold flex items-center gap-2">
                          {plan.features?.marketing_tags ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                          Pixels (FB, Google, TikTok)
                        </li>
                        <li className="text-sm font-bold flex items-center gap-2">
                          {plan.features?.custom_colors ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                          Cores Customizadas
                        </li>
                        <li className="text-sm font-bold flex items-center gap-2">
                          {plan.features?.ai_assistant ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                          Assistente de IA
                        </li>
                        <li className="text-sm font-bold flex items-center gap-2">
                          {plan.features?.promotions ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                          Promoções
                        </li>
                        <li className="text-sm font-bold flex items-center gap-2">
                          {plan.features?.couriers_management ? <CheckCircle2 size={16} className="text-green-500" /> : <X size={16} className="text-red-400" />}
                          Entregadores
                        </li>
                      </ul>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-text-muted font-bold">Nenhum plano encontrado no sistema.</p>
                  </div>
                )}
              </div>

              {editingPlan && (
                <PlanModal 
                  plan={editingPlan}
                  onClose={() => setEditingPlan(null)}
                  onSave={(data) => {
                    onUpdatePlanDetails(editingPlan.id, data);
                    setEditingPlan(null);
                  }}
                />
              )}

              {showCreatePlan && (
                <PlanModal 
                  plan={null}
                  onClose={() => setShowCreatePlan(false)}
                  onSave={(data) => {
                    onCreatePlan(data);
                    setShowCreatePlan(false);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-8">
              <h3 className="text-2xl font-black text-text-main mb-6">Configurações Globais da Plataforma</h3>
              <p className="text-text-muted font-medium mb-8">Gerencie limites padrão e integrações nativas para todos os inquilinos.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2"><Globe size={18} className="text-primary"/> Domínio & SEO</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-text-muted">Domínio Base</label>
                    <input className="input" defaultValue="https://deliverypro.com.br" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2"><Shield size={18} className="text-primary"/> Segurança SaaS</h4>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-text-muted">Limite Padrão de Produtos (Free)</label>
                    <input className="input" type="number" defaultValue="20" />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'admin' | 'superadmin' | 'public' | 'tracking'>('landing');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [restaurant, setRestaurant] = useState<Restaurant | null>(() => {
    const saved = localStorage.getItem('restaurant');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'products' | 'couriers' | 'customers' | 'production' | 'counter' | 'settings' | 'promotions' | 'ai'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [publicData, setPublicData] = useState<any>(null);
  const [dailyOfferProduct, setDailyOfferProduct] = useState<Product | null>(null);
  const [showDailyOffer, setShowDailyOffer] = useState(false);
  const [cart, setCart] = useState<{ product: Product, quantity: number, selectedOptions?: ProductOption[] }[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [publicTab, setPublicTab] = useState<'menu' | 'pedidos' | 'favoritos' | 'perfil'>('menu');
  const [adminRestaurants, setAdminRestaurants] = useState<Restaurant[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      // Always fetch restaurant data first to ensure role is up to date
      const meRes = await fetch('/api/restaurant/me', { headers: { 'Authorization': `Bearer ${token}` } });
      if (meRes.ok) {
        const meData = await meRes.json();
        const freshRole = meData.role?.trim().toLowerCase();
        const isPlatform = !!meData.isPlatform || freshRole === 'superadmin';
        
        // Update both local and storage state
        const updatedProfile = { ...meData, role: freshRole, isPlatform };
        setRestaurant(updatedProfile);
        localStorage.setItem('restaurant', JSON.stringify(updatedProfile));
        
        console.log('Sync - Fresh Role:', freshRole, 'isPlatform:', isPlatform);
        setIsInitialLoad(false);

        if (isPlatform) {
          setView('superadmin');
          const [rRes, sRes, pRes] = await Promise.all([
            fetch('/api/admin/restaurants', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/admin/plans', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (rRes.ok) {
            const rData = await rRes.json();
            setAdminRestaurants(rData);
          }
          if (sRes.ok) {
            const sData = await sRes.json();
            setAdminStats(sData);
          }
          if (pRes.ok) {
            const pData = await pRes.json();
            setPlans(pData);
          }
          setIsInitialLoad(false);
          return;
        } else {
          // ensure view is admin if not superadmin and we have token
          setView('admin');
        }
      }
      setIsInitialLoad(false); // Ensure splash completion for non-superadmin or if meRes fails
      // The rest of the fetches for regular admin
      const [pRes, oRes, sRes, cRes, catRes, custRes, promRes] = await Promise.all([
        fetch('/api/restaurant/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/reports/summary', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/couriers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/customers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/promotions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (sRes.ok) setSummary(await sRes.json());
      if (cRes.ok) setCouriers(await cRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (promRes.ok) setPromotions(await promRes.json());
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  useEffect(() => {
    if (token) {
      const currentRole = restaurant?.role?.trim().toLowerCase();
      const isPlatform = !!restaurant?.isPlatform || currentRole === 'superadmin';
      
      // If we are on landing/auth pages, redirect based on role
      if (view === 'landing' || view === 'login' || view === 'register') {
        if (isPlatform) {
          setView('superadmin');
        } else {
          setView('admin');
        }
      }
      
      // If we are on the WRONG dashboard, force switch
      if (view === 'admin' && isPlatform) {
        console.warn('Redirecting to SuperAdmin view...');
        setView('superadmin');
      }

      fetchAdminData();
      const interval = setInterval(fetchAdminData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [token]);

  // SaaS Expansion: Marketing Tags & Custom Design
  useEffect(() => {
    if (view === 'public' && publicData?.restaurant) {
      const res = publicData.restaurant;
      
      // Apply Custom Colors
      if (res.primary_color) {
        document.documentElement.style.setProperty('--primary-color', res.primary_color);
      }
      if (res.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', res.secondary_color);
      }

      // Inject Google Analytics
      if (res.google_tag_id) {
        const script1 = document.createElement('script');
        script1.async = true;
        script1.src = `https://www.googletagmanager.com/gtag/js?id=${res.google_tag_id}`;
        document.head.appendChild(script1);

        const script2 = document.createElement('script');
        script2.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${res.google_tag_id}');
        `;
        document.head.appendChild(script2);
      }

      // Inject Facebook Pixel
      if (res.fb_pixel_id) {
        const script = document.createElement('script');
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${res.fb_pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);
      }
    } else {
      // Reset colors when not in public view
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--secondary-color');
    }
  }, [view, publicData]);

  const handleViewOrder = async (order: Order) => {
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data);
      }
    } catch (err) {
      setError('Erro ao carregar detalhes do pedido');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('restaurant');
    setToken(null);
    setRestaurant(null);
    setView('landing');
  };
  const handleViewPublic = async (slug: string) => {
    try {
      const res = await fetch(`/api/public/restaurant/${slug}`);
      if (res.ok) {
        setPublicData(await res.json());
        setView('public');
      } else {
        setError('Restaurante não encontrado');
      }
    } catch (err) {
      setError('Erro ao carregar cardápio');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('restaurant', JSON.stringify(data.restaurant));
        setToken(data.token);
        setRestaurant(data.restaurant);
        if (data.restaurant.role === 'superadmin') {
          setView('superadmin');
        } else {
          setView('admin');
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Falha no login');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const name = (e.target as any).name.value;
    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;
    const slug = (e.target as any).slug.value;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, slug })
      });
      if (res.ok) {
        setSuccess('Conta criada com sucesso! Faça login.');
        setView('login');
      } else {
        const data = await res.json();
        setError(data.error || 'Falha no registro');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;

    // Validation
    const name = form.name.value.trim();
    const priceStr = form.price.value;
    const price = parseFloat(priceStr);
    const description = form.description.value.trim();

    // Plan Limits Validation
    if (restaurant?.plan?.max_products && products.length >= restaurant.plan.max_products) {
      setError(`Seu plano permite apenas ${restaurant.plan.max_products} produtos. Faça o upgrade para adicionar mais!`);
      return;
    }

    if (!name) {
      setError('O nome do produto é obrigatório.');
      return;
    }

    if (!priceStr || isNaN(price) || price <= 0) {
      setError('O preço deve ser um valor válido maior que zero.');
      return;
    }

    if (!description) {
      setError('A descrição do produto é obrigatória.');
      return;
    }

    // Process options
    const options = [];
    const optionInputs = form.querySelectorAll('.option-row');
    for (const input of optionInputs) {
      const optName = input.querySelector('.opt-name').value.trim();
      const optPriceStr = input.querySelector('.opt-price').value;

      if (optName) {
        const optPrice = parseFloat(optPriceStr);
        if (isNaN(optPrice) || optPrice < 0) {
          setError(`O preço da opção "${optName}" é inválido.`);
          return;
        }
        options.push({ name: optName, price: optPrice });
      } else if (optPriceStr) {
        setError('Uma opção com preço deve ter um nome.');
        return;
      }
    }

    // Process Image
    let imageUrl = form.image_url.value;
    const fileInput = form.image_file;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      // Basic image validation
      if (!file.type.startsWith('image/')) {
        setError('O arquivo selecionado não é uma imagem válida.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('A imagem deve ter no máximo 10MB.');
        return;
      }

      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    // Process Category (New or Existing)
    let categoryId = form.category_id.value;
    const newCategoryName = form.new_category?.value?.trim();

    if (categoryId === 'new') {
      if (!newCategoryName) {
        setError('O nome da nova categoria é obrigatório.');
        return;
      }
      const cRes = await fetch('/api/restaurant/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (cRes.ok) {
        const cat = await cRes.json();
        categoryId = cat.id;
        // Update local categories
        setCategories(prev => [...prev, cat]);
      } else {
        setError('Erro ao criar nova categoria.');
        return;
      }
    }

    const productData = {
      name,
      description,
      price,
      image_url: imageUrl,
      category_id: categoryId === 'new' ? null : (categoryId || null),
      is_daily_offer: form.is_daily_offer.checked,
      options
    };

    try {
      const res = await fetch('/api/restaurant/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      if (res.ok) {
        const pRes = await fetch('/api/restaurant/products', { headers: { 'Authorization': `Bearer ${token}` } });
        if (pRes.ok) setProducts(await pRes.json());
        setShowProductModal(false);
        setSuccess('Produto criado com sucesso!');
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar produto');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/restaurant/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        setSuccess('Produto excluído com sucesso!');
      } else {
        setError('Erro ao excluir produto');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleCreateCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;

    // Validation
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const rg = form.rg.value.trim();
    const address = form.address.value.trim();
    const vehicleType = form.vehicle_type.value;
    const vehiclePlate = form.vehicle_plate?.value?.trim();
    const vehicleRenavam = form.vehicle_renavam?.value?.trim();

    if (!name || !phone || !rg || !address) {
      setError('Preencha todos os campos obrigatórios (Nome, Telefone, RG, Endereço).');
      return;
    }

    if ((vehicleType === 'moto' || vehicleType === 'carro') && (!vehiclePlate || !vehicleRenavam)) {
      setError('Para veículos motorizados, Placa e Renavam são obrigatórios.');
      return;
    }

    // Process Photo
    let photoUrl = form.photo_url.value;
    const fileInput = form.photo_file;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        setError('A foto deve ser uma imagem válida.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('A foto deve ter no máximo 10MB.');
        return;
      }
      photoUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const courierData = {
      name,
      phone,
      rg,
      address,
      vehicle_type: vehicleType,
      vehicle_plate: vehiclePlate,
      vehicle_renavam: vehicleRenavam,
      photo_url: photoUrl
    };

    try {
      const res = await fetch('/api/restaurant/couriers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(courierData)
      });

      if (res.ok) {
        const cRes = await fetch('/api/restaurant/couriers', { headers: { 'Authorization': `Bearer ${token}` } });
        if (cRes.ok) setCouriers(await cRes.json());
        setShowCourierModal(false);
        setSuccess('Entregador cadastrado com sucesso!');
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao cadastrar entregador');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleDeleteCourier = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este entregador?')) return;
    try {
      const res = await fetch(`/api/restaurant/couriers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCouriers(prev => prev.filter(c => c.id !== id));
        setSuccess('Entregador excluído com sucesso!');
      } else {
        setError('Erro ao excluir entregador');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleBulkImportCustomers = async (customersData: any[]) => {
    try {
      const res = await fetch('/api/restaurant/customers/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ customers: customersData })
      });
      if (res.ok) {
        setSuccess(`${customersData.length} clientes importados com sucesso!`);
        fetchAdminData();
      } else {
        setError('Erro ao importar clientes');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      const res = await fetch(`/api/restaurant/customers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        setSuccess('Cliente excluído com sucesso!');
      } else {
        setError('Erro ao excluir cliente');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as any;

    // Process image: file upload takes priority over URL
    let imageUrl = form.image_url.value;
    const fileInput = form.image_file;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        setError('O arquivo deve ser uma imagem válida.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 10MB.');
        return;
      }
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const promotionData = {
      title: form.title.value,
      discount_text: form.discount_text.value,
      image_url: imageUrl || null,
      valid_until: form.valid_until.value || null
    };

    try {
      const res = await fetch('/api/restaurant/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promotionData)
      });
      if (res.ok) {
        setSuccess('Promoção criada com sucesso!');
        setShowPromotionModal(false);
        fetchAdminData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar promoção');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPromotion) return;
    const form = e.target as any;

    // Process image: file upload takes priority over URL
    let imageUrl = form.image_url.value;
    const fileInput = form.image_file;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      if (!file.type.startsWith('image/')) {
        setError('O arquivo deve ser uma imagem válida.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 10MB.');
        return;
      }
      imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }

    const promotionData = {
      title: form.title.value,
      discount_text: form.discount_text.value,
      image_url: imageUrl || null,
      valid_until: form.valid_until.value || null,
      active: selectedPromotion.active
    };

    try {
      const res = await fetch(`/api/restaurant/promotions/${selectedPromotion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promotionData)
      });
      if (res.ok) {
        setSuccess('Promoção atualizada!');
        setShowPromotionModal(false);
        setSelectedPromotion(null);
        fetchAdminData();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar promoção');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('Excluir esta promoção permanentemente?')) return;
    try {
      const res = await fetch(`/api/restaurant/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPromotions(prev => prev.filter(p => p.id !== id));
        setSuccess('Promoção excluída');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  const handleTogglePromotion = async (promo: Promotion) => {
    const newStatus = !promo.active;
    try {
      const res = await fetch(`/api/restaurant/promotions/${promo.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ active: newStatus })
      });
      if (res.ok) {
        setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, active: newStatus } : p));
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  useEffect(() => {
    if (token && view === 'admin') {
      const fetchData = async () => {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [pRes, oRes, sRes, mRes, cRes, couriersRes] = await Promise.all([
          fetch('/api/restaurant/products', { headers }),
          fetch('/api/restaurant/orders', { headers }),
          fetch('/api/restaurant/reports/summary', { headers }),
          fetch('/api/restaurant/me', { headers }),
          fetch('/api/restaurant/categories', { headers }),
          fetch('/api/restaurant/couriers', { headers })
        ]);
        if (pRes.ok) setProducts(await pRes.json());
        if (oRes.ok) setOrders(await oRes.json());
        if (sRes.ok) setSummary(await sRes.json());
        if (mRes.ok) setRestaurant(await mRes.json());
        if (cRes.ok) setCategories(await cRes.json());
        if (couriersRes.ok) setCouriers(await couriersRes.json());
      };
      fetchData();
      const interval = setInterval(fetchData, 10000); // Auto refresh
      return () => clearInterval(interval);
    }
  }, [token, view]);

  // Tracking Polling
  useEffect(() => {
    if (view === 'tracking' && trackingOrder) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/public/orders/${trackingOrder.id}`);
          if (res.ok) {
            const data = await res.json();
            setTrackingOrder(data);
          }
        } catch (e) { }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [view, trackingOrder?.id]);

  // Public View Logic
  const openPublicMenu = async (slug: string) => {
    const res = await fetch(`/api/public/restaurant/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setPublicData(data);
      setView('public');

      // Check for daily offer
      const offer = data.products.find((p: Product) => p.is_daily_offer);
      if (offer) {
        setDailyOfferProduct(offer);
        setShowDailyOffer(true);
      }
    }
  };

  const handleAddToCart = (product: Product, options: ProductOption[] = []) => {
    setCart(prev => {
      // Check if same product with same options exists
      const existingIndex = prev.findIndex(c =>
        c.product.id === product.id &&
        JSON.stringify(c.selectedOptions?.map(o => o.id).sort()) === JSON.stringify(options.map(o => o.id).sort())
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prev, { product, quantity: 1, selectedOptions: options }];
    });
    setSelectedProduct(null);
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = {
      customer_name: (e.target as any).name.value,
      customer_phone: (e.target as any).phone.value,
      customer_address: (e.target as any).address.value,
    };
    const res = await fetch('/api/public/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: publicData.restaurant.id,
        ...customer,
        items: cart.map(c => ({
          product_id: c.product.id,
          quantity: c.quantity,
          price: c.product.price,
          selectedOptions: c.selectedOptions
        }))
      })
    });
    if (res.ok) {
      const data = await res.json();
      const trackRes = await fetch(`/api/public/orders/${data.orderId}`);
      setTrackingOrder(await trackRes.json());
      setView('tracking');
      setCart([]);
    }
  };

  const updateOrderStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/restaurant/orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as any } : o));
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
      }
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
    try {
      const res = await fetch(`/api/restaurant/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setOrders(prev => prev.filter(o => o.id !== id));
        setSuccess('Pedido excluído com sucesso!');
        fetchAdminData(); // Refresh summary and stats
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao excluir pedido');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
  };

  // --- Render Helpers ---

  // Safety Splash Screen
  if (token && isInitialLoad) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-8 gap-6">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-text-muted font-bold animate-pulse">Iniciando Portal Pro...</p>
      </div>
    );
  }

  // CRITICAL: Super Admin role has absolute priority over view state
  const isSuperAdmin = token && (restaurant?.isPlatform || restaurant?.role?.trim().toLowerCase() === 'superadmin');
  
  if (isSuperAdmin) {
    return (
      <SuperAdminView
        restaurants={adminRestaurants}
        stats={adminStats}
        plans={plans}
        onLogout={logout}
        onUpdatePlan={async (restaurantId, planId) => {
          try {
            const res = await fetch(`/api/admin/restaurants/${restaurantId}/plan`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ plan_id: planId })
            });
            if (res.ok) {
              setAdminRestaurants(prev => prev.map(r => r.id === restaurantId ? { ...r, plan_id: planId } : r));
              setSuccess('Plano atualizado com sucesso');
            }
          } catch (err) {
            setError('Erro ao atualizar plano');
          }
        }}
        onUpdatePlanDetails={async (planId, data) => {
          try {
            const res = await fetch(`/api/admin/plans/${planId}`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(data)
            });
            if (res.ok) {
              setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...data as any } : p));
              setSuccess('Configuração do plano salva com sucesso!');
            }
          } catch (err) {
            setError('Erro ao configurar plano');
          }
        }}
        onCreatePlan={async (data) => {
          try {
            const res = await fetch('/api/admin/plans', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(data)
            });
            if (res.ok) {
              const newPlan = await res.json();
              setPlans(prev => [...prev, newPlan]);
              setSuccess('Plano criado com sucesso!');
            }
          } catch (err) {
            setError('Erro ao criar plano');
          }
        }}
        onToggleStatus={async (id, is_active) => {
          try {
            const res = await fetch(`/api/admin/restaurants/${id}/status`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ is_active })
            });
            if (res.ok) {
              setAdminRestaurants(prev => prev.map(r => r.id === id ? { ...r, is_active } : r));
              setSuccess(`Workspace ${is_active ? 'ativado' : 'suspenso'} com sucesso`);
            }
          } catch (err) {
            setError('Erro ao alterar status do workspace');
          }
        }}
      />
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg space-y-20 text-center"
        >
          <div className="space-y-6">
            <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 rotate-3 animate-pulse">
              <Truck size={48} className="text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-black tracking-tighter text-text-main">
                Delivery<span className="text-primary italic">Pro</span>
              </h1>
              <p className="text-text-muted text-xl font-medium max-w-sm mx-auto">
                A evolução da sua gestão está apenas a um clique.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setView('register')}
              className="w-full py-6 bg-primary text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-primary/30 hover:shadow-primary/40 active:scale-95 transition-all"
            >
              Criar Painel Grátis
            </button>
            <button
              onClick={() => setView('login')}
              className="w-full py-6 bg-transparent text-text-main text-lg font-black rounded-[2rem] border-2 border-gray-100 hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <LayoutDashboard size={20} />
              Acessar Painel
            </button>
          </div>

          <div className="pt-12 border-t border-gray-50 flex flex-col items-center gap-8">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-muted/40">Portal do Cliente</p>
            <div className="w-full max-w-xs relative">
              <input
                placeholder="slug-do-seu-restaurante"
                className="w-full py-4 bg-transparent border-b-2 border-gray-100 text-center text-xl font-black focus:outline-none focus:border-primary transition-all placeholder:text-gray-100 placeholder:font-black"
                onKeyDown={(e) => e.key === 'Enter' && handleViewPublic((e.target as HTMLInputElement).value)}
              />
              <button
                onClick={() => setView('tracking')}
                className="mt-8 mx-auto text-xs font-black text-text-muted/60 hover:text-primary tracking-widest uppercase flex items-center gap-2 transition-all"
              >
                <Clock size={14} /> Rastrear meu Pedido
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 font-sans">
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-16"
        >
          <button
            onClick={() => setView('landing')}
            className="group flex items-center gap-3 text-text-muted/40 hover:text-primary transition-all"
          >
            <div className="w-10 h-10 rounded-full border border-gray-50 flex items-center justify-center group-hover:border-primary/20">
              <ArrowLeft size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Início</span>
          </button>

          <div className="space-y-4">
            <h2 className="text-7xl font-black text-text-main tracking-tighter leading-none">
              {view === 'login' ? 'Olá.' : 'Novo.'}
            </h2>
            <p className="text-text-muted text-xl font-medium">
              {view === 'login' ? 'O painel espera por você.' : 'Transforme seu negócio hoje.'}
            </p>
          </div>

          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-12">
            <div className="space-y-8">
              {view === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Restaurante</label>
                  <input name="name" required className="input-minimal text-lg h-14" placeholder="Nome Fantasia" />
                </div>
              )}
              {view === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Endereço Web</label>
                  <div className="relative">
                    <input name="slug" required className="input-minimal text-lg h-14 pr-32" placeholder="nome-do-negocio" />
                    <span className="absolute right-0 bottom-4 text-[10px] font-black text-text-muted/20 uppercase">.deliverypro.com</span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">E-mail</label>
                <input name="email" type="email" required className="input-minimal text-lg h-14" placeholder="exemplo@gmail.com" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Senha</label>
                <input name="password" type="password" required className="input-minimal text-lg h-14" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" className="w-full py-6 bg-primary text-white text-xl font-black rounded-3xl shadow-2xl shadow-primary/30 active:scale-95 transition-all">
              {view === 'login' ? 'Entrar no Painel' : 'Criar minha Conta'}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4">
            <p className="text-sm font-medium text-text-muted">
              {view === 'login' ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}
            </p>
            <button
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-primary font-black text-xs uppercase tracking-[0.3em] hover:tracking-[0.5em] transition-all"
            >
              {view === 'login' ? 'Fazer Cadastro' : 'Fazer Login'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-secondary flex flex-col md:flex-row">
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />
        <ProductModal
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSubmit={handleCreateProduct}
          categories={categories}
        />
        <CourierModal
          isOpen={showCourierModal}
          onClose={() => setShowCourierModal(false)}
          onSubmit={handleCreateCourier}
        />
        <PromotionModal
          isOpen={showPromotionModal}
          onClose={() => {
            setShowPromotionModal(false);
            setSelectedPromotion(null);
          }}
          onSubmit={selectedPromotion ? handleUpdatePromotion : handleCreatePromotion}
          promotion={selectedPromotion}
        />
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateOrderStatus}
          couriers={couriers}
          token={token}
        />
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white border-r border-gray-100 p-6 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
              <Truck size={20} />
            </div>
            <span className="font-bold text-lg truncate">{restaurant?.name}</span>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={adminTab === 'dashboard'} onClick={() => setAdminTab('dashboard')} />
            <SidebarItem icon={ShoppingBag} label="Pedidos" active={adminTab === 'orders'} onClick={() => setAdminTab('orders')} />
            <SidebarItem icon={Plus} label="Balcão" active={adminTab === 'counter'} onClick={() => setAdminTab('counter')} />
            <SidebarItem icon={Clock} label="Produção" active={adminTab === 'production'} onClick={() => setAdminTab('production')} />
            <SidebarItem icon={Utensils} label="Cardápio" active={adminTab === 'products'} onClick={() => setAdminTab('products')} />
            <SidebarItem icon={Truck} label="Entregadores" active={adminTab === 'couriers'} onClick={() => setAdminTab('couriers')} />
            <SidebarItem icon={Star} label="Promoções" active={adminTab === 'promotions'} onClick={() => setAdminTab('promotions')} />
            <SidebarItem icon={Brain} label="Assistente IA" active={adminTab === 'ai'} onClick={() => setAdminTab('ai')} />
            <SidebarItem icon={Users} label="Clientes" active={adminTab === 'customers'} onClick={() => setAdminTab('customers')} />
            <SidebarItem icon={Settings} label="Configurações" active={adminTab === 'settings'} onClick={() => setAdminTab('settings')} />
            <div className="pt-4 border-t border-gray-100 mt-4">
              <SidebarItem
                icon={Eye}
                label="Ver Cardápio Online"
                active={false}
                onClick={() => {
                  if (restaurant) handleViewPublic(restaurant.slug);
                }}
              />
            </div>
          </nav>

          <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-error hover:bg-red-50 rounded-xl transition-all">
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={adminTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {adminTab === 'dashboard' && <DashboardView summary={summary} showAdvanced={!!restaurant?.plan?.features?.advanced_reports} />}
              {adminTab === 'products' && <ProductsView products={products} onAdd={() => setShowProductModal(true)} onViewOnline={() => {
                if (restaurant) {
                  handleViewPublic(restaurant.slug);
                }
              }} onDelete={handleDeleteProduct} />}
              {adminTab === 'orders' && <OrdersView orders={orders} onUpdateStatus={updateOrderStatus} onViewOrder={handleViewOrder} onDeleteOrder={handleDeleteOrder} />}
              {adminTab === 'counter' && <CounterOrderView products={products} customers={customers} promotions={promotions} onOrderCreated={fetchAdminData} token={token} />}
              {adminTab === 'customers' && (
                <CustomersView
                  customers={customers}
                  onImport={handleBulkImportCustomers}
                  onDelete={handleDeleteCustomer}
                  token={token}
                />
              )}
              {adminTab === 'production' && <ProductionView orders={orders} onUpdateStatus={updateOrderStatus} onViewOrder={handleViewOrder} couriers={couriers} token={token} />}
              {adminTab === 'settings' && (
                <SettingsView 
                  restaurant={restaurant} 
                  onUpdate={fetchAdminData} 
                  token={token} 
                  setError={setError} 
                  setSuccess={setSuccess}
                  setAdminTab={setAdminTab}
                />
              )}
              {adminTab === 'promotions' && (
                <FeatureGuard
                  enabled={!!restaurant?.plan?.features?.promotions}
                  title="Gestão de Promoções"
                  description="Crie banners e ofertas irresistíveis para aumentar suas vendas."
                  onUpgrade={() => setAdminTab('dashboard')}
                >
                  <PromotionsView
                    promotions={promotions}
                    onAdd={() => {
                      setSelectedPromotion(null);
                      setShowPromotionModal(true);
                    }}
                    onEdit={(promo) => {
                      setSelectedPromotion(promo);
                      setShowPromotionModal(true);
                    }}
                    onDelete={handleDeletePromotion}
                    onToggle={handleTogglePromotion}
                  />
                </FeatureGuard>
              )}
              {adminTab === 'couriers' && (
                <FeatureGuard
                  enabled={!!restaurant?.plan?.features?.couriers_management}
                  title="Gestão de Entregadores"
                  description="Controle sua frota própria, motoboys e rotas de entrega."
                  onUpgrade={() => setAdminTab('dashboard')}
                >
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-3xl font-black tracking-tight text-text-main">Painel dos Motoboys</h2>
                        <p className="text-text-muted mt-1 font-medium">Gestão de entregas e motoristas ativos</p>
                      </div>
                      <button onClick={() => setShowCourierModal(true)} className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
                        <Plus size={18} />
                        Novo Entregador
                      </button>
                    </div>

                  {/* Courier Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Motoboys Ativos', value: couriers.filter(c => c.active).length, icon: UserPlus, color: 'text-primary', bg: 'bg-primary-soft' },
                      { label: 'Entregas em Rota', value: orders.filter(o => o.status === 'delivering').length, icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Média de Tempo', value: '28 min', icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
                    ].map((stat, i) => (
                      <div key={i} className="card p-6 flex items-center gap-6 border-none shadow-premium bg-white">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg, stat.color)}>
                          <stat.icon size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">{stat.label}</p>
                          <h4 className="text-2xl font-black text-text-main mt-1">{stat.value}</h4>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {couriers.map(c => {
                      const isBusy = orders.some(o => o.courier_id === c.id && o.status === 'delivering');
                      return (
                        <div key={c.id} className="card p-0 overflow-hidden border-none shadow-premium bg-white group hover:ring-2 ring-primary/20 transition-all">
                          <div className="p-6 space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md relative">
                                {c.photo_url ? (
                                  <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <User size={32} />
                                  </div>
                                )}
                                <div className={cn(
                                  "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white",
                                  c.active ? (isBusy ? "bg-blue-500" : "bg-green-500") : "bg-gray-400"
                                )} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-text-main truncate">{c.name}</h3>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                  {isBusy ? 'Em Rota' : (c.active ? 'Disponível' : 'Off-line')}
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                <span>Classificação</span>
                                <div className="flex items-center gap-1 text-primary">
                                  <Star size={12} fill="currentColor" />
                                  <span>4.9</span>
                                </div>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-text-muted">
                                <span>Pedido Atual</span>
                                <span className="text-text-main">#{isBusy ? '124' : '—'}</span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {isBusy ? (
                                <button className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-blue-200">Acompanhar</button>
                              ) : (
                                <button className="flex-1 py-3 bg-gray-100 text-text-main text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-gray-200">Histórico</button>
                              )}
                              <button onClick={() => handleDeleteCourier(c.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </FeatureGuard>
              )}
              {adminTab === 'ai' && (
                <FeatureGuard
                  enabled={!!restaurant?.plan?.features?.ai_assistant}
                  title="Assistente de Inteligência Artificial"
                  description="Automatize o atendimento e os pedidos com o poder do Google Gemini."
                  onUpgrade={() => setAdminTab('dashboard')}
                >
                  <AIView restaurant={restaurant} token={token} />
                </FeatureGuard>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  if (view === 'tracking') {
    return <TrackingView onBack={() => setView('public')} initialOrder={trackingOrder} />;
  }


  if (view === 'public') {
    if (!publicData) return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );

    const categoriesList = Array.from(new Set(publicData.products.map((p: Product) => p.category_name || 'Geral')));
    const totalAmount = cart.reduce((acc, c) => {
      const optionsTotal = c.selectedOptions?.reduce((sum, opt) => sum + opt.price, 0) || 0;
      return acc + ((c.product.price + optionsTotal) * c.quantity);
    }, 0);

    const productsByCategory: Record<string, Product[]> = {};
    publicData.products.forEach((p: Product) => {
      const cat = p.category_name || 'Geral';
      if (!productsByCategory[cat]) productsByCategory[cat] = [];
      productsByCategory[cat].push(p);
    });

    return (
      <div className="min-h-screen bg-white pb-32" style={{ backgroundColor: publicData.restaurant?.secondary_color || '#FFFFFF' }}>
        <style>
          {`
            :root {
              --primary: ${publicData.restaurant?.primary_color || '#FF4C29'};
              --primary-soft: ${publicData.restaurant?.primary_color ? publicData.restaurant?.primary_color + '20' : '#FF4C2920'};
            }
          `}
        </style>
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />

        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
          <button onClick={() => setView('landing')} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-text-main hover:bg-border transition-all">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-black tracking-tight text-text-main">Cardápio Digital</h1>
          <button className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center text-primary group transition-all">
            <Search size={20} className="group-hover:scale-110" />
          </button>
        </header>

        {publicTab === 'menu' && (
          <>
        <div className="sticky top-[73px] z-30 bg-white/80 backdrop-blur-md border-b border-border overflow-x-auto no-scrollbar py-2">
          <div className="flex px-6 gap-8 min-w-max">
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  const el = document.getElementById(`cat-${cat}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  "relative py-3 text-sm font-bold transition-all",
                  activeCategory === cat ? "text-primary" : "text-text-muted hover:text-text-main"
                )}
              >
                {cat}
                {activeCategory === cat && (
                  <motion.div layoutId="activeCat" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-6 py-8 space-y-12">
          {/* Active Promotions Banner */}
          {publicData.promotions && publicData.promotions.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-text-main tracking-tight flex items-center gap-2">
                <Star size={20} className="text-primary" /> Promoções
              </h2>
              <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
                {publicData.promotions.map((promo: any) => (
                  <div
                    key={promo.id}
                    className="w-72 flex-shrink-0 bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group"
                  >
                    <div className="h-40 overflow-hidden bg-secondary relative">
                      {promo.image_url ? (
                        <img src={promo.image_url} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Star size={48} className="text-primary/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                          {promo.discount_text}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 space-y-2">
                      <h3 className="font-black text-text-main text-lg leading-tight">{promo.title}</h3>
                      {promo.valid_until && (
                        <p className="text-xs text-text-muted font-medium flex items-center gap-1">
                          <Clock size={12} />
                          Válido até {new Date(promo.valid_until).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Offers / Highlights */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-text-main tracking-tight">Destaques da Semana</h2>
            <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {publicData.products.filter((p: Product) => p.is_daily_offer).map((p: Product) => (
                <motion.div
                  key={p.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProduct(p)}
                  className="w-64 flex-shrink-0 bg-white border border-border rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div className="h-48 overflow-hidden bg-secondary relative">
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase">Top Choice</div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="font-black text-text-main text-lg truncate">{p.name}</h3>
                      <p className="text-primary font-black text-lg mt-1">{formatCurrency(p.price)}</p>
                    </div>
                    <div className="w-full btn-secondary py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                      <Plus size={16} /> Adicionar
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Catalog Sections */}
          {Object.entries(productsByCategory).map(([category, products]) => (
            <div key={category} id={`cat-${category}`} className="space-y-8 scroll-mt-32">
              <h2 className="text-xl font-black text-text-main tracking-tight">{category}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((p: Product) => (
                  <motion.div
                    key={p.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedProduct(p)}
                    className="flex bg-white border border-border rounded-3xl p-4 gap-4 cursor-pointer hover:shadow-xl hover:border-transparent transition-all group"
                  >
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-secondary flex-shrink-0">
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-black text-text-main group-hover:text-primary transition-colors">{p.name}</h3>
                        <p className="text-[10px] text-text-muted mt-1 leading-relaxed line-clamp-2 font-medium">{p.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="font-black text-primary text-lg">{formatCurrency(p.price)}</p>
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-all">
                          <Plus size={18} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </main>
          </>
        )}

        {/* Pedidos Tab */}
        {publicTab === 'pedidos' && (
          <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            <h2 className="text-xl font-black text-text-main">Meus Pedidos</h2>
            <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
              <p className="text-text-muted text-sm">Acompanhe o status do seu pedido informando o número:</p>
              <form onSubmit={(e) => { e.preventDefault(); const form = e.target as any; const id = form.order_id.value; if (id) { fetch(`/api/public/orders/${id}`).then(r => r.ok ? r.json() : null).then(data => { if (data) { setTrackingOrder(data); setView('tracking'); } else { setError('Pedido não encontrado'); } }); } }} className="flex gap-3">
                <input name="order_id" type="number" placeholder="Número do pedido" className="input flex-1" required />
                <button type="submit" className="btn-primary px-6">Rastrear</button>
              </form>
            </div>
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag size={28} className="text-text-muted" />
              </div>
              <p className="text-text-muted text-sm">Faça um pedido pelo cardápio e acompanhe aqui!</p>
            </div>
          </main>
        )}

        {/* Favoritos Tab */}
        {publicTab === 'favoritos' && (
          <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            <h2 className="text-xl font-black text-text-main">Favoritos</h2>
            {publicData.products.filter((p: Product) => p.is_daily_offer).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {publicData.products.filter((p: Product) => p.is_daily_offer).map((p: Product) => (
                  <div key={p.id} onClick={() => setSelectedProduct(p)} className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                    <div className="h-36 bg-secondary overflow-hidden">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Utensils size={32} /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-black text-text-main">{p.name}</h3>
                      <p className="text-primary font-bold mt-1">{formatCurrency(p.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto">
                  <Heart size={28} className="text-text-muted" />
                </div>
                <p className="text-text-muted text-sm">Os destaques do cardápio aparecerão aqui!</p>
              </div>
            )}
          </main>
        )}

        {/* Perfil Tab */}
        {publicTab === 'perfil' && publicData.restaurant && (
          <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
            <h2 className="text-xl font-black text-text-main">Sobre o Restaurante</h2>
            <div className="bg-white border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-4">
                {publicData.restaurant.logo_url ? (
                  <img src={publicData.restaurant.logo_url} alt={publicData.restaurant.name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Utensils size={28} /></div>
                )}
                <div>
                  <h3 className="text-lg font-black text-text-main">{publicData.restaurant.name}</h3>
                  {publicData.restaurant.slogan && <p className="text-text-muted text-sm">{publicData.restaurant.slogan}</p>}
                </div>
              </div>
              {publicData.restaurant.address && (
                <div className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                  <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-main">{publicData.restaurant.address}</p>
                </div>
              )}
              {publicData.restaurant.phone && (
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <User size={18} className="text-primary flex-shrink-0" />
                  <p className="text-sm text-text-main">{publicData.restaurant.phone}</p>
                </div>
              )}
            </div>
          </main>
        )}

        <div className="fixed bottom-0 left-0 right-0 z-50">
          {cart.length > 0 && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-6 mb-4">
              <div className="bg-white rounded-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer group flex-1" onClick={() => setShowCartDetails(true)}>
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary-soft rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <ShoppingBag size={24} />
                    </div>
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {cart.reduce((acc, c) => acc + c.quantity, 0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60">Total Pedido</p>
                    <p className="text-xl font-black text-text-main tracking-tighter">{formatCurrency(totalAmount)}</p>
                  </div>
                </div>
                <button onClick={() => setShowCartDetails(true)} className="btn-primary py-4 px-8 shadow-xl shadow-primary/20">Finalizar</button>
              </div>
            </motion.div>
          )}

          <nav className="bg-white border-t border-border flex items-center justify-around h-[80px] px-6">
            <button onClick={() => setPublicTab('menu')} className={`flex flex-col items-center gap-1 ${publicTab === 'menu' ? 'text-primary' : 'text-text-muted'}`}><Utensils size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Menu</span></button>
            <button onClick={() => setPublicTab('pedidos')} className={`flex flex-col items-center gap-1 ${publicTab === 'pedidos' ? 'text-primary' : 'text-text-muted'}`}><ShoppingBag size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Pedidos</span></button>
            <button onClick={() => setPublicTab('favoritos')} className={`flex flex-col items-center gap-1 ${publicTab === 'favoritos' ? 'text-primary' : 'text-text-muted'}`}><Heart size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Favoritos</span></button>
            <button onClick={() => setPublicTab('perfil')} className={`flex flex-col items-center gap-1 ${publicTab === 'perfil' ? 'text-primary' : 'text-text-muted'}`}><User size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Perfil</span></button>
          </nav>
        </div>

        <AnimatePresence>
          {showCartDetails && (
            <motion.div
              key="cart-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end justify-center"
              onClick={(e) => e.target === e.currentTarget && setShowCartDetails(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white w-full max-w-xl rounded-t-[3rem] p-8 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-text-main">Sua Sacola</h3>
                  <button onClick={() => setShowCartDetails(false)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-text-muted"><X size={20} /></button>
                </div>
                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 no-scrollbar">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="flex-1">
                        <p className="font-black text-sm text-text-main"><span className="text-primary mr-2">{c.quantity}x</span>{c.product.name}</p>
                        {c.selectedOptions && c.selectedOptions.length > 0 && (
                          <p className="text-xs text-text-muted mt-1 font-medium">{c.selectedOptions.map(o => o.name).join(', ')}</p>
                        )}
                      </div>
                      <span className="font-black text-sm text-text-main">{formatCurrency((c.product.price + (c.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0)) * c.quantity)}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={submitOrder} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <input name="name" required placeholder="Nome Completo" className="input" />
                    <input name="phone" required placeholder="Telefone / WhatsApp" className="input" />
                    <input name="address" required placeholder="Endereço de Entrega" className="input" />
                  </div>
                  <button type="submit" className="btn-primary w-full py-5 text-lg font-black rounded-2xl shadow-2xl">Enviar Pedido</button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedProduct && (
          <ProductDetailModal
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    );
  }

  if (view === 'tracking') {
    return <TrackingView onBack={() => setView('landing')} initialOrder={trackingOrder} />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    </div>
  );
}
