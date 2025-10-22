
import React, { useState } from 'react';
import { User, StoreProgress, IndividualProgress } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './icons';
import Modal from './Modal';
import FormattedInput from './FormInputs';

const initialProgressState: Omit<StoreProgress, 'id'> = {
    date: new Date().toISOString().split('T')[0],
    pesos: 0, tickets: 0, unidades: 0, calzado: 0, indumentaria: 0, camiseta: 0,
    accesorios: 0, medias: 0, pesosMcCred: 0, unidadesMcCred: 0,
};

// Manager's Daily Progress Form
interface StoreProgressFormProps {
    onSubmit: (data: Omit<StoreProgress, 'id'>) => void;
    onClose: () => void;
    progressToEdit?: StoreProgress | null;
}

const StoreProgressForm: React.FC<StoreProgressFormProps> = ({ onSubmit, onClose, progressToEdit }) => {
    const [progress, setProgress] = useState(progressToEdit || initialProgressState);
    
    const handleChange = (field: keyof typeof progress, value: string | number) => {
        setProgress(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(progress);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormattedInput label="Fecha" type="date" value={progress.date} onChange={v => handleChange('date', v)} name="date" />
                <FormattedInput label="Pesos ($)" isCurrency value={progress.pesos} onChange={v => handleChange('pesos', v)} name="pesos" />
                <FormattedInput label="Tickets" type="number" value={progress.tickets} onChange={v => handleChange('tickets', v)} name="tickets" />
                <FormattedInput label="Unidades" type="number" value={progress.unidades} onChange={v => handleChange('unidades', v)} name="unidades" />
                <FormattedInput label="Calzado (U)" type="number" value={progress.calzado} onChange={v => handleChange('calzado', v)} name="calzado" />
                <FormattedInput label="Indumentaria (U)" type="number" value={progress.indumentaria} onChange={v => handleChange('indumentaria', v)} name="indumentaria" />
                <FormattedInput label="Camisetas (U)" type="number" value={progress.camiseta} onChange={v => handleChange('camiseta', v)} name="camiseta" />
                <FormattedInput label="Accesorios (U)" type="number" value={progress.accesorios} onChange={v => handleChange('accesorios', v)} name="accesorios" />
                <FormattedInput label="Medias (U)" type="number" value={progress.medias} onChange={v => handleChange('medias', v)} name="medias" />
                <FormattedInput label="Pesos MC Cred. ($)" isCurrency value={progress.pesosMcCred} onChange={v => handleChange('pesosMcCred', v)} name="pesosMcCred" />
                <FormattedInput label="Unidades MC Cred." type="number" value={progress.unidadesMcCred} onChange={v => handleChange('unidadesMcCred', v)} name="unidadesMcCred" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {progressToEdit ? 'Actualizar Avance' : 'Guardar Avance'}
                </button>
            </div>
        </form>
    );
};

const initialIndividualStateVendedor: Omit<IndividualProgress, 'id' | 'userId'> = {
    date: new Date().toISOString().split('T')[0],
    pesos: 0, unidades: 0, tickets: 0, calzado: 0, indumentaria: 0, camiseta: 0, accesorios: 0,
    pesosMcCred: 0, unidadesMcCred: 0,
};
const initialIndividualStateCajero: Omit<IndividualProgress, 'id' | 'userId'> = {
    date: new Date().toISOString().split('T')[0],
    pesosMcCred: 0, unidadesMcCred: 0, medias: 0,
};

interface IndividualProgressFormProps {
    onSubmit: (data: Omit<IndividualProgress, 'id' | 'userId'>) => void;
    onClose: () => void;
    progressToEdit?: IndividualProgress | null;
    currentUser: User;
}

const IndividualProgressForm: React.FC<IndividualProgressFormProps> = ({ onSubmit, onClose, progressToEdit, currentUser }) => {
    const isVendedor = currentUser.role === 'Vendedor';
    const getInitialState = () => {
        if (progressToEdit) return progressToEdit;
        return isVendedor ? initialIndividualStateVendedor : initialIndividualStateCajero;
    }
    const [progress, setProgress] = useState(getInitialState());

    const handleChange = (field: keyof typeof progress, value: string | number) => {
        setProgress(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(progress);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <FormattedInput label="Fecha de Carga" type="date" value={progress.date} onChange={v => handleChange('date', v)} name="date" />
            
            {isVendedor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormattedInput label="Venta Pesos ($)" isCurrency value={progress.pesos || 0} onChange={v => handleChange('pesos', v)} name="pesos" />
                    <FormattedInput label="Unidades" type="number" value={progress.unidades || 0} onChange={v => handleChange('unidades', v)} name="unidades" />
                    <FormattedInput label="Tickets" type="number" value={progress.tickets || 0} onChange={v => handleChange('tickets', v)} name="tickets" />
                    <FormattedInput label="Calzado (U)" type="number" value={progress.calzado || 0} onChange={v => handleChange('calzado', v)} name="calzado" />
                    <FormattedInput label="Indumentaria (U)" type="number" value={progress.indumentaria || 0} onChange={v => handleChange('indumentaria', v)} name="indumentaria" />
                    <FormattedInput label="Camiseta (U)" type="number" value={progress.camiseta || 0} onChange={v => handleChange('camiseta', v)} name="camiseta" />
                    <FormattedInput label="Accesorios (U)" type="number" value={progress.accesorios || 0} onChange={v => handleChange('accesorios', v)} name="accesorios" />
                    <FormattedInput label="Pesos MC Cred. ($)" isCurrency value={progress.pesosMcCred || 0} onChange={v => handleChange('pesosMcCred', v)} name="pesosMcCred" />
                    <FormattedInput label="Unidades MC Cred." type="number" value={progress.unidadesMcCred || 0} onChange={v => handleChange('unidadesMcCred', v)} name="unidadesMcCred" />
                </div>
            )}
            
            {currentUser.role === 'Cajero' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormattedInput label="Pesos MC Cred. ($)" isCurrency value={progress.pesosMcCred || 0} onChange={v => handleChange('pesosMcCred', v)} name="pesosMcCred" />
                    <FormattedInput label="Unidades MC Cred." type="number" value={progress.unidadesMcCred || 0} onChange={v => handleChange('unidadesMcCred', v)} name="unidadesMcCred" />
                    <FormattedInput label="Medias (U)" type="number" value={progress.medias || 0} onChange={v => handleChange('medias', v)} name="medias" />
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {progressToEdit ? 'Actualizar Avance' : 'Guardar Avance'}
                </button>
            </div>
        </form>
    );
};


interface SalesProps {
  currentUser: User;
  storeProgress: StoreProgress[];
  addStoreProgress: (progress: Omit<StoreProgress, 'id'>) => void;
  updateStoreProgress: (id: string, progress: Partial<Omit<StoreProgress, 'id'>>) => void;
  deleteStoreProgress: (id: string) => void;
  individualProgress: IndividualProgress[];
  addIndividualProgress: (progress: Omit<IndividualProgress, 'id' | 'userId'>) => void;
  updateIndividualProgress: (id: string, progress: Partial<Omit<IndividualProgress, 'id' | 'userId'>>) => void;
  deleteIndividualProgress: (id: string) => void;
}

const Sales: React.FC<SalesProps> = ({ 
  currentUser, storeProgress, addStoreProgress, updateStoreProgress, deleteStoreProgress,
  individualProgress, addIndividualProgress, updateIndividualProgress, deleteIndividualProgress
}) => {
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressToEdit, setProgressToEdit] = useState<StoreProgress | null>(null);

  const [isIndividualModalOpen, setIsIndividualModalOpen] = useState(false);
  const [individualProgressToEdit, setIndividualProgressToEdit] = useState<IndividualProgress | null>(null);

  const handleProgressFormSubmit = (progressData: Omit<StoreProgress, 'id'>) => {
      if (progressToEdit) {
          updateStoreProgress(progressToEdit.id, progressData);
      } else {
          addStoreProgress(progressData);
      }
      handleCloseProgressModal();
  };

  const handleOpenProgressModal = (progress?: StoreProgress) => {
    setProgressToEdit(progress || null);
    setIsProgressModalOpen(true);
  };
  
  const handleCloseProgressModal = () => {
    setProgressToEdit(null);
    setIsProgressModalOpen(false);
  };
  
  const handleIndividualFormSubmit = (progressData: Omit<IndividualProgress, 'id' | 'userId'>) => {
    if (individualProgressToEdit) {
      updateIndividualProgress(individualProgressToEdit.id, progressData);
    } else {
      addIndividualProgress(progressData);
    }
    handleCloseIndividualModal();
  };

  const handleOpenIndividualModal = (progress?: IndividualProgress) => {
    setIndividualProgressToEdit(progress || null);
    setIsIndividualModalOpen(true);
  };

  const handleCloseIndividualModal = () => {
    setIndividualProgressToEdit(null);
    setIsIndividualModalOpen(false);
  };
  
  const sortedProgress = [...storeProgress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const sortedIndividualProgress = [...individualProgress].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">Ventas</h2>
      </div>
      
      {currentUser.role === 'Encargado' && (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Avance Diario de Metas del Local</h3>
                 <button onClick={() => handleOpenProgressModal()} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    <PlusIcon className="h-4 w-4" />
                    <span>Añadir Avance</span>
                </button>
            </div>
             <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pesos</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tickets</th>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Unidades</th>
                                <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                            {sortedProgress.map(p => (
                                <tr key={p.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(p.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">${p.pesos.toLocaleString('es-AR')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.tickets}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.unidades}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-4">
                                            <button onClick={() => handleOpenProgressModal(p)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><EditIcon /></button>
                                            <button onClick={() => deleteStoreProgress(p.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {['Vendedor', 'Cajero'].includes(currentUser.role) && (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Mi Avance Diario</h3>
                 <button onClick={() => handleOpenIndividualModal()} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    <PlusIcon className="h-4 w-4" />
                    <span>Cargar mi Avance</span>
                </button>
            </div>
             <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                        <thead className="bg-gray-50 dark:bg-black">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Fecha</th>
                                {currentUser.role === 'Vendedor' && <>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pesos</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Unidades</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tickets</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">$ MC Cred.</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">U. MC Cred.</th>
                                </>}
                                {currentUser.role === 'Cajero' && <>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pesos MC Cred.</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Unidades MC Cred.</th>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Medias</th>
                                </>}
                                <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                         <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                            {sortedIndividualProgress.map(p => (
                                <tr key={p.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(p.date + 'T00:00:00').toLocaleDateString('es-AR')}</td>
                                    {currentUser.role === 'Vendedor' && <>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">${(p.pesos || 0).toLocaleString('es-AR')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.unidades || 0}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.tickets || 0}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">${(p.pesosMcCred || 0).toLocaleString('es-AR')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.unidadesMcCred || 0}</td>
                                    </>}
                                    {currentUser.role === 'Cajero' && <>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">${(p.pesosMcCred || 0).toLocaleString('es-AR')}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.unidadesMcCred || 0}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{p.medias || 0}</td>
                                    </>}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-4">
                                            <button onClick={() => handleOpenIndividualModal(p)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><EditIcon /></button>
                                            <button onClick={() => deleteIndividualProgress(p.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                         </tbody>
                    </table>
                     {sortedIndividualProgress.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-slate-500 dark:text-slate-400">Aún no has cargado ningún avance. ¡Empieza haciendo clic en "Cargar mi Avance"!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

       <Modal isOpen={isProgressModalOpen} onClose={handleCloseProgressModal} title={progressToEdit ? 'Editar Avance Diario' : 'Nuevo Avance Diario'}>
        <StoreProgressForm onSubmit={handleProgressFormSubmit} onClose={handleCloseProgressModal} progressToEdit={progressToEdit} />
      </Modal>

      <Modal isOpen={isIndividualModalOpen} onClose={handleCloseIndividualModal} title={individualProgressToEdit ? 'Editar mi Avance' : 'Cargar mi Avance'}>
        <IndividualProgressForm onSubmit={handleIndividualFormSubmit} onClose={handleCloseIndividualModal} progressToEdit={individualProgressToEdit} currentUser={currentUser} />
      </Modal>
    </div>
  );
};

export default Sales;