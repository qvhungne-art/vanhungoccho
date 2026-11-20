'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';

type CategoryKey = 'ALL' | 'AI' | 'FB' | 'MAIL' | 'PROXY';
type TabKey = 'store' | 'orders' | 'pricing' | 'tools' | 'admin';
type ViewMode = 'table' | 'grid';
type ApiLang = 'curl' | 'node' | 'python';
type UserRole = 'USER' | 'CTV' | 'ADMIN';

interface Product {
  id: number;
  cat: Exclude<CategoryKey, 'ALL'>;
  name: string;
  price: number;
  stock: number;
  badge: string;
  country: string;
  warranty: string;
  format: string;
}

interface Order {
  code: string;
  product: string;
  qty: number;
  total: number;
  time: string;
  data: string;
}

interface UserSession {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  balance: number;
  totalDeposit: number;
  depositCode: string;
}

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, cat: 'AI', name: 'ChatGPT Plus Private (Cấp riêng 1 Tháng - Bảo hành Full)', price: 145000, stock: 84, badge: 'HOT', country: 'US', warranty: '30 ngày', format: 'email|pass|2fa' },
  { id: 2, cat: 'AI', name: 'Claude Pro 3.7 Sonnet (Tài khoản chính chủ, không chung)', price: 320000, stock: 26, badge: 'VIP', country: 'US', warranty: '30 ngày', format: 'email|pass' },
  { id: 3, cat: 'AI', name: 'Cursor Pro 14 Ngày / 1 Tháng (Fast Request Full)', price: 110000, stock: 52, badge: 'NEW', country: 'US', warranty: '14 ngày', format: 'email|pass' },
  { id: 4, cat: 'FB', name: 'Via Việt XMDT Cổ 2015-2020 (Đã bật 2FA, bao đổi pass)', price: 75000, stock: 310, badge: 'HOT', country: 'VN', warranty: '24h Login', format: 'uid|pass|2fa|mail|passmail' },
  { id: 5, cat: 'FB', name: 'Via Phi Kháng 902 Limit 5m8 (Chạy Ads siêu khỏe)', price: 165000, stock: 95, badge: 'ADS', country: 'PH', warranty: '24h Login', format: 'uid|pass|2fa|cookie' },
  { id: 6, cat: 'FB', name: 'Clone Việt NVR Tương Tác Thật (Reg Phone sạch)', price: 6500, stock: 2450, badge: '', country: 'VN', warranty: 'Check Live', format: 'uid|pass|2fa' },
  { id: 7, cat: 'MAIL', name: 'Gmail Cổ 2014-2018 (Trust cao, đã ngâm IP sạch)', price: 18000, stock: 1280, badge: 'HOT', country: 'US', warranty: '48h Login', format: 'mail|pass|recovery' },
  { id: 8, cat: 'MAIL', name: 'Hotmail / Outlook Live (Mở sẵn IMAP/POP3 đọc OTP)', price: 1200, stock: 6800, badge: '', country: 'GL', warranty: 'Check Live', format: 'mail|pass|refresh_token' },
  { id: 9, cat: 'PROXY', name: 'Proxy Dân Cư Việt Nam Private (IPv4 Tĩnh 30 Ngày)', price: 35000, stock: 420, badge: 'FAST', country: 'VN', warranty: '30 ngày', format: 'ip:port:user:pass' },
  { id: 10, cat: 'PROXY', name: 'Proxy ISP US Tĩnh (Sạch 100% nuôi Ebay / Etsy / TikTok)', price: 55000, stock: 190, badge: 'CLEAN', country: 'US', warranty: '30 ngày', format: 'ip:port:user:pass' },
];

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'AI', label: 'Tài khoản AI' },
  { key: 'FB', label: 'Via & Clone FB' },
  { key: 'MAIL', label: 'Gmail & Mail Cổ' },
  { key: 'PROXY', label: 'Proxy & VPS' },
];

const API_SNIPPETS: Record<ApiLang, string> = {
  curl: `curl -X POST https://vanhung.xyz/api/v1/orders/create \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 5}'`,
  node: `const res = await fetch('https://vanhung.xyz/api/v1/orders/create', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ product_id: 1, quantity: 5 })
});
console.log(await res.json());`,
  python: `import requests
r = requests.post(
  "https://vanhung.xyz/api/v1/orders/create",
  headers={"Authorization": "Bearer YOUR_API_KEY"},
  json={"product_id": 1, "quantity": 5}
)
print(r.json())`,
};

const fmt = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

export default function VanHungHomePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);

  const [wallet, setWallet] = useState<number>(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const [activeTab, setActiveTab] = useState<TabKey>('store');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [buyQty, setBuyQty] = useState<number>(1);
  const [promoCode, setPromoCode] = useState<string>('');
  const [activeDiscount, setActiveDiscount] = useState<number>(0);
  const [isProcessingBuy, setIsProcessingBuy] = useState<boolean>(false);
  const [purchasedResult, setPurchasedResult] = useState<string | null>(null);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);

  const [totpSecret, setTotpSecret] = useState<string>('JBSWY3DPEHPK3PXP');
  const [totpCode, setTotpCode] = useState<string>('482 910');
  const [totpTimer, setTotpTimer] = useState<number>(30);
  const [apiLang, setApiLang] = useState<ApiLang>('curl');

  const [admName, setAdmName] = useState<string>('');
  const [admCat, setAdmCat] = useState<Exclude<CategoryKey, 'ALL'>>('AI');
  const [admPrice, setAdmPrice] = useState<string>('');
  const [admStock, setAdmStock] = useState<string>('');

  // Tải phiên đăng nhập thật từ /api/auth/me
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setWallet(d.user.balance);
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoaded(true));

    try {
      const savedOrders = localStorage.getItem('vh_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } catch {}
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('store');
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const compute2FA = () => {
      const sec = Math.floor(Date.now() / 1000);
      const rem = 30 - (sec % 30);
      const step = Math.floor(sec / 30);
      const key = totpSecret || 'VANHUNG';
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash + key.charCodeAt(i) + step) | 0;
      }
      const code = String(Math.abs(hash) % 1000000).padStart(6, '0');
      setTotpCode(`${code.slice(0, 3)} ${code.slice(3)}`);
      setTotpTimer(rem);
    };
    compute2FA();
    const timer = setInterval(compute2FA, 1000);
    return () => clearInterval(timer);
  }, [totpSecret]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2600);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Đã sao chép vào bộ nhớ tạm!');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setWallet(0);
    setActiveTab('store');
    showToast('Đã đăng xuất tài khoản.');
  };

  const totalStock = useMemo(() => products.reduce((sum, p) => sum + p.stock, 0), [products]);
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter(
      (p) => (activeCategory === 'ALL' || p.cat === activeCategory) && p.name.toLowerCase().includes(q)
    );
  }, [products, activeCategory, searchQuery]);
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);

  const openBuyModal = (product: Product) => {
    if (!user) {
      return showToast('Vui lòng đăng nhập trước khi mua hàng!');
    }
    setSelectedProduct(product);
    setBuyQty(1);
    setPromoCode('');
    setActiveDiscount(user.role === 'CTV' ? 0.05 : 0);
    setPurchasedResult(null);
  };

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'VANHUNG10') { setActiveDiscount(0.1); showToast('Áp dụng mã giảm 10% thành công!'); }
    else if (code === 'MMO2026') { setActiveDiscount(0.15); showToast('Áp dụng mã VIP giảm 15% thành công!'); }
    else { setActiveDiscount(user?.role === 'CTV' ? 0.05 : 0); showToast('Mã giảm giá không hợp lệ!'); }
  };

  const handleConfirmPurchase = () => {
    if (!selectedProduct || !user) return;
    if (buyQty < 1 || buyQty > selectedProduct.stock) return showToast('Số lượng vượt quá tồn kho!');
    const finalTotal = Math.round(buyQty * selectedProduct.price * (1 - activeDiscount));
    if (wallet < finalTotal) return showToast('Số dư không đủ! Vui lòng nạp thêm qua VietQR.');

    setIsProcessingBuy(true);
    setTimeout(() => {
      setWallet((w) => w - finalTotal);
      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id ? { ...p, stock: p.stock - buyQty } : p)));
      const lines: string[] = [];
      for (let i = 0; i < buyQty; i++) {
        const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        if (selectedProduct.cat === 'PROXY') lines.push(`103.142.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}:8080:vh_${rand}:Pass${rand}#`);
        else if (selectedProduct.cat === 'FB') lines.push(`1000${Math.floor(10000000000 + Math.random() * 89999999999)}|VhPass@${rand}|JBSWY3DP${rand}|mail_${rand.toLowerCase()}@vanhung.xyz`);
        else lines.push(`user_${rand.toLowerCase()}@vanhung.xyz|Pass#${rand}2026|2FA_${rand}`);
      }
      const dataStr = lines.join('\n');
      const newOrder: Order = { code: `VH-${Date.now().toString().slice(-6)}`, product: selectedProduct.name, qty: buyQty, total: finalTotal, time: new Date().toLocaleString('vi-VN'), data: dataStr };
      const updatedOrders = [newOrder, ...orders];
      setOrders(updatedOrders);
      localStorage.setItem('vh_orders', JSON.stringify(updatedOrders));
      setPurchasedResult(dataStr);
      setIsProcessingBuy(false);
      showToast('Mua hàng & xuất kho thành công!');
    }, 700);
  };

  const downloadTxt = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `VANHUNG_XYZ_ORDER_${Date.now()}.txt`;
    a.click();
  };

  const handleAdminAddProduct = () => {
    const priceNum = parseInt(admPrice, 10);
    const stockNum = parseInt(admStock, 10);
    if (!admName.trim() || isNaN(priceNum) || isNaN(stockNum)) return showToast('Vui lòng nhập đủ thông tin!');
    setProducts((prev) => [{ id: Date.now(), cat: admCat, name: admName.trim(), price: priceNum, stock: stockNum, badge: 'NEW', country: 'VN', warranty: '24h Login', format: 'user|pass|2fa' }, ...prev]);
    setAdmName(''); setAdmPrice(''); setAdmStock('');
    showToast('Đã thêm sản phẩm mới lên gian hàng!');
  };

  return (
    <div className="cyber-bg min-h-screen flex flex-col text-slate-50 antialiased">
      <div className="bg-emerald-950/40 border-b border-emerald-500/20 py-1.5 text-xs text-emerald-300/90 ticker-wrap">
        <div className="ticker-move font-mono">
          <span className="mx-6">● [Vừa xong] user_huy*** mua 50 Gmail Cổ 2018-2020 (Check Live OK)</span>
          <span className="mx-6">● [1 phút trước] agency_minh*** nạp +5,000,000đ qua VietQR SePay (Auto 3s)</span>
          <span className="mx-6">● [2 phút trước] mmo_pro99*** mua 10 ChatGPT Plus Private 1 Tháng</span>
          <span className="mx-6">● [3 phút trước] ads_linh*** mua 20 Via XMDT Kháng 902 Cổ</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setActiveTab('store')} className="flex items-center gap-3 group text-left">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-[1.5px]">
              <div className="w-full h-full bg-[#050811] rounded-[10px] flex items-center justify-center font-extrabold text-emerald-400">VH</div>
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight leading-none">VANHUNG<span className="text-emerald-400">.XYZ</span></div>
              <div className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mt-0.5">MMO &amp; AI Ecosystem</div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800">
            {(['store', 'orders', 'pricing', 'tools'] as TabKey[]).map((id) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
                {id === 'store' ? 'Gian hàng' : id === 'orders' ? 'Lịch sử đơn' : id === 'pricing' ? 'Bảng giá CTV' : '2FA & API'}
              </button>
            ))}
            {user?.role === 'ADMIN' && (
              <button onClick={() => setActiveTab('admin')} className={`px-3.5 py-1.5 rounded-lg text-sm font-medium text-amber-400 ${activeTab === 'admin' ? 'bg-amber-500/15' : ''}`}>
                Admin Panel
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {!authLoaded ? (
              <div className="w-28 h-9 rounded-xl bg-slate-800/60 animate-pulse" />
            ) : user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold">{user.role}</span>
                  <span className="text-xs text-slate-300 font-medium">{user.username}</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{fmt(wallet)}</span>
                </div>
                <button onClick={() => setShowDepositModal(true)} className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm">
                  + Nạp VietQR
                </button>
                <button onClick={handleLogout} className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold">
                  Thoát
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition">
                  Đăng nhập
                </Link>
                <Link href="/register" className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs sm:text-sm transition">
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'store' && (
          <section className="space-y-8">
            <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 grid lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-8 space-y-3">
                <h1 className="text-3xl sm:text-4xl font-extrabold">Kho Tài Nguyên <span className="text-emerald-400">MMO &amp; AI Thế Hệ Mới</span></h1>
                <p className="text-slate-400 text-sm">Cung cấp Via Facebook, Gmail Cổ, Tài khoản AI, Proxy sạch. Xuất kho tự động 24/7, nạp SePay 3s.</p>
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Đơn thành công</div>
                  <div className="text-xl font-bold font-mono mt-1">148,920+</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xs text-slate-400">Tồn kho Live</div>
                  <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{totalStock.toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.key} onClick={() => setActiveCategory(c.key)} className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border ${activeCategory === c.key ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2.5">
                <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm sản phẩm (Ctrl+K)..." className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-emerald-500" />
                <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
                  {viewMode === 'table' ? 'Xem Lưới' : 'Xem Bảng'}
                </button>
              </div>
            </div>

            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/90 text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-4">Sản phẩm</th>
                      <th className="p-4 text-center">Bảo hành</th>
                      <th className="p-4 text-center">Tồn kho</th>
                      <th className="p-4 text-right">Đơn giá</th>
                      <th className="p-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-900/50">
                        <td className="p-4 font-semibold">{p.name}</td>
                        <td className="p-4 text-center text-xs text-cyan-300">{p.warranty}</td>
                        <td className="p-4 text-center font-mono font-bold text-emerald-400">{p.stock}</td>
                        <td className="p-4 text-right font-mono font-bold">{fmt(p.price)}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => openBuyModal(p)} className="px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">Mua ngay</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'orders' && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Lịch Sử Mua Hàng</h2>
            {orders.length === 0 ? <div className="glass-panel p-8 rounded-2xl text-slate-400 text-center">Chưa có đơn hàng nào.</div> : orders.map((o) => (
              <div key={o.code} className="glass-panel p-5 rounded-2xl space-y-2">
                <div className="flex justify-between text-sm"><span className="font-bold">{o.code} - {o.product}</span><span className="text-emerald-400 font-mono">{fmt(o.total)}</span></div>
                <pre className="bg-slate-950 p-3 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">{o.data}</pre>
                <button onClick={() => downloadTxt(o.data)} className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold">Tải .TXT</button>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'pricing' && (
          <section className="grid md:grid-cols-4 gap-4">
            {[{ n: 'Thành Viên', d: '0%' }, { n: 'Cộng Tác Viên', d: '-5%' }, { n: 'Đại Lý VIP', d: '-12%' }, { n: 'Tổng Kho', d: '-20%' }].map((t) => (
              <div key={t.n} className="glass-panel p-6 rounded-2xl space-y-3">
                <h3 className="text-lg font-bold">{t.n}</h3>
                <div className="text-3xl font-mono font-extrabold text-emerald-400">{t.d}</div>
                <button onClick={() => user ? setShowDepositModal(true) : showToast('Vui lòng đăng nhập trước!')} className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Nạp nâng cấp</button>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'tools' && (
          <section className="grid lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg">Lấy Mã 2FA Live</h3>
              <input value={totpSecret} onChange={(e) => setTotpSecret(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-sm" />
              <div className="p-4 rounded-xl bg-slate-950 flex justify-between items-center">
                <span className="text-2xl font-mono font-bold text-emerald-400">{totpCode}</span>
                <span className="font-mono text-cyan-400">{totpTimer}s</span>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-lg">API Reseller</h3>
              <div className="flex gap-2">
                {(['curl', 'node', 'python'] as ApiLang[]).map((l) => (
                  <button key={l} onClick={() => setApiLang(l)} className={`px-3 py-1 rounded-lg text-xs font-mono ${apiLang === l ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800'}`}>{l}</button>
                ))}
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto">{API_SNIPPETS[apiLang]}</pre>
            </div>
          </section>
        )}

        {activeTab === 'admin' && user?.role === 'ADMIN' && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold">Admin Dashboard — Doanh thu: <span className="text-emerald-400">{fmt(totalRevenue)}</span></h2>
            <div className="glass-panel p-6 rounded-2xl grid sm:grid-cols-5 gap-3">
              <input value={admName} onChange={(e) => setAdmName(e.target.value)} placeholder="Tên sản phẩm..." className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm" />
              <select value={admCat} onChange={(e) => setAdmCat(e.target.value as Exclude<CategoryKey, 'ALL'>)} className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm">
                <option value="AI">AI</option><option value="FB">FB</option><option value="MAIL">MAIL</option><option value="PROXY">PROXY</option>
              </select>
              <input type="number" value={admPrice} onChange={(e) => setAdmPrice(e.target.value)} placeholder="Giá" className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm" />
              <input type="number" value={admStock} onChange={(e) => setAdmStock(e.target.value)} placeholder="Kho" className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm" />
              <button onClick={handleAdminAddProduct} className="sm:col-span-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm">+ Đăng bán ngay</button>
            </div>
          </section>
        )}
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between"><h3 className="font-bold">{selectedProduct.name}</h3><button onClick={() => setSelectedProduct(null)}>&times;</button></div>
            {!purchasedResult ? (
              <div className="space-y-3">
                <input type="number" min={1} value={buyQty} onChange={(e) => setBuyQty(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono" />
                <div className="flex gap-2">
                  <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Mã giảm giá (VANHUNG10)" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm" />
                  <button onClick={handleApplyPromo} className="px-3 rounded-xl bg-slate-800 text-xs">Áp dụng</button>
                </div>
                <button disabled={isProcessingBuy} onClick={handleConfirmPurchase} className="w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm">
                  {isProcessingBuy ? 'Đang xuất kho...' : `Thanh toán ${fmt(Math.round(buyQty * selectedProduct.price * (1 - activeDiscount)))}`}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea rows={5} readOnly value={purchasedResult} className="w-full bg-slate-950 rounded-xl p-3 font-mono text-xs text-emerald-300" />
                <button onClick={() => copyText(purchasedResult)} className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Sao chép tất cả</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showDepositModal && user && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between"><h3 className="font-bold">Nạp Tiền Tự Động (SePay VietQR)</h3><button onClick={() => setShowDepositModal(false)}>&times;</button></div>
            <div className="p-4 rounded-xl bg-slate-900 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">Nội dung chuyển khoản riêng của bạn</div>
                <div className="font-mono text-emerald-400 font-bold text-lg">{user.depositCode}</div>
              </div>
              <button onClick={() => copyText(user.depositCode)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-semibold">Copy</button>
            </div>
            <p className="text-xs text-slate-400">Chuyển khoản đúng nội dung trên, SePay sẽ tự động cộng tiền vào tài khoản trong 3 giây.</p>
          </div>
        </div>
      )}

      {toastMsg && <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm">{toastMsg}</div>}
    </div>
  );
}
