'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, TrendingUp, TrendingDown, Banknote, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/lib/stores/auth-store';
import { listTenantResource } from '@/lib/api/tenant';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

export default function FinancialReportPage() {
  const { company, token } = useAuthStore();
  const [period, setPeriod] = useState('this_month');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const currency = company?.currencySymbol || 'TSH';

  useEffect(() => {
    if (!token) return;
    Promise.all([
      listTenantResource<any>('transactions', token),
      listTenantResource<any>('debts', token),
      listTenantResource<any>('staff_salaries', token),
      listTenantResource<any>('expenditures', token),
    ])
      .then(([tx, dbt, sal, exp]) => {
        setTransactions(tx || []);
        setDebts(dbt || []);
        setSalaries(sal || []);
        setExpenditures(exp || []);
      })
      .catch(() => {
        setTransactions([]);
        setDebts([]);
        setSalaries([]);
        setExpenditures([]);
      });
  }, [token]);

  const getStart = () => {
    const now = new Date();
    const s = new Date();
    if (period === 'today') s.setHours(0, 0, 0, 0);
    else if (period === 'this_week') { s.setDate(now.getDate() - now.getDay()); s.setHours(0, 0, 0, 0); }
    else if (period === 'this_month') { s.setDate(1); s.setHours(0, 0, 0, 0); }
    else if (period === 'this_year') { s.setMonth(0, 1); s.setHours(0, 0, 0, 0); }
    return s;
  };

  const start = getStart();
  const filteredSales = useMemo(
    () => transactions.filter(t => t.type === 'sale' && new Date(t.created_at) >= start),
    [transactions, start]
  );
  const filteredReturns = useMemo(
    () => transactions.filter(t => t.type === 'return' && new Date(t.created_at) >= start),
    [transactions, start]
  );
  const filteredSalaries = useMemo(
    () => salaries.filter(s => new Date(s.payment_date) >= start),
    [salaries, start]
  );
  const filteredExpenditures = useMemo(
    () => expenditures.filter(e => new Date(e.date) >= start),
    [expenditures, start]
  );

  const revenue = filteredSales.reduce((s, t) => s + Number(t.total || 0), 0);
  const returnAmount = filteredReturns.reduce((s, t) => s + Number(t.total || 0), 0);
  const netRevenue = revenue - returnAmount;
  const cogs = filteredSales.reduce(
    (s, t) =>
      s +
      (t.items || []).reduce(
        (is: number, i: any) => is + Number(i.costPrice ?? i.cost_price ?? 0) * Number(i.quantity ?? 0),
        0
      ),
    0
  );
  const salaryTotal = filteredSalaries.reduce((s, row) => s + Number(row.amount || 0), 0);
  const expenditureTotal = filteredExpenditures.reduce((s, row) => s + Number(row.amount || 0), 0);
  const operatingExpenses = salaryTotal + expenditureTotal;
  const grossProfit = netRevenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  const totalReceivables = debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s, d) => s + Number(d.remaining_amount || 0), 0);
  const totalPayables = debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s, d) => s + Number(d.remaining_amount || 0), 0);
  const moneyIn = filteredSales.reduce((s, t) => s + Number(t.amount_paid || 0), 0);
  const moneyOut = operatingExpenses;
  const cashFlow = moneyIn - moneyOut;

  const monthlyData: { month: string; revenue: number; profit: number; expenses: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const monthSales = transactions.filter(t => {
      const td = new Date(t.created_at);
      return t.type === 'sale' && td >= monthStart && td < monthEnd;
    });
    const monthReturns = transactions.filter(t => {
      const td = new Date(t.created_at);
      return t.type === 'return' && td >= monthStart && td < monthEnd;
    });
    const monthSalaries = salaries.filter(s => {
      const sd = new Date(s.payment_date);
      return sd >= monthStart && sd < monthEnd;
    });
    const monthExpenditures = expenditures.filter(e => {
      const ed = new Date(e.date);
      return ed >= monthStart && ed < monthEnd;
    });
    const mRevenue = monthSales.reduce((s, t) => s + Number(t.total || 0), 0);
    const mReturns = monthReturns.reduce((s, t) => s + Number(t.total || 0), 0);
    const mCogs = monthSales.reduce(
      (s, t) =>
        s +
        (t.items || []).reduce((is: number, i: any) => {
          const unitCost = Number(i.costPrice ?? i.cost_price ?? 0);
          const qty = Number(i.quantity ?? 0);
          return is + unitCost * qty;
        }, 0),
      0
    );
    const mExpenses = monthSalaries.reduce((s, row) => s + Number(row.amount || 0), 0) + monthExpenditures.reduce((s, row) => s + Number(row.amount || 0), 0);
    monthlyData.push({
      month: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenue: mRevenue - mReturns,
      profit: mRevenue - mReturns - mCogs - mExpenses,
      expenses: mExpenses,
    });
  }

  const expenseBreakdown = [
    { name: 'Salaries', value: salaryTotal },
    { name: 'Other Expenses', value: expenditureTotal },
    { name: 'COGS', value: cogs },
  ].filter(i => i.value > 0);
  const expenseColors = ['#2563eb', '#dc2626', '#f59e0b'];

  const insights = [
    cashFlow < 0 ? 'Cash out is higher than cash in for this period.' : 'Cash flow is positive for this period.',
    netProfit < 0 ? 'Net profit is negative. Reduce costs or improve margin.' : 'Net profit is positive.',
    netRevenue > 0 && salaryTotal / netRevenue >= 0.4 ? 'Salaries are above 40% of revenue.' : 'Salary-to-revenue ratio is within normal range.',
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Report</h1>
          <p className="text-primary-foreground/80">Profit & loss, cash flow, and financial summary</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary"><Download className="mr-2 size-4" />Export</Button>
        </div>
      </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Revenue</CardTitle><Banknote className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{currency}{netRevenue.toFixed(2)}</div><p className="text-xs text-muted-foreground">After {currency}{returnAmount.toFixed(2)} returns</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle><TrendingUp className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{currency}{netProfit.toFixed(2)}</div><p className="text-xs text-muted-foreground">{grossMargin.toFixed(1)}% gross margin</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Receivables</CardTitle><CreditCard className="size-4 text-green-600" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{currency}{totalReceivables.toFixed(2)}</div><p className="text-xs text-muted-foreground">Owed to you</p></CardContent></Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Cash Movement (Cash Flow)</CardTitle>
            <TrendingDown className="size-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${cashFlow >= 0 ? 'text-green-600' : 'text-destructive'}`}>{currency}{cashFlow.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Money in from sales paid ({currency}{moneyIn.toFixed(2)}) minus money out to salaries/expenses ({currency}{moneyOut.toFixed(2)})</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>P&L Summary</CardTitle><CardDescription>Profit and loss breakdown</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Gross Revenue', value: revenue, color: 'text-foreground' },
              { label: 'Returns & Refunds', value: -returnAmount, color: 'text-destructive' },
              { label: 'Net Revenue', value: netRevenue, color: 'text-foreground font-bold border-t pt-2' },
              { label: 'Cost of Goods Sold', value: -cogs, color: 'text-destructive' },
                { label: 'Salaries', value: -salaryTotal, color: 'text-destructive' },
                { label: 'Expenditures', value: -expenditureTotal, color: 'text-destructive' },
                { label: 'Net Profit', value: netProfit, color: netProfit >= 0 ? 'text-green-600 font-bold border-t pt-2' : 'text-destructive font-bold border-t pt-2' },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between text-sm ${row.color}`}>
                <span>{row.label}</span>
                <span>{currency}{Math.abs(row.value).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly Trend</CardTitle><CardDescription>Revenue, profit and expense over last 6 months</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Expense Breakdown</CardTitle><CardDescription>Where your money goes</CardDescription></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                  {expenseBreakdown.map((_, index) => <Cell key={index} fill={expenseColors[index % expenseColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Smart Insights</CardTitle><CardDescription>Decision support from current period</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {insights.map((item, idx) => (
              <div key={idx} className="rounded-md border p-3 text-sm">{item}</div>
            ))}
            <div className="rounded-md bg-muted p-3 text-sm">
              Outstanding payable: <span className="font-semibold">{currency}{totalPayables.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
