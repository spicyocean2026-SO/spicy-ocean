"use client";

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'lucide-react';
import { useRestaurant, TableOrder } from '@/context/RestaurantContext';

interface BillModalProps {
  order: TableOrder;
  invoiceNumber: string;
  onClose: () => void;
}

const BillModal: React.FC<BillModalProps> = ({ order, invoiceNumber, onClose }) => {
  const { settings } = useRestaurant();
  const billRef = useRef<HTMLDivElement>(null);

  const subtotal = order.items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);
  const grandTotal = subtotal;
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const now = new Date();
  const logoUrl = new URL('/logo.png', window.location.origin).href;

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=350,height=600');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Bill ${invoiceNumber}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Courier New', ui-monospace, monospace; font-size:12px; padding:10px; max-width:300px; margin:0 auto; color:#000; background:#fff; }
.center { text-align:center; }
.right { text-align:right; }
.bold { font-weight:bold; }
.line { border-top:1px dashed #000; margin:8px 0; }
.logo { width:80px; height:80px; object-fit:contain; margin:0 auto 6px; display:block; }
h1 { font-size:20px; letter-spacing:1px; margin:2px 0; }
.tag { font-size:10px; margin-bottom:4px; }
table { width:100%; border-collapse:collapse; font-size:12px; }
td { padding:3px 0; vertical-align:top; }
.grand { font-size:15px; padding:6px 0; border-top:1px dashed #000; border-bottom:1px dashed #000; margin-top:4px; }
.footer { margin-top:12px; text-align:center; font-size:11px; line-height:1.5; }
.inv { display:inline-block; border:1px solid #000; padding:2px 8px; font-weight:bold; margin:4px 0; }
@media print { body { padding:0; } }
</style></head><body>
<div class="center">
  <img src="${logoUrl}" class="logo" alt="logo" />
  <h1>SPICY OCEAN</h1>
  <div class="tag">Biggest Open Kitchen on Beach Road 🌊</div>
  ${settings.gstNumber ? `<div class="tag">GST: ${settings.gstNumber}</div>` : ''}
  <div class="inv">Invoice #${invoiceNumber}</div>
</div>
<div class="line"></div>
<table>
  <tr><td>Date</td><td class="right">${now.toLocaleDateString()}</td></tr>
  <tr><td>Time</td><td class="right">${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td></tr>
</table>
<div class="line"></div>
<table>
  <tr class="bold"><td>Item</td><td class="right">Qty</td><td class="right">Price</td><td class="right">Total</td></tr>
  ${order.items.map(i => `<tr><td>${i.menuItem.name}</td><td class="right">${i.quantity}</td><td class="right">${i.menuItem.price}</td><td class="right">${i.menuItem.price * i.quantity}</td></tr>`).join('')}
</table>
<div class="line"></div>
<table>
  <tr><td>Total Items</td><td class="right">${itemCount}</td></tr>
  <tr><td>Subtotal</td><td class="right">₹${subtotal}</td></tr>
</table>
<table class="grand bold">
  <tr><td>GRAND TOTAL</td><td class="right">₹${grandTotal}</td></tr>
</table>
<div class="footer">
  <div>Thank You for Dining with Spicy Ocean 🌊</div>
  <div>Visit Again for Fresh Seafood & Tea</div>
</div>
<script>window.onload=()=>{setTimeout(()=>window.print(),300);}</script>
</body></html>`);
    w.document.close();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-neutral-200 bg-neutral-50">
            <h3 className="font-bold text-neutral-900 text-sm">Receipt Preview</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-200">
              <X className="w-4 h-4 text-neutral-700" />
            </button>
          </div>

          <div ref={billRef} className="p-5 font-mono text-[12px] text-black bg-white">
            <div className="text-center">
              <img src="/logo.png" alt="Spicy Ocean" className="w-20 h-20 object-contain mx-auto mb-1" />
              <h2 className="text-xl font-bold tracking-wider">SPICY OCEAN</h2>
              <p className="text-[10px]">Biggest Open Kitchen on Beach Road 🌊</p>
              {settings.gstNumber && <p className="text-[10px]">GST: {settings.gstNumber}</p>}
              <div className="inline-block border border-black px-2 py-0.5 mt-2 font-bold text-[11px]">
                Invoice #{invoiceNumber}
              </div>
            </div>

            <div className="border-t border-dashed border-black my-2" />

            <div className="flex justify-between"><span>Date</span><span>{now.toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Time</span><span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>

            <div className="border-t border-dashed border-black my-2" />

            <div className="grid grid-cols-12 gap-1 font-bold">
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-3 text-right">Total</span>
            </div>
            {order.items.map(item => (
              <div key={item.menuItem.id} className="grid grid-cols-12 gap-1 py-0.5">
                <span className="col-span-5 truncate">{item.menuItem.name}</span>
                <span className="col-span-2 text-right">{item.quantity}</span>
                <span className="col-span-2 text-right">{item.menuItem.price}</span>
                <span className="col-span-3 text-right">{item.menuItem.price * item.quantity}</span>
              </div>
            ))}

            <div className="border-t border-dashed border-black my-2" />

            <div className="flex justify-between"><span>Total Items</span><span>{itemCount}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>

            <div className="border-y border-dashed border-black mt-2 py-1.5 flex justify-between font-bold text-[15px]">
              <span>GRAND TOTAL</span><span>₹{grandTotal}</span>
            </div>

            <div className="text-center text-[11px] mt-3 leading-relaxed">
              <div>Thank You for Dining with Spicy Ocean 🌊</div>
              <div>Visit Again for Fresh Seafood & Tea</div>
            </div>
          </div>

          <div className="flex gap-2 p-3 border-t border-neutral-200 bg-neutral-50">
            <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-black text-white font-semibold text-sm hover:bg-neutral-800">
              <Printer className="w-4 h-4" /> Print Bill
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BillModal;
