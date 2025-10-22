
import React, { useMemo } from 'react';
import { User, Goal, StoreProgress, IndividualProgress, VendedorGoalSet, CajeroGoalSet } from '../types';

interface CommissionsProps {
  users: User[];
  goals: Goal[];
  storeProgress: StoreProgress[];
  individualProgress: IndividualProgress[];
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    const percentage = Math.min(value * 100, 120); // Cap at 120% for display
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
            <div 
                className="bg-indigo-600 dark:bg-red-500 h-4 rounded-full" 
                style={{ width: `${percentage}%` }}
            ></div>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white mix-blend-difference">
                {(value * 100).toFixed(1)}%
            </span>
        </div>
    );
};


const Commissions: React.FC<CommissionsProps> = ({ users, goals, storeProgress, individualProgress }) => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentGoal = goals.find(g => g.month === currentMonthStr);

    const commissionTiers = {
        'Encargado/a': { min: 170000, theo: 280000, max: 384000 },
        'Vendedor/a': { min: 40000, theo: 140000, max: 192000 },
        'Vendedor/a 4 hs': { min: 20000, theo: 70000, max: 96000 },
        'Cajero/a': { min: 40000, theo: 80000, max: 96000 },
    };

    const managerPerformanceWeights: { key: keyof StoreProgress | 'pesosMcCred' | 'unidadesMcCred', weight: number, label: string, goalKey: keyof NonNullable<Goal['teamGoal']>}[] = [
        { key: 'pesos', weight: 0.25, label: 'Venta en Pesos', goalKey: 'metaPesos' },
        { key: 'calzado', weight: 0.22, label: 'U. Calzado', goalKey: 'metaCalzado' },
        { key: 'indumentaria', weight: 0.10, label: 'U. Indumentaria', goalKey: 'metaIndumentaria' },
        { key: 'camiseta', weight: 0.10, label: 'U. Camisetas', goalKey: 'metaCamiseta' },
        { key: 'accesorios', weight: 0.05, label: 'U. Accesorios', goalKey: 'metaAccesorios' },
        { key: 'medias', weight: 0.03, label: 'U. Medias', goalKey: 'metaMedias' },
        { key: 'pesosMcCred', weight: 0.125, label: '$ MC Crédito', goalKey: 'metaPesosMcCred' },
        { key: 'unidadesMcCred', weight: 0.125, label: 'U. MC Crédito', goalKey: 'metaUnidadesMcCred' },
    ];
    
    const calculateCommission = (score: number, tiers: { min: number, theo: number, max: number }) => {
      if (score < 0.8) return tiers.min;
      if (score >= 1.2) return tiers.max;
      
      if (score < 1.0) {
        const percentage = (score - 0.8) / 0.2;
        return tiers.min + percentage * (tiers.theo - tiers.min);
      }
      
      const percentage = (score - 1.0) / 0.2;
      return tiers.theo + percentage * (tiers.max - tiers.min);
    };

    const managerData = useMemo(() => {
        const manager = users.find(u => u.role === 'Encargado');
        if (!manager || !currentGoal?.teamGoal) return null;

        const teamGoal = currentGoal.teamGoal;
        const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
        
        const aggregatedProgress = progressThisMonth.reduce((acc, p) => {
            (Object.keys(p) as Array<keyof StoreProgress>).forEach(key => {
                if (key !== 'id' && key !== 'date') {
                    acc[key] = (acc[key] || 0) + p[key];
                }
            });
            return acc;
        }, {} as Partial<Omit<StoreProgress, 'id' | 'date'>>);

        const performanceDetails = managerPerformanceWeights.map(metric => {
            const actual = aggregatedProgress[metric.key] || 0;
            const goal = teamGoal[metric.goalKey] || 0;
            const achievement = goal > 0 ? actual / goal : 0;
            const cappedAchievement = Math.min(achievement, 1.2); // Cap achievement at 120% for calculation
            const weightedScore = cappedAchievement * metric.weight;
            return { ...metric, actual, goal, achievement, weightedScore };
        });

        const finalScore = performanceDetails.reduce((sum, item) => sum + item.weightedScore, 0);
        const commission = calculateCommission(finalScore, commissionTiers['Encargado/a']);

        return { manager, details: performanceDetails, finalScore, commission };
    }, [users, currentGoal, storeProgress, currentMonthStr]);

    const teamData = useMemo(() => {
        if (!currentGoal) return { vendedores: [], cajeros: [] };
        
        const vendedores = users.filter(u => u.role === 'Vendedor').map(vendedor => {
            const vendorProgress = individualProgress
                .filter(p => p.userId === vendedor.id && p.date.startsWith(currentMonthStr))
                .reduce((acc, p) => {
                    acc.pesos += p.pesos || 0;
                    acc.calzado += p.calzado || 0;
                    acc.indumentaria += p.indumentaria || 0;
                    acc.camiseta += p.camiseta || 0;
                    acc.accesorios += p.accesorios || 0;
                    acc.pesosMcCred += p.pesosMcCred || 0;
                    acc.unidadesMcCred += p.unidadesMcCred || 0;
                    return acc;
                }, { pesos: 0, calzado: 0, indumentaria: 0, camiseta: 0, accesorios: 0, pesosMcCred: 0, unidadesMcCred: 0 });

            const vendorGoals = (currentGoal.userGoals[vendedor.id] as VendedorGoalSet);
            if (!vendorGoals) return { ...vendedor, achievement: 0, commission: 0, details: {} };

            // Venta Propia (70%)
            const achPesos = Math.min((vendorGoals.metaPesos || 0) > 0 ? vendorProgress.pesos / vendorGoals.metaPesos : 0, 1.2);
            
            const scoreCantidadesPonderado = (
                (Math.min((vendorGoals.metaCalzado || 0) > 0 ? vendorProgress.calzado / vendorGoals.metaCalzado : 0, 1.2) * 0.25) +
                (Math.min((vendorGoals.metaIndumentaria || 0) > 0 ? vendorProgress.indumentaria / vendorGoals.metaIndumentaria : 0, 1.2) * 0.10) +
                (Math.min((vendorGoals.metaCamiseta || 0) > 0 ? vendorProgress.camiseta / vendorGoals.metaCamiseta : 0, 1.2) * 0.10) +
                (Math.min((vendorGoals.metaAccesorios || 0) > 0 ? vendorProgress.accesorios / vendorGoals.metaAccesorios : 0, 1.2) * 0.05)
            );

            const achCreditosPesos = Math.min((vendorGoals.metaPesosMcCred || 0) > 0 ? vendorProgress.pesosMcCred / vendorGoals.metaPesosMcCred : 0, 1.2);
            const achCreditosUnidades = Math.min((vendorGoals.metaUnidadesMcCred || 0) > 0 ? vendorProgress.unidadesMcCred / vendorGoals.metaUnidadesMcCred : 0, 1.2);
            const scoreCreditosPonderado = (achCreditosPesos * 0.125) + (achCreditosUnidades * 0.125);
            
            const scoreVentaPropia = (achPesos * 0.25) + scoreCantidadesPonderado + scoreCreditosPonderado;

            // Venta Sucursal (30%)
            const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
            const totalStorePesos = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
            const goalStorePesos = currentGoal.teamGoal?.metaPesos || 0;
            const scoreVentaSucursal = Math.min(goalStorePesos > 0 ? totalStorePesos / goalStorePesos : 0, 1.2);
            
            // Final Score
            const finalScore = (scoreVentaPropia * 0.7) + (scoreVentaSucursal * 0.3);

            const tierKey = (vendedor.assignedHours || 40) <= 20 ? 'Vendedor/a 4 hs' : 'Vendedor/a';
            const commission = calculateCommission(finalScore, commissionTiers[tierKey]);
            
            const details = {
                scoreVentaPropia,
                scoreVentaSucursal,
                detailsVentaPropia: {
                  pesos: { achievement: achPesos },
                  cantidades: { achievement: scoreCantidadesPonderado / 0.50 }, 
                  creditos: { achievement: scoreCreditosPonderado / 0.25 }
                }
            };
            
            return { ...vendedor, achievement: finalScore, commission, details };
        });
        
        const cajeros = users.filter(u => u.role === 'Cajero').map(cajero => {
            const cajeroProgress = individualProgress
                .filter(p => p.userId === cajero.id && p.date.startsWith(currentMonthStr))
                .reduce((acc, p) => {
                    acc.medias += p.medias || 0;
                    acc.pesosMcCred += p.pesosMcCred || 0;
                    acc.unidadesMcCred += p.unidadesMcCred || 0;
                    return acc;
                }, { medias: 0, pesosMcCred: 0, unidadesMcCred: 0 });
            
            const cajeroGoals = (currentGoal.userGoals[cajero.id] as CajeroGoalSet);

            // Venta Propia (70%)
            const achievementMediasUnidades = Math.min((cajeroGoals?.metaMedias || 0) > 0 ? cajeroProgress.medias / cajeroGoals.metaMedias : 0, 1.2);
            const achievementMcCredPesos = Math.min((cajeroGoals?.metaPesosMcCred || 0) > 0 ? cajeroProgress.pesosMcCred / cajeroGoals.metaPesosMcCred : 0, 1.2);
            const achievementMcCredUnidades = Math.min((cajeroGoals?.metaUnidadesMcCred || 0) > 0 ? cajeroProgress.unidadesMcCred / cajeroGoals.metaUnidadesMcCred : 0, 1.2);
            
            const scoreCreditos = (achievementMcCredPesos * 0.5) + (achievementMcCredUnidades * 0.5);
            const scoreVentaPropia = (achievementMediasUnidades * 0.25) + (scoreCreditos * 0.50);

            // Venta Sucursal (30%)
            const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
            const totalStorePesos = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
            const goalStorePesos = currentGoal.teamGoal?.metaPesos || 0;
            const scoreVentaSucursal = Math.min(goalStorePesos > 0 ? totalStorePesos / goalStorePesos : 0, 1.2);

            // Final Score
            const finalScore = (scoreVentaPropia * 0.7) + (scoreVentaSucursal * 0.3);

            const commission = calculateCommission(finalScore, commissionTiers['Cajero/a']);
            
            const details = {
                scoreVentaPropia,
                scoreVentaSucursal,
                detailsVentaPropia: {
                    medias: { achievement: achievementMediasUnidades },
                    creditos: { achievement: scoreCreditos },
                }
            };
            
            return { ...cajero, achievement: finalScore, commission, details };
        });
        
        return { vendedores, cajeros };
    }, [users, currentGoal, individualProgress, storeProgress, currentMonthStr]);

    if (!currentGoal) {
        return (
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Comisiones</h2>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
                    <p className="text-slate-500 dark:text-slate-400">No se han definido metas para el mes actual. Por favor, defina las metas en la sección "Metas Mensuales" para poder calcular las comisiones.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Cálculo de Comisiones</h2>
            
            <div className="space-y-8">
                 {/* Manager Section */}
                {managerData && (
                    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Comisión de Encargado/a</h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-4">Basado en el rendimiento ponderado de la sucursal.</p>
                         <div className="overflow-x-auto mb-4">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                                <thead className="bg-gray-50 dark:bg-black">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Métrica</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Real</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Meta</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Alcance</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Peso</th>
                                        <th className="px-3 py-2 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Puntaje</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                                    {managerData.details.map(d => (
                                        <tr key={d.key}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-200">{d.label}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{d.actual.toLocaleString('es-AR')}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{d.goal.toLocaleString('es-AR')}</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-semibold text-indigo-600 dark:text-red-400">{(d.achievement * 100).toFixed(1)}%</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-slate-500 dark:text-slate-400">{(d.weight * 100).toFixed(1)}%</td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-slate-800 dark:text-slate-100">{(d.weightedScore * 100).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                                 <tfoot className="bg-gray-50 dark:bg-black">
                                    <tr>
                                        <td colSpan={5} className="px-3 py-2 text-right text-sm font-bold text-slate-800 dark:text-slate-100 uppercase">Puntaje Final de Rendimiento</td>
                                        <td className="px-3 py-2 text-right text-sm font-extrabold text-indigo-700 dark:text-red-500">{(managerData.finalScore * 100).toFixed(2)}%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="text-right bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                            <span className="text-md font-semibold text-slate-600 dark:text-slate-300">Comisión a Cobrar ({managerData.manager.name}): </span>
                            <span className="text-2xl font-extrabold text-green-600 dark:text-green-400">${managerData.commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}

                {/* Team Section */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Comisiones de Vendedores y Cajeros</h3>
                     <div className="mb-8">
                        <h4 className="text-lg font-semibold text-indigo-700 dark:text-red-500 mb-3">Vendedores</h4>
                         <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 dark:border-purple-400 text-purple-800 dark:text-purple-200 p-4 rounded-r-lg mb-4" role="alert">
                            <p className="font-bold">Reglas de Comisión (Vendedores)</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                <li>El puntaje final se compone de un <strong>70% por rendimiento propio</strong> y un <strong>30% por el rendimiento de la sucursal</strong>.</li>
                                <li>El rendimiento propio pondera el alcance en $, Unidades por categoría y Créditos.</li>
                                <li>El pago final se calcula de forma proporcional entre un mínimo (al 80%) y un máximo (al 120%).</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            {teamData.vendedores.map(v => (
                                <div key={v.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <p className="font-bold text-md text-slate-800 dark:text-slate-100">{v.name}</p>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Comisión a Cobrar</p>
                                            <p className="font-extrabold text-xl text-green-600 dark:text-green-400">${v.commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puntaje Final de Rendimiento</span>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-red-400">{(v.achievement * 100).toFixed(1)}%</span>
                                        </div>
                                        <ProgressBar value={v.achievement} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Propia (Peso: 70%)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(v.details.scoreVentaPropia * 100).toFixed(1)}%</span></p>
                                            <ul className="text-xs mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                                                <li>- Venta Pesos ($): {(v.details.detailsVentaPropia.pesos.achievement * 100).toFixed(1)}%</li>
                                                <li>- Venta Cantidades (U): {(v.details.detailsVentaPropia.cantidades.achievement * 100).toFixed(1)}%</li>
                                                <li>- Venta Créditos ($ y U): {(v.details.detailsVentaPropia.creditos.achievement * 100).toFixed(1)}%</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Sucursal (Peso: 30%)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(v.details.scoreVentaSucursal * 100).toFixed(1)}%</span></p>
                                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">- Basado en Venta Total ($) del local.</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold text-indigo-700 dark:text-red-500 mb-3">Cajeros</h4>
                         <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg mb-4" role="alert">
                            <p className="font-bold">Reglas de Comisión (Cajeros)</p>
                            <ul className="list-disc list-inside text-sm mt-1">
                                <li>El puntaje final se compone de un <strong>70% por rendimiento propio</strong> y un <strong>30% por el rendimiento de la sucursal</strong>.</li>
                                <li>El rendimiento propio pondera el alcance de metas de Medias (U) y Créditos Mc Cred ($ y U).</li>
                                <li>El pago final se calcula de forma proporcional entre un mínimo (al 80%) y un máximo (al 120%).</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            {teamData.cajeros.map(c => (
                                <div key={c.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700">
                                    <div className="flex flex-wrap justify-between items-center gap-2">
                                        <p className="font-bold text-md text-slate-800 dark:text-slate-100">{c.name}</p>
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Comisión a Cobrar</p>
                                            <p className="font-extrabold text-xl text-green-600 dark:text-green-400">${c.commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puntaje Final de Rendimiento</span>
                                            <span className="text-sm font-bold text-indigo-600 dark:text-red-400">{(c.achievement * 100).toFixed(1)}%</span>
                                        </div>
                                        <ProgressBar value={c.achievement} />
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Propia (Peso: 70%)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(c.details.scoreVentaPropia * 100).toFixed(1)}%</span></p>
                                            <ul className="text-xs mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                                                <li>- Medias (U): {(c.details.detailsVentaPropia.medias.achievement * 100).toFixed(1)}%</li>
                                                <li>- Créditos ($ y U): {(c.details.detailsVentaPropia.creditos.achievement * 100).toFixed(1)}%</li>
                                            </ul>
                                        </div>
                                        <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Alcance Venta Sucursal (Peso: 30%)</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Puntaje: <span className="font-bold text-indigo-600 dark:text-red-400">{(c.details.scoreVentaSucursal * 100).toFixed(1)}%</span></p>
                                            <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">- Basado en Venta Total ($) del local.</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Commissions;