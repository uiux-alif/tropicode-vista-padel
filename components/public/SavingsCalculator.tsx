"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Plan {
  id: string;
  name: string;
  price: number;
  discountPercent: number;
  billingPeriod: string;
}

// Reference: average court rate used for illustration only
const AVG_RATE_NORMAL = 120000; // IDR / hr
const AVG_RATE_PEAK = 180000; // IDR / hr

export function SavingsCalculator({ plans, courtRates }: { plans: Plan[]; courtRates?: { normal: number; peak: number } }) {
  const [sessionsPerWeek, setSessionsPerWeek] = useState(2);
  const [hoursPerSession, setHoursPerSession] = useState(1);
  const [peakShare, setPeakShare] = useState(50); // % of sessions at peak time
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id ?? "");

  const plan = plans.find((p) => p.id === selectedPlan) ?? plans[0];

  const calc = useMemo(() => {
    if (!plan) return null;

    const sessionsPerMonth = sessionsPerWeek * 4.33;
    const hoursPerMonth = sessionsPerMonth * hoursPerSession;
    const peakFraction = peakShare / 100;
    const normalFraction = 1 - peakFraction;

    const rateNormal = courtRates?.normal ?? AVG_RATE_NORMAL;
    const ratePeak = courtRates?.peak ?? AVG_RATE_PEAK;
    const ratePerHour = rateNormal * normalFraction + ratePeak * peakFraction;
    const monthlySpendNoMember = Math.round(hoursPerMonth * ratePerHour);
    const discountAmount = Math.round(monthlySpendNoMember * plan.discountPercent / 100);
    const monthlySpendWithMember = monthlySpendNoMember - discountAmount;
    const totalWithMember = monthlySpendWithMember + plan.price;
    const netSaving = monthlySpendNoMember - totalWithMember;
    const breakEvenSessions = plan.discountPercent > 0
      ? Math.ceil(plan.price / (ratePerHour * hoursPerSession * (plan.discountPercent / 100)))
      : null;

    return {
      monthlySpendNoMember,
      discountAmount,
      monthlySpendWithMember,
      membershipFee: plan.price,
      totalWithMember,
      netSaving,
      breakEvenSessions,
      isWorthIt: netSaving > 0,
    };
  }, [plan, sessionsPerWeek, hoursPerSession, peakShare, courtRates]);

  return (
    <div className="card p-6">
      <h3 className="mb-4 font-semibold text-ink">Savings Calculator</h3>

      <div className="space-y-4 text-sm">
        {/* Plan selector */}
        <div>
          <label className="label">Plan</label>
          <div className="flex gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={`flex-1 rounded-xl border px-3 py-2 text-center text-sm font-medium transition ${p.id === selectedPlan
                  ? "border-brand bg-brand text-white"
                  : "border-black/10 text-ink/60 hover:border-brand/30"
                  }`}
              >
                {p.name}
                <span className="ml-1 text-xs opacity-70">(-{p.discountPercent}%)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Sessions per week</label>
            <span className="font-semibold text-brand">{sessionsPerWeek}×</span>
          </div>
          <input
            type="range" min={1} max={7} step={1}
            value={sessionsPerWeek}
            onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
            className="mt-1.5 w-full accent-brand"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Hours per session</label>
            <span className="font-semibold text-brand">{hoursPerSession}h</span>
          </div>
          <input
            type="range" min={1} max={3} step={1}
            value={hoursPerSession}
            onChange={(e) => setHoursPerSession(Number(e.target.value))}
            className="mt-1.5 w-full accent-brand"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Peak-time sessions</label>
            <span className="font-semibold text-brand">{peakShare}%</span>
          </div>
          <input
            type="range" min={0} max={100} step={10}
            value={peakShare}
            onChange={(e) => setPeakShare(Number(e.target.value))}
            className="mt-1.5 w-full accent-brand"
          />
        </div>

        {/* Result */}
        {calc && (
          <div className={`mt-1 rounded-xl border p-4 ${calc.isWorthIt ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
            }`}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-ink/60">Monthly spend (no membership)</span>
                <span className="line-through text-ink/40">{formatCurrency(calc.monthlySpendNoMember)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Court discount ({plan?.discountPercent}% off)</span>
                <span>−{formatCurrency(calc.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Courts after discount</span>
                <span className="font-medium text-ink">{formatCurrency(calc.monthlySpendWithMember)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Membership fee</span>
                <span className="font-medium text-ink">+{formatCurrency(calc.membershipFee)}</span>
              </div>
              <div className="my-1 border-t border-black/10" />
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-ink">Total per month</span>
                <span className={calc.isWorthIt ? "text-emerald-600" : "text-amber-600"}>
                  {formatCurrency(calc.totalWithMember)}
                </span>
              </div>
            </div>

            <div className={`mt-3 rounded-lg px-3 py-2 text-center text-sm font-bold ${calc.isWorthIt
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
              }`}>
              {calc.isWorthIt
                ? `🎉 You save ${formatCurrency(calc.netSaving)}/month`
                : `📊 You'd save ${formatCurrency(calc.discountAmount)} in courts — membership costs ${formatCurrency(calc.membershipFee)}`}
            </div>

            {calc.breakEvenSessions !== null && (
              <p className="mt-2 text-center text-xs text-ink/50">
                Break-even at {calc.breakEvenSessions} session{calc.breakEvenSessions !== 1 ? "s" : ""}/month
              </p>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-ink/40">
        * Based on average court rates (Rp {(courtRates?.normal ?? AVG_RATE_NORMAL).toLocaleString("id-ID")} normal / Rp {(courtRates?.peak ?? AVG_RATE_PEAK).toLocaleString("id-ID")} peak). Actual savings depend on your court and time choices.
      </p>
    </div>
  );
}
