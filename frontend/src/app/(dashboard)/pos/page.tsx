"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  Pill,
  CreditCard,
  Banknote,
  RotateCcw,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchMedicines, formatMoney, piastresToPounds, type Medicine } from "@/lib/medicines";

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export default function POSPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  useEffect(() => {
    // Initial fetch of active medicines
    fetchMedicines({ status: "active", pageSize: 30 })
      .then((res) => setMedicines(res.items))
      .catch(console.error);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    try {
      const res = await fetchMedicines({ q: query || undefined, status: "active", pageSize: 20 });
      setMedicines(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (med: Medicine) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.medicine.id === med.id);
      if (exists) {
        return prev.map((item) =>
          item.medicine.id === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine: med, quantity: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === id) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== id));
  };

  const subtotalPiastres = cart.reduce(
    (sum, item) => sum + item.medicine.salePrice * item.quantity,
    0
  );
  const discountPiastres = Math.round(discount * 100);
  const totalPiastres = Math.max(0, subtotalPiastres - discountPiastres);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCart([]);
      setDiscount(0);
      setCheckoutSuccess(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="نقطة البيع (POS)"
        description="صرف وإصدار فواتير بيع الأدوية للعملاء بسرعة وسهولة"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Medicine Selector (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-[#DCE6E1] shadow-sm">
            <div className="relative">
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="امسح الباركود أو ابحث باسم الدواء..."
                className="w-full py-2.5 pr-10 pl-4 rounded-xl border border-[#DCE6E1] text-sm focus:border-[#20C997] outline-none"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#DCE6E1] shadow-sm">
            <h3 className="text-sm font-bold text-[#064E49] mb-3">قائمة الأصناف المتاحة للبيع</h3>
            {loading ? (
              <p className="text-center py-8 text-xs text-[#64748B]">جاري البحث...</p>
            ) : medicines.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#64748B]">
                لا توجد أدوية مطابقة. يمكنك إضافتها من صفحة الأدوية.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {medicines.map((med) => (
                  <div
                    key={med.id}
                    onClick={() => addToCart(med)}
                    className="p-3 rounded-xl border border-[#DCE6E1] hover:border-[#20C997] hover:bg-[#F5F8F7] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-xs text-[#172B24] block">{med.name}</span>
                      <span className="text-[11px] text-[#64748B] block">
                        {med.dosageForm} {med.strength ? `(${med.strength})` : ""}
                      </span>
                      <span className="text-[11px] font-mono text-[#064E49] mt-1 block">
                        باركود: {med.barcode || "—"}
                      </span>
                    </div>
                    <div className="text-left flex flex-col items-end">
                      <span className="font-bold text-sm text-[#087F68]">
                        {formatMoney(med.salePrice)}
                      </span>
                      <button
                        type="button"
                        className="mt-1 px-2.5 py-1 rounded-lg bg-[#E6F4F1] hover:bg-[#087F68] hover:text-white text-[11px] font-bold text-[#087F68] transition-colors border-none cursor-pointer flex items-center gap-1"
                      >
                        <Plus size={12} />
                        إضافة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Invoice / Cart Panel (1 Column) */}
        <div className="bg-white p-5 rounded-2xl border border-[#DCE6E1] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#DCE6E1]">
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-[#087F68]" />
              <h3 className="font-bold text-sm text-[#172B24] m-0">فاتورة البيع الحالية</h3>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-red-600 hover:underline bg-transparent border-none cursor-pointer"
              >
                تفريغ الفاتورة
              </button>
            )}
          </div>

          {checkoutSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
              <span>تم تسجيل الفاتورة بنجاح وطباعة الإيصال!</span>
            </div>
          )}

          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#64748B]">
              <ShoppingCart size={32} className="mx-auto mb-2 text-[#64748B]/30" />
              <p className="text-xs m-0">الفاتورة فارغة. اضغط على أي صنف لإضافته.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.medicine.id}
                  className="p-2.5 rounded-xl bg-[#F5F8F7] border border-[#DCE6E1] flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-[#172B24] truncate block">{item.medicine.name}</span>
                    <span className="text-[#64748B] text-[11px]">
                      {formatMoney(item.medicine.salePrice)} × {item.quantity}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.medicine.id, -1)}
                      className="w-6 h-6 rounded-md bg-white border border-[#DCE6E1] flex items-center justify-center text-[#172B24] cursor-pointer hover:bg-gray-100"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.medicine.id, 1)}
                      className="w-6 h-6 rounded-md bg-white border border-[#DCE6E1] flex items-center justify-center text-[#172B24] cursor-pointer hover:bg-gray-100"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.medicine.id)}
                      className="p-1 text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pricing Totals */}
          <div className="pt-3 border-t border-[#DCE6E1] space-y-2 text-xs">
            <div className="flex justify-between text-[#64748B]">
              <span>المجموع الفرعي:</span>
              <span className="font-semibold text-[#172B24]">{formatMoney(subtotalPiastres)}</span>
            </div>

            <div className="flex items-center justify-between text-[#64748B]">
              <span>الخصم (ج.م):</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="w-20 py-1 px-2 rounded-lg border border-[#DCE6E1] text-xs text-left"
              />
            </div>

            <div className="flex justify-between text-base font-bold text-[#064E49] pt-2 border-t border-[#DCE6E1]">
              <span>الإجمالي المستحق:</span>
              <span>{formatMoney(totalPiastres)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-3 rounded-xl bg-[#087F68] hover:bg-[#066653] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <Banknote size={18} />
            <span>تأكيد وطباعة الفاتورة</span>
          </button>
        </div>
      </div>
    </div>
  );
}
