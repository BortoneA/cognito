import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, ReferenceLine
} from 'recharts';
import { useUserProgress } from '../context/UserProgressContext';

// Build weekly accuracy data from answers
const buildWeeklyData = (answers = {}) => {
  if (Object.keys(answers).length === 0) return [];

  const weekMap = {};

  Object.values(answers).forEach(ans => {
    const date = new Date(ans.timestamp);
    if (isNaN(date.getTime())) return;

    // Get ISO week string e.g. "2024-W12"
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const weekNo = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const key = `${year}-W${String(weekNo).padStart(2, '0')}`;

    if (!weekMap[key]) weekMap[key] = { week: key, correct: 0, total: 0 };
    weekMap[key].total += 1;
    if (ans.isCorrect) weekMap[key].correct += 1;
  });

  return Object.values(weekMap)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-16) // last 16 weeks
    .map(w => ({
      week: w.week.replace(/^\d{4}-/, ''),
      accuracy: w.total > 0 ? Math.round((w.correct / w.total) * 100) : 0,
      answered: w.total,
      correct: w.correct,
    }));
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="apple-glass p-3 rounded-2xl border border-white/10 text-xs space-y-1 min-w-[130px]">
      <p className="font-bold text-white border-b border-white/10 pb-1">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-400">Acurácia:</span>
        <span className="font-extrabold text-indigo-300">{d.accuracy}%</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-400">Respondidas:</span>
        <span className="font-bold text-white">{d.answered}</span>
      </div>
    </div>
  );
};

const ProgressTimeline = () => {
  const { progress } = useUserProgress();
  const data = useMemo(() => buildWeeklyData(progress.answers || {}), [progress.answers]);

  if (data.length < 2) {
    return (
      <div className="rounded-3xl apple-card border border-white/10 p-6 flex flex-col items-center justify-center gap-3 min-h-[180px]">
        <Activity className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-400 text-center">
          Responda questões ao longo das semanas para ver sua curva de evolução aqui.
        </p>
      </div>
    );
  }

  const lastTwo = data.slice(-2);
  const trend = lastTwo.length === 2 ? lastTwo[1].accuracy - lastTwo[0].accuracy : 0;
  const avgAccuracy = Math.round(data.reduce((s, d) => s + d.accuracy, 0) / data.length);

  return (
    <div className="rounded-3xl apple-card border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-white">Evolução Semanal de Acurácia</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Últimas {data.length} semanas de estudo</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Média: <strong className="text-white">{avgAccuracy}%</strong></span>
          {trend > 0 && <TrendingUp className="w-4 h-4 text-emerald-400" />}
          {trend < 0 && <TrendingDown className="w-4 h-4 text-rose-400" />}
          {trend === 0 && <Minus className="w-4 h-4 text-slate-400" />}
          <span className={`text-xs font-bold ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="timelineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Meta 70%', fill: '#f59e0b', fontSize: 9, position: 'right' }} />
          <Area type="monotone" dataKey="accuracy" stroke="#6366f1" strokeWidth={2.5} fill="url(#timelineGrad)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#818cf8' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressTimeline;
