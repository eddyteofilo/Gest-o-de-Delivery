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
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from './utils';
import { Restaurant, Product, Order, Courier, Category, ProductOption, Customer } from './types';

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

const DashboardView = ({ summary }: { summary: any }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Visão Geral</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="card">
        <p className="text-text-muted text-sm">Pedidos Totais</p>
        <p className="text-3xl font-bold mt-1">{summary?.total_orders || 0}</p>
      </div>
      <div className="card">
        <p className="text-text-muted text-sm">Receita Total</p>
        <p className="text-3xl font-bold mt-1 text-success">{formatCurrency(summary?.total_revenue || 0)}</p>
      </div>
      <div className="card">
        <p className="text-text-muted text-sm">Pedidos Concluídos</p>
        <p className="text-3xl font-bold mt-1">{summary?.completed_orders || 0}</p>
      </div>
    </div>
  </div>
);

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

const OrdersView = ({ orders, onUpdateStatus, onViewOrder }: { orders: Order[], onUpdateStatus: (id: number, status: string) => void, onViewOrder: (order: Order) => void }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold">Pedidos</h2>
    <div className="space-y-3">
      {orders.map(o => (
        <div key={o.id} className="card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/30 transition-colors cursor-pointer" onClick={() => onViewOrder(o)}>
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
    </div>
  </div>
);

const ProductionView = ({ orders, onUpdateStatus, onViewOrder, couriers, token }: { orders: Order[], onUpdateStatus: (id: number, status: string) => void, onViewOrder: (order: Order) => void, couriers: Courier[], token: string | null }) => {
  const stages = [
    { id: 'pending', label: 'Pendente', icon: Clock, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
    { id: 'preparing', label: 'Preparando', icon: Utensils, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { id: 'ready', label: 'Pronto', icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-100' },
    { id: 'delivering', label: 'Em Entrega', icon: Truck, color: 'bg-purple-50 text-purple-700 border-purple-100' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Produção em Tempo Real</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stages.map(stage => (
          <div key={stage.id} className="flex flex-col gap-4">
            <div className={cn("flex items-center gap-2 p-3 rounded-xl border font-bold", stage.color)}>
              <stage.icon size={18} />
              {stage.label}
              <span className="ml-auto bg-white/50 px-2 py-0.5 rounded-lg text-xs">
                {orders.filter(o => o.status === stage.id).length}
              </span>
            </div>
            <div className="space-y-3">
              {orders.filter(o => o.status === stage.id).map(order => (
                <motion.div
                  layoutId={order.id.toString()}
                  key={order.id}
                  className="card p-4 cursor-pointer hover:border-primary/30 transition-all"
                  onClick={() => onViewOrder(order)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold">#{order.id}</span>
                    <span className="text-[10px] text-text-muted">{formatDate(order.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{order.customer_name}</p>
                  <p className="text-xs text-text-muted mt-1 line-clamp-2">{order.customer_address}</p>

                  <div className="mt-4 flex flex-col gap-2">
                    {stage.id === 'pending' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'preparing'); }}
                        className="w-full bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-blue-700"
                      >
                        INICIAR PREPARO
                      </button>
                    )}
                    {stage.id === 'preparing' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'ready'); }}
                        className="w-full bg-green-600 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-green-700"
                      >
                        MARCAR COMO PRONTO
                      </button>
                    )}
                    {stage.id === 'ready' && (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[10px] font-bold text-text-muted uppercase">Selecionar Entregador</p>
                        <select
                          className="w-full text-[10px] p-1.5 border rounded-lg bg-white"
                          onChange={async (e) => {
                            const courierId = e.target.value ? parseInt(e.target.value) : null;
                            if (courierId) {
                              await fetch(`/api/restaurant/orders/${order.id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ status: 'delivering', courier_id: courierId })
                              });
                              onUpdateStatus(order.id, 'delivering');
                            }
                          }}
                        >
                          <option value="">Escolher...</option>
                          {couriers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                    {stage.id === 'delivering' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(order.id, 'completed'); }}
                        className="w-full bg-primary text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-primary/90"
                      >
                        CONCLUIR ENTREGA
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
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

  return (
    <div className="min-h-screen bg-secondary p-4 md:p-6">
      <div className="max-w-md mx-auto space-y-8">
        <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors">
          <ChevronRight className="rotate-180" size={20} />
          Voltar ao Cardápio
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-bold">Acompanhar Pedido</h1>
          <p className="text-text-muted mt-2">Digite o número do seu pedido para ver o status em tempo real</p>
        </div>

        <div className="card space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase">Número do Pedido</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Ex: 123"
              className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 ring-primary/20"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={loading}
            className="w-full btn-primary py-4"
          >
            {loading ? 'Buscando...' : 'Acompanhar'}
          </button>
          {error && <p className="text-error text-center text-sm font-medium">{error}</p>}
        </div>

        {order && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card space-y-6">
            <div className="flex justify-between items-center border-b border-gray-50 pb-4">
              <div>
                <p className="text-xs text-text-muted uppercase font-bold">Status Atual</p>
                <p className={cn("text-lg font-bold mt-1", ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS])}>
                  {ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS]}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                {order.status === 'pending' && <Clock size={24} />}
                {order.status === 'preparing' && <Utensils size={24} />}
                {order.status === 'ready' && <CheckCircle2 size={24} />}
                {order.status === 'delivering' && <Truck size={24} />}
                {order.status === 'completed' && <CheckCircle2 size={24} />}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn("w-3 h-3 rounded-full", order.status !== 'completed' ? 'bg-primary animate-pulse' : 'bg-gray-300')} />
                <div>
                  <p className="font-bold text-sm">
                    {order.status === 'pending' && 'Aguardando confirmação do restaurante'}
                    {order.status === 'preparing' && 'Seu pedido está sendo preparado com carinho'}
                    {order.status === 'ready' && 'Seu pedido está pronto e aguardando o entregador'}
                    {order.status === 'delivering' && 'O entregador já está a caminho do seu endereço'}
                    {order.status === 'completed' && 'Pedido entregue! Bom apetite!'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{formatDate(order.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 p-4 rounded-xl space-y-2">
              <p className="text-xs font-bold text-text-muted uppercase">Restaurante</p>
              <p className="text-sm font-medium">{order.restaurant_name}</p>
              <p className="text-xs text-text-muted">{order.restaurant_phone}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const CounterOrderView = ({ products, customers, onOrderCreated, token }: { products: Product[], customers: Customer[], onOrderCreated: () => void, token: string | null }) => {
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


const SettingsView = ({ restaurant, onUpdate, token, setError, setSuccess }: { restaurant: Restaurant | null, onUpdate: () => void, token: string | null, setError: (v: string | null) => void, setSuccess: (v: string | null) => void }) => {
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

        <button type="submit" disabled={loading} className="btn-primary w-full py-4 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'admin' | 'public' | 'tracking'>('landing');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'orders' | 'products' | 'couriers' | 'production' | 'counter' | 'settings'>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [publicData, setPublicData] = useState<any>(null);
  const [dailyOfferProduct, setDailyOfferProduct] = useState<Product | null>(null);
  const [showDailyOffer, setShowDailyOffer] = useState(false);
  const [cart, setCart] = useState<{ product: Product, quantity: number, selectedOptions?: ProductOption[] }[]>([]);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      const [pRes, oRes, sRes, cRes, catRes, custRes] = await Promise.all([
        fetch('/api/restaurant/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/reports/summary', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/couriers', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/categories', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/restaurant/customers', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (sRes.ok) setSummary(await sRes.json());
      if (cRes.ok) setCouriers(await cRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAdminData();
      const interval = setInterval(fetchAdminData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [token]);

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
        setToken(data.token);
        setRestaurant(data.restaurant);
        setView('admin');
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

  // --- Render Helpers ---

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8">
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />
        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
          <Truck size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Minimal Delivery</h1>
          <p className="text-text-muted max-w-xs mx-auto">A solução mais simples e rápida para o seu delivery.</p>
        </div>
        <div className="flex flex-col w-full max-w-xs gap-3">
          <button onClick={() => setView('register')} className="btn-primary py-4">Começar Agora</button>
          <button onClick={() => setView('login')} className="btn-secondary py-4">Entrar no Painel</button>
        </div>
        <div className="pt-8 border-t border-gray-100 w-full max-w-xs">
          <p className="text-xs text-text-muted mb-4">Ou peça em um restaurante</p>
          <div className="flex flex-col gap-3">
            <input
              placeholder="slug-do-restaurante"
              className="input text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleViewPublic((e.target as HTMLInputElement).value)}
            />
            <button onClick={() => setView('tracking')} className="text-sm font-bold text-primary flex items-center justify-center gap-2">
              <Clock size={16} /> Acompanhar meu pedido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'login' || view === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-secondary">
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card w-full max-w-md p-8 space-y-6">
          <button onClick={() => setView('landing')} className="text-text-muted hover:text-text-main flex items-center gap-1 text-sm">
            Voltar
          </button>
          <h2 className="text-2xl font-bold">{view === 'login' ? 'Entrar' : 'Criar Conta'}</h2>
          <form onSubmit={view === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {view === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">Nome do Restaurante</label>
                  <input name="name" required className="input" placeholder="Ex: Pizzaria do Zé" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-text-muted">Slug (URL única)</label>
                  <input name="slug" required className="input" placeholder="ex: pizzaria-do-ze" />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">E-mail</label>
              <input name="email" type="email" required className="input" placeholder="seu@email.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-text-muted">Senha</label>
              <input name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full py-3 mt-4">
              {view === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>
          <p className="text-center text-sm text-text-muted">
            {view === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="text-primary font-bold ml-1">
              {view === 'login' ? 'Cadastre-se' : 'Entrar'}
            </button>
          </p>
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
              {adminTab === 'dashboard' && <DashboardView summary={summary} />}
              {adminTab === 'products' && <ProductsView products={products} onAdd={() => setShowProductModal(true)} onViewOnline={() => {
                if (restaurant) {
                  handleViewPublic(restaurant.slug);
                }
              }} onDelete={handleDeleteProduct} />}
              {adminTab === 'orders' && <OrdersView orders={orders} onUpdateStatus={updateOrderStatus} onViewOrder={handleViewOrder} />}
              {adminTab === 'counter' && <CounterOrderView products={products} customers={customers} onOrderCreated={fetchAdminData} token={token} />}
              {adminTab === 'production' && <ProductionView orders={orders} onUpdateStatus={updateOrderStatus} onViewOrder={handleViewOrder} couriers={couriers} token={token} />}
              {adminTab === 'settings' && <SettingsView restaurant={restaurant} onUpdate={fetchAdminData} token={token} setError={setError} setSuccess={setSuccess} />}
              {adminTab === 'couriers' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Entregadores</h2>
                    <button onClick={() => setShowCourierModal(true)} className="btn-primary flex items-center gap-2">
                      <Plus size={18} /> Novo Entregador
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {couriers.map(c => (
                      <div key={c.id} className="card flex gap-4 items-start relative group">
                        <button
                          onClick={() => handleDeleteCourier(c.id)}
                          className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                        <div className="w-16 h-16 bg-gray-100 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          {c.photo_url ? (
                            <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                              <Truck size={24} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold truncate">{c.name}</h3>
                            <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide", c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                              {c.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                            <span className="w-4 h-4 flex items-center justify-center bg-gray-100 rounded-full text-[10px]">📞</span> {c.phone}
                          </p>
                          {c.vehicle_type && (
                            <p className="text-xs font-medium mt-2 px-2 py-1 bg-gray-50 rounded-lg inline-block border border-gray-100">
                              {c.vehicle_type === 'moto' && '🏍️ Moto'}
                              {c.vehicle_type === 'carro' && '🚗 Carro'}
                              {c.vehicle_type === 'bicicleta' && '🚲 Bike'}
                              {c.vehicle_type === 'ape' && '🚶 A Pé'}
                              {(c.vehicle_type === 'moto' || c.vehicle_type === 'carro') && c.vehicle_plate && (
                                <span className="ml-1 text-text-muted border-l border-gray-300 pl-1">{c.vehicle_plate}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {couriers.length === 0 && (
                      <div className="col-span-full text-center py-12 text-text-muted bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Nenhum entregador cadastrado.</p>
                      </div>
                    )}
                  </div>
                </div>
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
    const total = cart.reduce((acc, c) => {
      const optionsTotal = c.selectedOptions?.reduce((sum, opt) => sum + opt.price, 0) || 0;
      return acc + ((c.product.price + optionsTotal) * c.quantity);
    }, 0);

    // Group products by category
    const groupedProducts: Record<string, Product[]> = {};
    publicData.products.forEach((p: Product) => {
      const cat = p.category_name || 'Geral';
      if (!groupedProducts[cat]) groupedProducts[cat] = [];
      groupedProducts[cat].push(p);
    });

    return (
      <div className="min-h-screen bg-[#FDFCFB] pb-32">
        <Toast error={error} success={success} setError={setError} setSuccess={setSuccess} />
        <DailyOfferModal
          isOpen={showDailyOffer}
          product={dailyOfferProduct}
          onClose={() => setShowDailyOffer(false)}
          onAddToCart={handleAddToCart}
        />
        <ProductDetailModal
          isOpen={!!selectedProduct}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />

        {/* Elegant Hero Section */}
        <div className="relative h-[45vh] md:h-[55vh] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/20 z-10" />
          <motion.img
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=2070"
            className="w-full h-full object-cover"
            alt="Hero"
          />

          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white p-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <div className="relative inline-block">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/20 shadow-2xl relative z-10 overflow-hidden">
                  {publicData.restaurant.logo_url ? (
                    <img src={publicData.restaurant.logo_url} className="w-full h-full object-cover" />
                  ) : (
                    <Utensils size={48} className="text-primary" />
                  )}
                </div>
                {/* Floating GIF Accent 1 */}
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 w-12 h-12 z-20"
                >
                  <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJ6eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxxfG9I1I1G/giphy.gif" className="w-full h-full object-contain" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                  {publicData.restaurant.name}
                </h1>
                <div className="flex items-center justify-center gap-2 text-primary font-bold bg-white/10 backdrop-blur-md px-4 py-1 rounded-full w-fit mx-auto border border-white/10">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Aberto Agora
                </div>
              </div>

              <p className="text-lg md:text-xl opacity-100 font-bold max-w-md mx-auto drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-relaxed text-white">
                {publicData.restaurant.slogan}
              </p>
              <p className="text-sm md:text-base opacity-90 font-medium max-w-md mx-auto drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-relaxed text-white">
                {publicData.restaurant.address}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <button onClick={() => setView('tracking')} className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/40">
                  <Clock size={20} /> Acompanhar Pedido
                </button>
                <button onClick={() => setView('landing')} className="bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-2xl font-black text-sm border border-white/20 hover:bg-white/20 transition-all">
                  Voltar
                </button>
              </div>
            </motion.div>
          </div>

          {/* Animated GIF Accents - Floating Elements */}
          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="absolute top-20 left-10 z-30 hidden lg:block opacity-40"
          >
            <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJ6eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxxfG9I1I1G/giphy.gif" className="w-24 h-24 object-contain" />
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FDFCFB] to-transparent z-20" />
        </div>

        <main className="max-w-3xl mx-auto px-4 -mt-10 relative z-30">
          <div className="bg-white rounded-[2rem] shadow-xl p-6 md:p-10 space-y-12">
            {Object.entries(groupedProducts).map(([category, products]) => (
              <div key={category} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-gray-900">{category}</h2>
                  <div className="h-px flex-1 bg-gray-100" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((p: Product) => (
                    <motion.div
                      key={p.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedProduct(p)}
                      className="group bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 cursor-pointer hover:shadow-xl hover:border-primary/20 transition-all"
                    >
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 relative">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Utensils size={32} />
                          </div>
                        )}
                        {p.is_daily_offer && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                            Oferta
                          </div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{p.name}</h3>
                          <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">{p.description}</p>
                        </div>
                        <p className="font-black text-primary text-lg mt-2">{formatCurrency(p.price)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50"
            >
              <div className="bg-black text-white rounded-[2rem] shadow-2xl overflow-hidden">
                <div
                  className="p-6 cursor-pointer flex justify-between items-center"
                  onClick={() => document.getElementById('cart-details')?.classList.toggle('hidden')}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black">
                      {cart.reduce((acc, c) => acc + c.quantity, 0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">Sua Sacola</p>
                      <p className="text-xs opacity-60">Toque para ver detalhes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary">{formatCurrency(total)}</p>
                  </div>
                </div>

                <div id="cart-details" className="hidden border-t border-white/10 p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-[#111]">
                  <div className="space-y-4">
                    {cart.map((c, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4 pb-4 border-b border-white/5">
                        <div className="flex-1">
                          <p className="font-bold text-sm">
                            <span className="text-primary mr-2">{c.quantity}x</span>
                            {c.product.name}
                          </p>
                          {c.selectedOptions && c.selectedOptions.length > 0 && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              {c.selectedOptions.map(o => o.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-sm">
                          {formatCurrency((c.product.price + (c.selectedOptions?.reduce((sum, o) => sum + o.price, 0) || 0)) * c.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={submitOrder} className="space-y-4">
                    <div className="space-y-3">
                      <input name="name" required placeholder="Seu Nome" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none" />
                      <input name="phone" required placeholder="Seu Telefone" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none" />
                      <input name="address" required placeholder="Endereço de Entrega" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm focus:ring-2 ring-primary/50 outline-none" />
                    </div>
                    <button type="submit" className="btn-primary w-full py-4 font-black text-lg rounded-2xl shadow-lg shadow-primary/20">
                      Finalizar Pedido
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    );
  }

  if (view === 'tracking') {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <div className="card w-full max-w-md p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Pedido Recebido!</h2>
            <p className="text-text-muted">Acompanhe o status do seu pedido abaixo.</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 space-y-6 text-left">
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", trackingOrder.status === 'pending' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400')}>
                <Clock size={20} />
              </div>
              <div>
                <p className="font-bold">Pendente</p>
                <p className="text-xs text-text-muted">Aguardando confirmação</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", trackingOrder.status === 'preparing' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400')}>
                <Utensils size={20} />
              </div>
              <div>
                <p className="font-bold">Preparando</p>
                <p className="text-xs text-text-muted">Seu pedido está na cozinha</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", trackingOrder.status === 'delivering' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400')}>
                <Truck size={20} />
              </div>
              <div>
                <p className="font-bold">Em Entrega</p>
                <p className="text-xs text-text-muted">O entregador está a caminho</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-2">
            <button onClick={() => setView('landing')} className="btn-secondary w-full">Voltar ao Início</button>
            <p className="text-xs text-text-muted">Dúvidas? Ligue para {trackingOrder.restaurant_phone}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
