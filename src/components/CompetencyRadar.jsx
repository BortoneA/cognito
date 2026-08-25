import React, { useMemo, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Crosshair } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { getAreaAnalytics } from '../utils/analyticsHelpers';

const GOAL_LINE = 70;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="apple-glass p-3 rounded-2xl border border-white/10 text-xs space-y-1 min-w-[160px]">
      <p className="font-bold text-white border-b border-white/10 pb-1">{d.area}</p>
      <div className="flex justify-between gap-3">
        <span className="text-slate-400">Sua Acurácia:</span>
        <span className="font-extrabold text-indigo-300">{d.accuracy}%</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-slate-400">Questões:</span>
        <span className="font-bold text-white">{d.answered} resp.</span>
      </div>
    </div>
  );
};

const CompetencyRadar = () => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const [showAll, setShowAll] = useState(false);

  const areaStats = useMemo(() => getAreaAnalytics(questions, progress.answers || {}), [questions, progress.answers]);

  const radarData = useMemo(() => {
    const filtered = showAll ? areaStats : areaStats.filter(a => a.answered > 0);
    return filtered.slice(0, 15).map(a => ({
      area: a.area.split(' ')[0].replace(',', ''), // short label
      fullArea: a.area,
      accuracy: a.accuracyPct,
      answered: a.answered,
      goal: GOAL_LINE,
    }));
  }, [areaStats, showAll]);

  if (radarData.length === 0) {
    return (
      <div className="rounded-3xl apple-card border border-white/10 p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
        <Crosshair className="w-8 h-8 text-slate-600" />
        <p className="text-sm text-slate-400 text-center">
          Responda questões de diferentes áreas para visualizar o radar de competências.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl apple-card border border-white/10 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-white">Radar de Competências</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Perfil clínico por área médica</p>
        </div>
        <button
          onClick={() => setShowAll(p => !p)}
          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
        >
          {showAll ? 'Apenas respondidas' : 'Todas as áreas'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="area" tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#475569', fontSize: 8 }} tickCount={4} />
          <Tooltip content={<CustomTooltip />} />
          <Radar name="Meta 70%" dataKey="goal" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" dot={false} />
          <Radar name="Sua Acurácia" dataKey="accuracy" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.2} dot={{ fill: '#6366f1', r: 2 }} />
          <Legend wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetencyRadar;
