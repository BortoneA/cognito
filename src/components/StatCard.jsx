import React from 'react';

const StatCard = ({ icon: Icon, title, value, subtitle, color = "indigo" }) => {
  const colorSchemes = {
    indigo: {
      bg: "from-indigo-500/10 via-purple-500/5 to-transparent",
      text: "text-indigo-400",
      border: "border-indigo-500/25",
      glow: "group-hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.25)]",
      iconBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
    },
    emerald: {
      bg: "from-emerald-500/10 via-teal-500/5 to-transparent",
      text: "text-emerald-400",
      border: "border-emerald-500/25",
      glow: "group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)]",
      iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
    },
    rose: {
      bg: "from-rose-500/10 via-red-500/5 to-transparent",
      text: "text-rose-400",
      border: "border-rose-500/25",
      glow: "group-hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.25)]",
      iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-300"
    },
    amber: {
      bg: "from-amber-500/10 via-yellow-500/5 to-transparent",
      text: "text-amber-400",
      border: "border-amber-500/25",
      glow: "group-hover:shadow-[0_0_25px_-5px_rgba(245,158,11,0.25)]",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-300"
    }
  };

  const theme = colorSchemes[color] || colorSchemes.indigo;

  return (
    <div className={`group relative overflow-hidden rounded-[24px] p-5 apple-card bg-gradient-to-br ${theme.bg} ${theme.border} transition-all duration-300 hover:scale-[1.02] ${theme.glow}`}>
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{title}</span>
          <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
          {subtitle && (
            <p className="mt-1.5 text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
        </div>

        <div className={`p-3 rounded-2xl border ${theme.iconBg} backdrop-blur-md shadow-inner transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
