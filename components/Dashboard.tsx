import React, { useMemo, useState } from 'react';
import { Sale, User, Goal, Theme, StoreProgress, VendedorGoalSet, Message, SaleCategory } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrophyIcon, TrashIcon } from './icons';

interface DashboardProps {
  sales: Sale[];
  users: User[];
  currentUser: User;
  goals: Goal[];
  theme: Theme;
  storeProgress: StoreProgress[];
  messages: Message[];
  addMessage: (content: string) => void;
  deleteMessage: (id: string) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; description: string }> = ({ title, value, description }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 transform hover:-translate-y-1 transition-transform duration-300">
    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</h3>
    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>
  </div>
);

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const displayPercentage = Math.min(percentage, 100);
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-indigo-600 dark:bg-red-500 h-2.5 rounded-full" style={{ width: `${displayPercentage}%` }}></div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ sales, users, currentUser, goals, theme, storeProgress, messages, addMessage, deleteMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const currentGoal = goals.find(g => g.month === currentMonthStr);
  
  const managerData = useMemo(() => {
    if (currentUser.role !== 'Encargado') return null;

    const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
    
    const totalRevenue = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
    const totalUnits = progressThisMonth.reduce((sum, p) => sum + p.unidades, 0);
    const totalTickets = progressThisMonth.reduce((sum, p) => sum + p.tickets, 0);
    const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
    const unitsPerTicket = totalTickets > 0 ? totalUnits / totalTickets : 0;
    
    const monthlyGoalPesos = currentGoal?.teamGoal?.metaPesos || 0;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyGoal = monthlyGoalPesos > 0 ? monthlyGoalPesos / daysInMonth : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayProgress = progressThisMonth.find(p => p.date === todayStr)?.pesos || 0;
    const remainingForDay = dailyGoal > 0 ? dailyGoal - todayProgress : 0;

    const WORKDAY_START = 9;
    const WORKDAY_END = 18;
    const currentHour = new Date().getHours();
    const remainingHours = Math.max(0, WORKDAY_END - currentHour);
    const hourlyRateNeeded = remainingForDay > 0 && remainingHours > 0 ? remainingForDay / remainingHours : 0;
    
    const sellers = users.filter(u => u.role === 'Vendedor');
    const salesThisMonth = sales.filter(s => s.date.startsWith(currentMonthStr));

    const sellerProgress = sellers.map(seller => {
      const sellerSales = salesThisMonth
        .filter(s => s.sellerId === seller.id)
        .reduce((sum, s) => sum + s.amount, 0);
      
      const sellerGoal = (currentGoal?.userGoals[seller.id] as VendedorGoalSet)?.metaPesos || 0;
      return {
        id: seller.id,
        name: seller.name,
        total: sellerSales,
        goal: sellerGoal,
      };
    });


    return {
      totalRevenue,
      totalUnits,
      avgTicket,
      unitsPerTicket,
      remainingForDay,
      hourlyRateNeeded,
      sellerProgress
    };
  }, [currentUser, storeProgress, sales, users, currentGoal, currentMonthStr]);


  const regularUserData = useMemo(() => {
    if (currentUser.role === 'Encargado') return null;

     const relevantSales = sales.filter(s => s.sellerId === currentUser.id && s.date.startsWith(currentMonthStr));
     const totalRevenue = relevantSales.reduce((sum, sale) => sum + sale.amount, 0);
     const totalUnitsSold = relevantSales.reduce((sum, sale) => sum + sale.units, 0);
     const avgTicket = totalRevenue > 0 && relevantSales.length > 0 ? totalRevenue / relevantSales.length : 0;
     const unitsPerTicket = relevantSales.length > 0 ? totalUnitsSold / relevantSales.length : 0;
    
     return { totalRevenue, totalUnitsSold, avgTicket, unitsPerTicket };
  }, [sales, currentUser, currentMonthStr]);
  
  const handleAddMessage = () => {
    if (newMessage.trim()) {
      addMessage(newMessage);
      setNewMessage('');
    }
  };

  const sellerRanking = useMemo(() => {
    if (currentUser.role !== 'Encargado') return [];
    const salesThisMonth = sales.filter(s => s.date.startsWith(currentMonthStr));
    const sellerSales: { [id: string]: { name: string; total: number } } = {};

    salesThisMonth.forEach(sale => {
      if (!sellerSales[sale.sellerId]) {
        sellerSales[sale.sellerId] = { name: sale.sellerName, total: 0 };
      }
      sellerSales[sale.sellerId].total += sale.amount;
    });

    return Object.values(sellerSales).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [sales, currentMonthStr, currentUser]);

  const rankedUnitGoals = useMemo(() => {
    if (currentUser.role !== 'Vendedor' || !currentGoal) return [];
    
    const userGoals = (currentGoal.userGoals[currentUser.id] as VendedorGoalSet);
    if (!userGoals) return [];

    const relevantSales = sales.filter(s => s.sellerId === currentUser.id && s.date.startsWith(currentMonthStr));
    
    const salesByCategory = relevantSales.reduce((acc, sale) => {
        acc[sale.category] = (acc[sale.category] || 0) + sale.units;
        return acc;
    }, {} as Record<SaleCategory, number>);

    const goalMap: { key: keyof VendedorGoalSet, label: SaleCategory }[] = [
        { key: 'metaCalzado', label: 'Calzado' },
        { key: 'metaIndumentaria', label: 'Indumentaria' },
        { key: 'metaAccesorios', label: 'Accesorios' },
        { key: 'metaCamiseta', label: 'Camisetas' },
    ];
    
    const goalsWithProgress = goalMap.map(({ key, label }) => {
        const goal = userGoals[key] || 0;
        const sold = salesByCategory[label] || 0;
        const progress = goal > 0 ? (sold / goal) * 100 : 0;
        return { name: label, sold, goal, progress };
    }).filter(g => g.goal > 0);

    return goalsWithProgress.sort((a, b) => a.progress - b.progress);

  }, [currentUser, currentGoal, sales, currentMonthStr]);


  const sortedMessages = [...messages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Dashboard de {currentUser.name}</h2>
      
      {currentUser.role === 'Encargado' && managerData ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Ventas del Mes (Avance Diario)" value={`$${managerData.totalRevenue.toLocaleString('es-AR')}`} description="Total basado en el avance diario" />
            <StatCard title="Unidades Vendidas (Avance Diario)" value={managerData.totalUnits.toLocaleString('es-AR')} description="Total de unidades del avance diario" />
            <StatCard title="Ticket Promedio (Avance Diario)" value={`$${managerData.avgTicket.toFixed(2)}`} description="Promedio por ticket del avance diario" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Unidades por Ticket" value={managerData.unitsPerTicket.toFixed(2)} description="Promedio de artículos por ticket" />
            <StatCard title="Faltante para Meta del Día" value={`$${managerData.remainingForDay > 0 ? managerData.remainingForDay.toLocaleString('es-AR', {maximumFractionDigits: 0}) : 0}`} description="Para alcanzar la meta de hoy" />
            <StatCard title="Ritmo por Hora Requerido" value={`$${managerData.hourlyRateNeeded.toLocaleString('es-AR', {maximumFractionDigits: 0})}/hr`} description="Venta necesaria el resto del día" />
        </div>
        </>
      ) : regularUserData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Mis Ventas del Mes" value={`$${regularUserData.totalRevenue.toLocaleString('es-AR')}`} description="Total vendido (acumulado + app)" />
            <StatCard title="Mis Unidades Vendidas" value={regularUserData.totalUnitsSold} description="Total de artículos vendidos (en app)" />
            <StatCard title="Mi Ticket Promedio" value={`$${regularUserData.avgTicket.toFixed(2)}`} description="Valor promedio por venta (en app)" />
            <StatCard title="Unidades por Ticket" value={regularUserData.unitsPerTicket.toFixed(2)} description="Promedio de artículos por venta" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        { currentUser.role === 'Encargado' ? (
        <>
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Comunicados al Equipo</h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje importante para tu equipo..."
                  className="flex-grow p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition bg-white dark:bg-gray-800 dark:border-gray-700 dark:focus:ring-red-500 dark:focus:border-red-500"
                  rows={3}
                />
                <button
                  onClick={handleAddMessage}
                  disabled={!newMessage.trim()}
                  className="px-6 py-3 font-semibold text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-slate-400 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-slate-500"
                >
                  Publicar
                </button>
              </div>
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Historial de Mensajes</h4>
                 {sortedMessages.length > 0 ? (
                    <ul className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                        {sortedMessages.map(msg => (
                            <li key={msg.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(msg.date).toLocaleString('es-AR')}</p>
                                </div>
                                <button onClick={() => deleteMessage(msg.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 ml-4 flex-shrink-0"><TrashIcon /></button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 mt-4">No hay mensajes enviados.</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Ranking de Vendedores (Mes Actual)</h3>
                {sellerRanking.length > 0 ? (
                    <ul>
                        {sellerRanking.map((s, index) => (
                            <li key={s.name} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center">
                                    {index < 3 && <TrophyIcon className={`mr-2 ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400 dark:text-slate-500' : 'text-amber-700'}`} />}
                                    {index + 1}. {s.name}
                                </span>
                                <span className="font-bold text-indigo-600 bg-indigo-100 dark:text-red-400 dark:bg-red-900/40 px-2 py-1 rounded">${s.total.toLocaleString('es-AR')}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full min-h-[150px]">
                        <p className="text-slate-500 dark:text-slate-400">No hay ventas este mes para mostrar un ranking.</p>
                    </div>
                )}
            </div>
        </>
        ) : (
        <>
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                 <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Progreso de Metas (Unidades)</h3>
                 {currentUser.role === 'Vendedor' && rankedUnitGoals.length > 0 ? (
                    <div className="space-y-4">
                        {rankedUnitGoals.map(g => (
                            <div key={g.name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.name}</span>
                                    <span className="text-sm font-bold text-indigo-600 dark:text-red-400">
                                        {g.progress.toFixed(1)}%
                                        <span className="font-medium text-slate-500 dark:text-slate-400 ml-2">({g.sold}/{g.goal})</span>
                                    </span>
                                </div>
                                <ProgressBar value={g.sold} max={g.goal} />
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="flex items-center justify-center h-full min-h-[150px]">
                        <p className="text-slate-500 dark:text-slate-400">No hay metas de unidades asignadas para este mes.</p>
                    </div>
                 )}
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Mensajes del Encargado</h3>
                {sortedMessages.length > 0 ? (
                    <ul className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                        {sortedMessages.map(msg => (
                            <li key={msg.id} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{new Date(msg.date).toLocaleString('es-AR')}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full min-h-[150px]">
                        <p className="text-slate-500 dark:text-slate-400">No hay mensajes importantes.</p>
                    </div>
                )}
            </div>
        </>
        )}
      </div>
      {currentUser.role === 'Encargado' && managerData && (
          <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Progreso de Vendedores vs. Metas (Pesos)</h3>
              <div className="space-y-4">
                  {managerData.sellerProgress.map(seller => (
                      <div key={seller.id}>
                          <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{seller.name}</span>
                              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  ${seller.total.toLocaleString('es-AR')} / <span className="font-bold">${seller.goal.toLocaleString('es-AR')}</span>
                              </span>
                          </div>
                          <ProgressBar value={seller.total} max={seller.goal} />
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;