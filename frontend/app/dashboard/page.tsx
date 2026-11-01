'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, TrendingUp, Receipt, Package, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { getStats, getBills, type BillData } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function DashboardPage() {
  const [stats, setStats] = useState<{
    todaySales: number
    totalBills: number
    topProducts: { name: string; count: number }[]
    weekSales: { day: string; amount: number }[]
  } | null>(null)
  const [bills, setBills] = useState<BillData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStats(), getBills(1)])
      .then(([s, b]) => { setStats(s); setBills(b.bills) })
      .finally(() => setLoading(false))
  }, [])

  const maxSale = stats?.weekSales ? Math.max(...stats.weekSales.map((d) => d.amount), 1) : 1

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/" className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <h1 className="font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: IndianRupee, label: "Today's Sales", value: formatCurrency(stats?.todaySales || 0), color: 'text-primary', bg: 'bg-primary-light' },
                { icon: Receipt, label: 'Total Bills', value: String(stats?.totalBills || 0), color: 'text-blue-600', bg: 'bg-blue-100' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className={color} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Week chart */}
            {stats?.weekSales && stats.weekSales.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-800 text-sm mb-4">This Week</h3>
                <div className="flex items-end gap-2 h-24">
                  {stats.weekSales.map((d) => (
                    <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                        style={{ height: `${Math.max(8, (d.amount / maxSale) * 80)}px` }}
                      >
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md"
                          style={{ height: '100%' }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 font-medium">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top products */}
            {stats?.topProducts && stats.topProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={16} className="text-amber-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">Top Products Today</h3>
                </div>
                <div className="space-y-2.5">
                  {stats.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-primary/10 text-primary text-xs rounded-full flex items-center justify-center font-bold flex-none">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 flex-1 truncate">{p.name}</span>
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {p.count} sold
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent bills */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">Recent Bills</h3>
                <span className="text-xs text-gray-400">{bills.length} shown</span>
              </div>
              {bills.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No bills yet today</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {bills.map((bill) => (
                    <div key={bill.billNumber} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 font-mono">{bill.billNumber}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDate(bill.createdAt)} •{' '}
                          <span className={`font-medium ${bill.paymentMethod === 'upi' ? 'text-blue-500' : 'text-green-600'}`}>
                            {bill.paymentMethod.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <p className="font-bold text-primary ml-3">{formatCurrency(bill.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
