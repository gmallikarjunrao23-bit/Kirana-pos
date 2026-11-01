import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function generateBillNumber(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `KP-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(Math.random() * 9000) + 1000}`
}

export function generateUPIString(amount: number, upiId: string, name: string): string {
  return `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=KiranaPOS`
}

export function generateWhatsAppText(
  billNumber: string,
  items: { name: string; quantity: number; price: number }[],
  total: number,
  shopName: string
): string {
  const lines = items
    .map((i) => `• ${i.name} x${i.quantity} = ₹${(i.price * i.quantity).toFixed(2)}`)
    .join('\n')
  const text = `🛒 *${shopName}*\n📋 Bill: ${billNumber}\n\n${lines}\n\n💰 *Total: ₹${total.toFixed(2)}*\n\nThank you for shopping! 🙏`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}
