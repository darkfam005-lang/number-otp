import React, { useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Smartphone, 
  Globe2,
  Percent,
  Layers
} from 'lucide-react';
import { LamixMessage, LamixConfig, SupportedLanguage } from '../../types/lamix';
import { getTranslation } from '../../utils/translations';

interface AnalyticsTabProps {
  messages: LamixMessage[];
  config: LamixConfig;
  language: SupportedLanguage;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  messages,
  config,
  language,
}) => {
  const t = getTranslation(language);

  // Computed metrics
  const stats = useMemo(() => {
    const total = messages.length;
    const delivered = messages.filter((m) => m.status === 'delivered').length;
    const pending = messages.filter((m) => m.status === 'pending').length;
    const failed = messages.filter((m) => m.status === 'failed').length;
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    
    // Total estimated earnings
    const totalEarnings = (delivered * config.ratePerSms).toFixed(2);

    // SIM breakdown
    const sim1 = messages.filter((m) => (m.sim || 1) === 1).length;
    const sim2 = messages.filter((m) => m.sim === 2).length;

    // Sender breakdown
    const senderMap: Record<string, number> = {};
    messages.forEach((m) => {
      const s = m.sender || 'Other';
      senderMap[s] = (senderMap[s] || 0) + 1;
    });
    const topSenders = Object.entries(senderMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Country breakdown
    const countryMap: Record<string, number> = {};
    messages.forEach((m) => {
      const c = m.country || 'Bangladesh';
      countryMap[c] = (countryMap[c] || 0) + 1;
    });
    const topCountries = Object.entries(countryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Hourly volume buckets (last 12 hours)
    const hourBuckets: Array<{ hour: string; count: number }> = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const targetTime = new Date(now.getTime() - i * 3600 * 1000);
      const hourLabel = targetTime.getHours() + ':00';
      // filter messages within this hour
      const count = messages.filter((m) => {
        const msgTime = new Date(m.timestamp);
        return (
          msgTime.getHours() === targetTime.getHours() &&
          Math.abs(now.getTime() - msgTime.getTime()) < 24 * 3600 * 1000
        );
      }).length;
      hourBuckets.push({ hour: hourLabel, count });
    }

    const maxHourlyCount = Math.max(...hourBuckets.map((b) => b.count), 1);

    return {
      total,
      delivered,
      pending,
      failed,
      successRate,
      totalEarnings,
      sim1,
      sim2,
      topSenders,
      topCountries,
      hourBuckets,
      maxHourlyCount,
    };
  }, [messages, config.ratePerSms]);

  return (
    <div className="space-y-4 pb-20">
      {/* Overview Heading */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <span>{t.overviewTitle}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {language === 'bn' 
            ? 'আপনার ল্যামিক্স রাউটিং থেকে লাইভ এসএমএস ভলিউম ও অর্জিত রেভিনিউ' 
            : 'Live SMS volume, delivery statistics, and payout metrics'}
        </p>
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Total Delivered */}
        <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.totalDelivered}</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.delivered}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <span>{stats.successRate}% Success</span>
          </div>
        </div>

        {/* Estimated Earnings */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 p-3.5 rounded-2xl border border-cyan-500/30 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.estEarnings}</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {config.currency === 'BDT' ? '৳' : '$'}{stats.totalEarnings}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            @{config.currency === 'BDT' ? '৳' : '$'}{config.ratePerSms}/SMS
          </div>
        </div>

        {/* Total Processed */}
        <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.totalRecords}</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.pending} pending • {stats.failed} failed
          </div>
        </div>

        {/* Dual SIM Split */}
        <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t.simDistribution}</span>
            <Smartphone className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-white font-mono mt-1">
            SIM 1: <span className="text-cyan-400">{stats.sim1}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            SIM 2: <span className="text-indigo-400">{stats.sim2}</span>
          </div>
        </div>
      </div>

      {/* Hourly Traffic Bar Chart */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.hourlyVolume}</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Past 12h</span>
        </div>

        <div className="pt-2 flex items-end gap-1.5 h-32 px-1">
          {stats.hourBuckets.map((bucket, idx) => {
            const heightPercent = Math.max(12, Math.round((bucket.count / stats.maxHourlyCount) * 100));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  {bucket.count}
                </span>
                <div className="w-full bg-slate-950 rounded-lg p-0.5 h-full flex flex-col justify-end">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full rounded-md bg-gradient-to-t from-cyan-600 to-sky-400 group-hover:from-cyan-400 group-hover:to-cyan-200 transition-all duration-300 shadow-sm"
                  />
                </div>
                <span className="text-[8px] font-mono text-slate-500 truncate w-full text-center">
                  {bucket.hour.split(':')[0]}h
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Senders Breakdown */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.topSenders}</span>
        </h3>

        {stats.topSenders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">No traffic recorded yet</p>
        ) : (
          <div className="space-y-2.5">
            {stats.topSenders.map(([sender, count]) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={sender} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white tracking-wide">{sender}</span>
                    <span className="font-mono text-slate-300">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Country Breakdown */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.topCountries}</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {stats.topCountries.map(([country, count]) => (
            <div key={country} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200 truncate">{country}</span>
              <span className="text-xs font-bold font-mono text-cyan-400 ml-2">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
