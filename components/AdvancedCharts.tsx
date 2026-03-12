import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend
} from 'recharts';

// Mock data for demonstration
const weightData = [
  { date: '01/03', weight: 75.5, target: 73 },
  { date: '04/03', weight: 75.2, target: 73 },
  { date: '07/03', weight: 74.8, target: 73 },
  { date: '10/03', weight: 74.5, target: 73 },
  { date: '13/03', weight: 74.3, target: 73 },
];

const macroData = [
  { day: 'Lun', protein: 140, carbs: 200, fats: 60 },
  { day: 'Mar', protein: 150, carbs: 220, fats: 65 },
  { day: 'Mer', protein: 135, carbs: 180, fats: 55 },
  { day: 'Jeu', protein: 145, carbs: 210, fats: 60 },
  { day: 'Ven', protein: 160, carbs: 250, fats: 70 },
  { day: 'Sam', protein: 130, carbs: 190, fats: 50 },
  { day: 'Dim', protein: 140, carbs: 200, fats: 60 },
];

export const WeightProgressionChart = () => {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weightData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
          />
          <Area type="monotone" dataKey="weight" name="Poids (kg)" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }} />
          <Line type="dashed" dataKey="target" name="Objectif" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const MacroDistributionChart = () => {
  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={macroData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          <Bar dataKey="carbs" name="Glucides" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
          <Bar dataKey="protein" name="Protéines" stackId="a" fill="#6366f1" />
          <Bar dataKey="fats" name="Lipides" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
