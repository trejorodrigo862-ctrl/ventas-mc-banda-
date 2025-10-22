
import React, { useMemo } from 'react';
import { User, Goal, StoreProgress, IndividualProgress, VendedorGoalSet, CajeroGoalSet } from '../types';

interface MyCommissionsProps {
  currentUser: User;
  goals: Goal[];
  storeProgress: StoreProgress[];
  individualProgress: IndividualProgress[];
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => {
    const percentage = Math.min(value * 100, 120);
    return (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 relative">
            <div className="bg-indigo-600 dark:bg-red-500 h-4 rounded-full" style={{ width: `${percentage}%` }} />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-white mix-blend-difference">
                {(value * 100).toFixed(1)}%
            </span>
        </div>
    );
};

const MetricCard: React.FC<{ title: string, weight: number, score: number, details?: { label: string, value: string }[] }> = ({ title, weight, score, details }) => (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-700">
        <div className="flex justify-between items-center">
            <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
            <span className="text-xs font-bold text-white bg-slate-400 dark:bg-slate-600 px-2 py-1 rounded-full">{weight}%</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Puntaje de Alcance: <span className="font-bold text-indigo-600 dark:text-red-400">{(score * 100).toFixed(1)}%</span>
        </p>
        {details && (
            <div className="mt-2 border-t dark:border-gray-600 pt-2 space-y-1">
                {details.map((d, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>- {d.label}:</span>
                        <span className="font-medium">{d.value}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);


const MyCommissions: React.FC<MyCommissionsProps> = ({ currentUser, goals, storeProgress, individualProgress }) => {
    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentGoal = goals.find(g => g.month === currentMonthStr);

    const commissionTiers = {
        'Vendedor/a': { min: 40000, theo: 140000, max: 192000 },
        'Vendedor/a 4 hs': { min: 20000, theo: 70000, max: 96000 },
        'Cajero/a': { min: 40000, theo: 80000, max: 96000 },
    };

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

    const commissionData = useMemo(() => {
        if (!currentGoal) return null;

        const progressThisMonth = storeProgress.filter(p => p.date.startsWith(currentMonthStr));
        const totalStorePesos = progressThisMonth.reduce((sum, p) => sum + p.pesos, 0);
        const goalStorePesos = currentGoal.teamGoal?.metaPesos || 0;
        const scoreVentaSucursal = Math.min(goalStorePesos > 0 ? totalStorePesos / goalStorePesos : 0, 1.2);

        if (currentUser.role === 'Vendedor') {
            const vendorProgress = individualProgress.reduce((acc, p) => {
                acc.pesos += p.pesos || 0;
                acc.calzado += p.calzado || 0;
                acc.indumentaria += p.indumentaria || 0;
                acc.camiseta += p.camiseta || 0;
                acc.accesorios += p.accesorios || 0;
                acc.pesosMcCred += p.pesosMcCred || 0;
                acc.unidadesMcCred += p.unidadesMcCred || 0;
                return acc;
            }, { pesos: 0, calzado: 0, indumentaria: 0, camiseta: 0, accesorios: 0, pesosMcCred: 0, unidadesMcCred: 0 });

            const vendorGoals = currentGoal.userGoals[currentUser.id] as VendedorGoalSet;
            if (!vendorGoals) return null;

            const ach = {
                pesos: Math.min((vendorGoals.metaPesos || 0) > 0 ? vendorProgress.pesos / vendorGoals.metaPesos : 0, 1.2),
                calzado: Math.min((vendorGoals.metaCalzado || 0) > 0 ? vendorProgress.calzado / vendorGoals.metaCalzado : 0, 1.2),
                indumentaria: Math.min((vendorGoals.metaIndumentaria || 0) > 0 ? vendorProgress.indumentaria / vendorGoals.metaIndumentaria : 0, 1.2),
                camiseta: Math.min((vendorGoals.metaCamiseta || 0) > 0 ? vendorProgress.camiseta / vendorGoals.metaCamiseta : 0, 1.2),
                accesorios: Math.min((vendorGoals.metaAccesorios || 0) > 0 ? vendorProgress.accesorios / vendorGoals.metaAccesorios : 0, 1.2),
                creditosPesos: Math.min((vendorGoals.metaPesosMcCred || 0) > 0 ? vendorProgress.pesosMcCred / vendorGoals.metaPesosMcCred : 0, 1.2),
                creditosUnidades: Math.min((vendorGoals.metaUnidadesMcCred || 0) > 0 ? vendorProgress.unidadesMcCred / vendorGoals.metaUnidadesMcCred : 0, 1.2),
            };

            const scorePesos = ach.pesos;
            const scoreCantidades = (ach.calzado * 0.25) + (ach.indumentaria * 0.10) + (ach.camiseta * 0.10) + (ach.accesorios * 0.05);
            const scoreCreditos = (ach.creditosPesos * 0.125) + (ach.creditosUnidades * 0.125);
            
            const scoreVentaPropia = (scorePesos * 0.25) + scoreCantidades + scoreCreditos;
            
            const finalScore = (scoreVentaPropia * 0.7) + (scoreVentaSucursal * 0.3);
            const tierKey = (currentUser.assignedHours || 40) <= 20 ? 'Vendedor/a 4 hs' : 'Vendedor/a';
            const commission = calculateCommission(finalScore, commissionTiers[tierKey]);

            return { finalScore, commission, scoreVentaPropia, scoreVentaSucursal, details: { scorePesos, scoreCantidades, scoreCreditos, ach } };
        }

        if (currentUser.role === 'Cajero') {
            const cajeroProgress = individualProgress.reduce((acc, p) => {
                acc.medias += p.medias || 0;
                acc.pesosMcCred += p.pesosMcCred || 0;
                acc.unidadesMcCred += p.unidadesMcCred || 0;
                return acc;
            }, { medias: 0, pesosMcCred: 0, unidadesMcCred: 0 });

            const cajeroGoals = currentGoal.userGoals[currentUser.id] as CajeroGoalSet;
            if (!cajeroGoals) return null;

            const ach = {
                medias: Math.min((cajeroGoals.metaMedias || 0) > 0 ? cajeroProgress.medias / cajeroGoals.metaMedias : 0, 1.2),
                creditosPesos: Math.min((cajeroGoals.metaPesosMcCred || 0) > 0 ? cajeroProgress.pesosMcCred / cajeroGoals.metaPesosMcCred : 0, 1.2),
                creditosUnidades: Math.min((cajeroGoals.metaUnidadesMcCred || 0) > 0 ? cajeroProgress.unidadesMcCred / cajeroGoals.metaUnidadesMcCred : 0, 1.2),
            };
            
            const scoreCreditos = (ach.creditosPesos * 0.5) + (ach.creditosUnidades * 0.5);
            const scoreVentaPropia = (ach.medias * 0.25) + (scoreCreditos * 0.50);

            const finalScore = (scoreVentaPropia * 0.7) + (scoreVentaSucursal * 0.3);
            const commission = calculateCommission(finalScore, commissionTiers['Cajero/a']);

            return { finalScore, commission, scoreVentaPropia, scoreVentaSucursal, details: { scoreCreditos, ach } };
        }
        return null;
    }, [currentUser, currentGoal, individualProgress, storeProgress, currentMonthStr]);

    const monthName = new Date(currentMonthStr + '-02').toLocaleString('es-AR', { month: 'long', year: 'numeric' });

    if (!currentGoal || !commissionData) {
        return (
            <div>
                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Mis Comisiones</h2>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md text-center">
                    <p className="text-slate-500 dark:text-slate-400">No se han definido metas para el mes de {monthName} o no se pudo calcular tu comisión.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Mis Comisiones</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Tu desglose de comisiones para {monthName}.</p>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Comisión Estimada a Cobrar</p>
                    <p className="text-4xl font-extrabold text-green-600 dark:text-green-400">${commissionData.commission.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Puntaje Final de Rendimiento</span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-red-400">{(commissionData.finalScore * 100).toFixed(1)}%</span>
                    </div>
                    <ProgressBar value={commissionData.finalScore} />
                </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <MetricCard 
                    title="Rendimiento Propio" 
                    weight={70} 
                    score={commissionData.scoreVentaPropia}
                 />
                 <MetricCard 
                    title="Rendimiento Sucursal" 
                    weight={30} 
                    score={commissionData.scoreVentaSucursal}
                    details={[{label: 'Venta Total ($) del Local', value: `${(commissionData.scoreVentaSucursal * 100).toFixed(1)}%`}]}
                 />
            </div>
            
            <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Desglose de Rendimiento Propio</h3>
                {currentUser.role === 'Vendedor' && commissionData.details && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <MetricCard 
                            title="Venta Pesos" 
                            weight={25} 
                            score={commissionData.details.scorePesos}
                            details={[{label: 'Alcance Meta ($)', value: `${(commissionData.details.ach.pesos * 100).toFixed(1)}%`}]}
                         />
                         <MetricCard 
                            title="Venta Cantidades" 
                            weight={50} 
                            score={commissionData.details.scoreCantidades / 0.50}
                            details={[
                                {label: 'Calzado', value: `${(commissionData.details.ach.calzado * 100).toFixed(1)}%`},
                                {label: 'Indumentaria', value: `${(commissionData.details.ach.indumentaria * 100).toFixed(1)}%`},
                                {label: 'Camisetas', value: `${(commissionData.details.ach.camiseta * 100).toFixed(1)}%`},
                                {label: 'Accesorios', value: `${(commissionData.details.ach.accesorios * 100).toFixed(1)}%`}
                            ]}
                         />
                         <MetricCard 
                            title="Venta Créditos" 
                            weight={25} 
                            score={commissionData.details.scoreCreditos / 0.25}
                             details={[
                                {label: 'Monto ($)', value: `${(commissionData.details.ach.creditosPesos * 100).toFixed(1)}%`},
                                {label: 'Cantidades (U)', value: `${(commissionData.details.ach.creditosUnidades * 100).toFixed(1)}%`},
                            ]}
                         />
                    </div>
                )}
                {currentUser.role === 'Cajero' && commissionData.details && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <MetricCard 
                            title="Venta de Medias" 
                            weight={25} 
                            score={commissionData.details.ach.medias}
                            details={[{label: 'Alcance Meta (U)', value: `${(commissionData.details.ach.medias * 100).toFixed(1)}%`}]}
                         />
                         <MetricCard 
                            title="Venta Créditos Mc Cred" 
                            weight={50} 
                            score={commissionData.details.scoreCreditos}
                             details={[
                                {label: 'Monto ($)', value: `${(commissionData.details.ach.creditosPesos * 100).toFixed(1)}%`},
                                {label: 'Cantidades (U)', value: `${(commissionData.details.ach.creditosUnidades * 100).toFixed(1)}%`},
                            ]}
                         />
                    </div>
                )}
            </div>

        </div>
    );
};

export default MyCommissions;