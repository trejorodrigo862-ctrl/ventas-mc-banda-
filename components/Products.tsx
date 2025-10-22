
import React, { useState, useEffect } from 'react';
import { User, Goal, SaleCategory, UserRole, TeamGoalSet, VendedorGoalSet, CajeroGoalSet, Message } from '../types';
import { PlusIcon, TrashIcon, EditIcon } from './icons';
import Modal from './Modal';

const USER_ROLES: UserRole[] = ['Encargado', 'Vendedor', 'Cajero'];
const TEAM_SUB_GOALS: {key: keyof TeamGoalSet, label: string}[] = [
    { key: 'metaCalzado', label: 'Calzado' },
    { key: 'metaIndumentaria', label: 'Indumentaria' },
    { key: 'metaAccesorios', label: 'Accesorios' },
    { key: 'metaCamiseta', label: 'Camisetas' },
    { key: 'metaMedias', label: 'Medias' },
];


interface TeamFormProps {
  onSubmit: (user: Omit<User, 'id'>) => void;
  onClose: () => void;
  userToEdit?: User | null;
}

const TeamForm: React.FC<TeamFormProps> = ({ onSubmit, onClose, userToEdit }) => {
    const [name, setName] = useState(userToEdit?.name || '');
    const [role, setRole] = useState<UserRole>(userToEdit?.role || 'Vendedor');
    const [avatarUrl, setAvatarUrl] = useState(userToEdit?.avatarUrl || `https://i.pravatar.cc/150?u=${name || 'new'}`);
    const [assignedHours, setAssignedHours] = useState(userToEdit?.assignedHours || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!name.trim()) return;
        onSubmit({ name, role, avatarUrl, assignedHours: Number(assignedHours) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre</label>
                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm" />
            </div>
             <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Rol</label>
                <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded-md">
                    {USER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="assignedHours" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Horas Asignadas</label>
                <input type="number" id="assignedHours" value={assignedHours} onChange={e => setAssignedHours(Number(e.target.value))} min="0" required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                    {userToEdit ? 'Actualizar Miembro' : 'Añadir Miembro'}
                </button>
            </div>
        </form>
    );
};

interface GoalInputProps {
    label: string;
    value: number | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
}
const GoalInput: React.FC<GoalInputProps> = ({ label, value, onChange, placeholder = "0" }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <input 
            type="number" 
            placeholder={placeholder}
            value={value || ''} 
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md" 
        />
    </div>
);


interface TeamProps {
  users: User[];
  goals: Goal[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  setGoals: (goals: Goal) => void;
  viewMode: 'members' | 'goals';
  messages: Message[];
  addMessage: (content: string) => void;
  deleteMessage: (id: string) => void;
}

const Team: React.FC<TeamProps> = ({ users, goals, addUser, updateUser, deleteUser, setGoals, viewMode, messages, addMessage, deleteMessage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [newMessage, setNewMessage] = useState('');
  
  const [currentTeamGoal, setCurrentTeamGoal] = useState<TeamGoalSet>({});

  useEffect(() => {
    const goalForMonth = goals.find(g => g.month === currentMonth);
    setCurrentTeamGoal(goalForMonth?.teamGoal || {});
  }, [currentMonth, goals]);


  const handleOpenModal = (user?: User) => {
    setUserToEdit(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setUserToEdit(null);
  };

  const handleFormSubmit = (userData: Omit<User, 'id'>) => {
    if (userToEdit) {
      updateUser(userToEdit.id, userData);
    } else {
      addUser(userData);
    }
    handleCloseModal();
  };
  
  const handleTeamGoalChange = (goalKey: keyof TeamGoalSet, value: string) => {
      const numericValue = Number(value) || 0;
      setCurrentTeamGoal(prev => ({ ...prev, [goalKey]: numericValue }));
  };
  
  const handleSaveGoals = () => {
    const vendedores = users.filter(u => u.role === 'Vendedor');
    const cajeros = users.filter(u => u.role === 'Cajero');
    const totalVendedorHours = vendedores.reduce((sum, u) => sum + (u.assignedHours || 0), 0);

    const newUserGoals: { [userId: string]: VendedorGoalSet | CajeroGoalSet } = {};

    vendedores.forEach(vendedor => {
        const participation = totalVendedorHours > 0 ? (vendedor.assignedHours || 0) / totalVendedorHours : 0;
        newUserGoals[vendedor.id] = {
            metaPesos: Math.round((currentTeamGoal.metaPesos || 0) * participation),
            metaTickets: Math.round((currentTeamGoal.metaTickets || 0) * participation), 
            metaUnidades: Math.round((currentTeamGoal.metaUnidades || 0) * participation),
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaCalzado: Math.round((currentTeamGoal.metaCalzado || 0) * participation),
            metaIndumentaria: Math.round((currentTeamGoal.metaIndumentaria || 0) * participation),
            metaCamiseta: Math.round((currentTeamGoal.metaCamiseta || 0) * participation),
            metaAccesorios: Math.round((currentTeamGoal.metaAccesorios || 0) * participation),
        };
    });
    
    cajeros.forEach(cajero => {
        newUserGoals[cajero.id] = {
            metaPesosMcCred: currentTeamGoal.metaPesosMcCred,
            metaUnidadesMcCred: currentTeamGoal.metaUnidadesMcCred,
            metaMedias: currentTeamGoal.metaMedias,
        };
    });

    const newGoalForMonth: Goal = {
        month: currentMonth,
        teamGoal: currentTeamGoal,
        userGoals: newUserGoals,
    };
    
    setGoals(newGoalForMonth);
    alert('Metas guardadas y distribuidas exitosamente.');
  };
  
  const getCalculatedUserGoals = (userId: string): VendedorGoalSet | CajeroGoalSet => {
     const user = users.find(u => u.id === userId);
     if (!user) return {};

     if (user.role === 'Vendedor') {
        const vendedores = users.filter(u => u.role === 'Vendedor');
        const totalVendedorHours = vendedores.reduce((sum, u) => sum + (u.assignedHours || 0), 0);
        const participation = totalVendedorHours > 0 ? (user.assignedHours || 0) / totalVendedorHours : 0;
        return {
            metaPesos: Math.round((currentTeamGoal.metaPesos || 0) * participation),
            metaTickets: Math.round((currentTeamGoal.metaTickets || 0) * participation),
            metaUnidades: Math.round((currentTeamGoal.metaUnidades || 0) * participation),
            metaPesosMcCred: Math.round((currentTeamGoal.metaPesosMcCred || 0) * participation),
            metaUnidadesMcCred: Math.round((currentTeamGoal.metaUnidadesMcCred || 0) * participation),
            metaCalzado: Math.round((currentTeamGoal.metaCalzado || 0) * participation),
            metaIndumentaria: Math.round((currentTeamGoal.metaIndumentaria || 0) * participation),
            metaCamiseta: Math.round((currentTeamGoal.metaCamiseta || 0) * participation),
            metaAccesorios: Math.round((currentTeamGoal.metaAccesorios || 0) * participation),
        };
     }
     
     if (user.role === 'Cajero') {
        return {
            metaPesosMcCred: currentTeamGoal.metaPesosMcCred,
            metaUnidadesMcCred: currentTeamGoal.metaUnidadesMcCred,
            metaMedias: currentTeamGoal.metaMedias,
        };
     }

     return {};
  };

  const handleAddMessage = () => {
    if (newMessage.trim()) {
      addMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
          {viewMode === 'members' ? 'Miembros del Equipo' : 'Metas Mensuales'}
        </h2>
        {viewMode === 'members' && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              <PlusIcon />
              <span>Añadir Miembro</span>
            </button>
        )}
      </div>

      {viewMode === 'members' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-red-900">
                <thead className="bg-gray-50 dark:bg-black">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Rol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Horas Asignadas</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-red-900">
                    {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center">
                            <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full mr-3" />
                            {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{user.assignedHours}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-4">
                            <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"><EditIcon /></button>
                            <button onClick={() => deleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
          
           <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
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
                 {messages.length > 0 ? (
                    <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {messages.map(msg => (
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
        </div>
      )}

      {viewMode === 'goals' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Metas Totales del Equipo</h3>
                  <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)} className="p-2 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <GoalInput label="Meta Pesos ($)" value={currentTeamGoal.metaPesos} onChange={(v) => handleTeamGoalChange('metaPesos', v)} />
                  <GoalInput label="Meta Cantidad de Tickets" value={currentTeamGoal.metaTickets} onChange={(v) => handleTeamGoalChange('metaTickets', v)} />
                  <GoalInput label="Meta Unidades" value={currentTeamGoal.metaUnidades} onChange={(v) => handleTeamGoalChange('metaUnidades', v)} />
                  <GoalInput label="Meta Pesos MC Cred. ($)" value={currentTeamGoal.metaPesosMcCred} onChange={(v) => handleTeamGoalChange('metaPesosMcCred', v)} />
                  <GoalInput label="Meta Unidades MC Cred." value={currentTeamGoal.metaUnidadesMcCred} onChange={(v) => handleTeamGoalChange('metaUnidadesMcCred', v)} />
              </div>
              <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Sub-Metas de Unidades por Categoría</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {TEAM_SUB_GOALS.map(g => (
                      <GoalInput key={g.key} label={g.label} value={currentTeamGoal?.[g.key]} onChange={(v) => handleTeamGoalChange(g.key, v)} />
                  ))}
              </div>
               <div className="flex justify-end mt-6">
                    <button onClick={handleSaveGoals} className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700">
                        Guardar y Distribuir Metas
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Metas Asignadas por Colaborador (Solo Lectura)</h3>
                <div className="space-y-4">
                     {users.filter(u => u.role !== 'Encargado').map(user => {
                        const calculatedGoals = getCalculatedUserGoals(user.id);
                        return (
                            <div key={user.id} className="p-3 border dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-950">
                                <p className="font-bold text-md text-indigo-700 dark:text-red-500">{user.name} <span className="text-sm font-medium text-slate-500 dark:text-slate-400">- {user.role}</span></p>
                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {Object.entries(calculatedGoals).map(([key, value]) => (
                                        value !== undefined && value > 0 && (
                                            <div key={key}>
                                                <span className="font-semibold capitalize">{key.replace('meta', '')}: </span>
                                                <span>{typeof value === 'number' ? value.toLocaleString('es-AR') : value}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          </div>
      )}
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={userToEdit ? 'Editar Miembro' : 'Nuevo Miembro del Equipo'}>
        <TeamForm onSubmit={handleFormSubmit} onClose={handleCloseModal} userToEdit={userToEdit}/>
      </Modal>

    </div>
  );
};

export default Team;