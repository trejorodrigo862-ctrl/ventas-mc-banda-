
import React, { useState, useEffect } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
// FIX: Removed unused 'Product' type import which is not exported from './types'.
import { Sale, View, User, UserRole, Goal, Theme, StoreProgress, Message, IndividualProgress } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Team from './components/Products'; // Repurposed Products as Team
import Sales from './components/Sales';
import Reports from './components/Insights'; // Repurposed Insights as Reports
import Settings from './components/Settings';
import Informes from './components/Informes';
import MyGoals from './components/MyGoals';
import Commissions from './components/Commissions';
import MyCommissions from './components/MyCommissions';
import { MenuIcon } from './components/icons';

const initialUsers: User[] = [
    { id: 'user-1', name: 'Admin', role: 'Encargado', avatarUrl: 'https://i.pravatar.cc/150?u=admin', assignedHours: 40 },
    { id: 'user-2', name: 'Ana', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=ana', assignedHours: 35 },
    { id: 'user-3', name: 'Juan', role: 'Vendedor', avatarUrl: 'https://i.pravatar.cc/150?u=juan', assignedHours: 20 },
    { id: 'user-4', name: 'Luis', role: 'Cajero', avatarUrl: 'https://i.pravatar.cc/150?u=luis', assignedHours: 30 },
];

const SALE_CATEGORIES_FOR_MOCK = ['Calzado', 'Indumentaria', 'Accesorios', 'Camisetas', 'Medias'];
const initialSales: Sale[] = Array.from({ length: 50 }, (_, i) => {
    const seller = initialUsers[Math.floor(Math.random() * 2) + 1];
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 90));
    return {
        id: `sale-${i}`,
        sellerId: seller.id,
        sellerName: seller.name,
        amount: Math.floor(Math.random() * 20000) + 500,
        units: Math.floor(Math.random() * 5) + 1,
        category: SALE_CATEGORIES_FOR_MOCK[Math.floor(Math.random() * SALE_CATEGORIES_FOR_MOCK.length)] as any,
        type: ['Contado', 'Tarjeta'][Math.floor(Math.random() * 2)] as any,
        date: date.toISOString().split('T')[0],
    };
});

const initialGoals: Goal[] = [{
    month: new Date().toISOString().slice(0, 7),
    teamGoal: { 
        metaPesos: 3000000, metaTickets: 350, metaUnidades: 1200,
        metaPesosMcCred: 500000, metaUnidadesMcCred: 200,
        metaCalzado: 500, metaIndumentaria: 350, metaAccesorios: 150,
        metaCamiseta: 150, metaMedias: 50
    },
    userGoals: {
        'user-2': { // Ana (Vendedor)
            metaPesos: 150000, metaUnidades: 100,
            metaCalzado: 40, metaIndumentaria: 30, metaCamiseta: 10, metaAccesorios: 15,
        },
        'user-3': { // Juan (Vendedor)
            metaPesos: 150000, metaUnidades: 100,
            metaCalzado: 40, metaIndumentaria: 30, metaCamiseta: 10, metaAccesorios: 15,
        },
        'user-4': { // Luis (Cajero)
            metaPesosMcCred: 50000, metaUnidadesMcCred: 20, metaMedias: 10,
        }
    }
}];

const LoginScreen: React.FC<{ users: User[], onLogin: (user: User) => void }> = ({ users, onLogin }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-black p-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-2 text-center">Ventas Mc Banda</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-center">Selecciona tu perfil para continuar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-4xl">
            {users.map(user => (
                <div key={user.id} onClick={() => onLogin(user)} className="flex flex-col items-center p-4 sm:p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md cursor-pointer transform hover:scale-105 transition-transform duration-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-red-600">
                    <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full mb-4" />
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 text-center">{user.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{user.role}</p>
                </div>
            ))}
        </div>
    </div>
);


const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [users, setUsers] = useLocalStorage<User[]>('mcbanda_users', initialUsers);
  const [sales, setSales] = useLocalStorage<Sale[]>('mcbanda_sales', initialSales);
  const [goals, setGoals] = useLocalStorage<Goal[]>('mcbanda_goals', initialGoals);
  const [storeProgress, setStoreProgress] = useLocalStorage<StoreProgress[]>('mcbanda_store_progress', []);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('mcbanda_currentUser', null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<Theme>('mcbanda_theme', 'dark');
  const [messages, setMessages] = useLocalStorage<Message[]>('mcbanda_messages', []);
  const [individualProgress, setIndividualProgress] = useLocalStorage<IndividualProgress[]>('mcbanda_individual_progress', []);

  useEffect(() => {
    // Forzando el tema oscuro para esta sesión para asegurar que se aplique.
    setTheme('dark');
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('dashboard');
  }
  
  const handleLogout = () => {
    setCurrentUser(null);
  }

  const addUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = { ...userData, id: new Date().getTime().toString() };
    setUsers([...users, newUser]);
  };
  
  const updateUser = (id: string, updatedData: Partial<Omit<User, 'id'>>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updatedData } : u));
    if (currentUser && currentUser.id === id) {
      setCurrentUser({ ...currentUser, ...updatedData });
    }
  };
  
  const deleteUser = (id: string) => {
     if (sales.some(sale => sale.sellerId === id)) {
      alert("No se puede eliminar un usuario con ventas asociadas.");
      return;
    }
    setUsers(users.filter(u => u.id !== id));
  };

  const addSale = (saleData: Omit<Sale, 'id' | 'sellerName'>) => {
    const seller = users.find(u => u.id === saleData.sellerId);
    if (!seller) return;
    const newSale: Sale = { ...saleData, id: new Date().getTime().toString(), sellerName: seller.name };
    setSales([...sales, newSale]);
  };

  const deleteSale = (saleId: string) => {
    setSales(sales.filter(s => s.id !== saleId));
  };

  const handleSetGoals = (newGoalsForMonth: Goal) => {
    const otherMonthsGoals = goals.filter(g => g.month !== newGoalsForMonth.month);
    setGoals([...otherMonthsGoals, newGoalsForMonth]);
  }

  const addStoreProgress = (progressData: Omit<StoreProgress, 'id'>) => {
    const newProgress: StoreProgress = { ...progressData, id: new Date().getTime().toString() };
    setStoreProgress([...storeProgress, newProgress]);
  };

  const updateStoreProgress = (id: string, updatedData: Partial<Omit<StoreProgress, 'id'>>) => {
    setStoreProgress(storeProgress.map(p => p.id === id ? { ...p, ...updatedData } : p));
  };

  const deleteStoreProgress = (id: string) => {
    setStoreProgress(storeProgress.filter(p => p.id !== id));
  };
  
  const addIndividualProgress = (progressData: Omit<IndividualProgress, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newProgress: IndividualProgress = {
      ...progressData,
      id: new Date().getTime().toString(),
      userId: currentUser.id,
    };
    setIndividualProgress(prev => [newProgress, ...prev]);
  };

  const updateIndividualProgress = (id: string, updatedData: Partial<Omit<IndividualProgress, 'id' | 'userId'>>) => {
    setIndividualProgress(individualProgress.map(p => (p.id === id ? { ...p, ...updatedData } : p)));
  };

  const deleteIndividualProgress = (id: string) => {
    setIndividualProgress(individualProgress.filter(p => p.id !== id));
  };


  const addMessage = (content: string) => {
    const newMessage: Message = {
      id: new Date().getTime().toString(),
      content,
      date: new Date().toISOString(),
    };
    setMessages(prev => [newMessage, ...prev]);
  };

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const renderView = () => {
    if(!currentUser) return null;
    switch (view) {
      case 'dashboard':
        return <Dashboard sales={sales} users={users} currentUser={currentUser} goals={goals} theme={theme} storeProgress={storeProgress} messages={messages} addMessage={addMessage} deleteMessage={deleteMessage} />;
      case 'team':
        if(currentUser.role === 'Encargado') {
            return <Team viewMode="members" users={users} goals={goals} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} setGoals={handleSetGoals} messages={messages} addMessage={addMessage} deleteMessage={deleteMessage} />;
        }
        break;
      case 'goals':
        if(currentUser.role === 'Encargado') {
            return <Team viewMode="goals" users={users} goals={goals} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} setGoals={handleSetGoals} messages={messages} addMessage={addMessage} deleteMessage={deleteMessage} />;
        }
        break;
      case 'my-goals':
        if (['Vendedor', 'Cajero'].includes(currentUser.role)) {
            return <MyGoals currentUser={currentUser} goals={goals} />;
        }
        break;
      case 'my-commissions':
        if (['Vendedor', 'Cajero'].includes(currentUser.role)) {
            return <MyCommissions currentUser={currentUser} goals={goals} individualProgress={individualProgress.filter(p => p.userId === currentUser.id)} storeProgress={storeProgress} />;
        }
        break;
      case 'sales':
        return <Sales
                  currentUser={currentUser}
                  storeProgress={storeProgress}
                  addStoreProgress={addStoreProgress}
                  updateStoreProgress={updateStoreProgress}
                  deleteStoreProgress={deleteStoreProgress}
                  individualProgress={individualProgress.filter(p => p.userId === currentUser.id)}
                  addIndividualProgress={addIndividualProgress}
                  updateIndividualProgress={updateIndividualProgress}
                  deleteIndividualProgress={deleteIndividualProgress}
                />;
      case 'reports':
        if(currentUser.role === 'Encargado') {
            return <Reports sales={sales} users={users} goals={goals} theme={theme} storeProgress={storeProgress} />;
        }
        break;
      case 'commissions':
        if(currentUser.role === 'Encargado') {
            return <Commissions users={users} goals={goals} storeProgress={storeProgress} individualProgress={individualProgress} />;
        }
        break;
      case 'informes':
        if(currentUser.role === 'Encargado') {
            return <Informes sales={sales} users={users} goals={goals} theme={theme} storeProgress={storeProgress} />;
        }
        break;
      case 'settings':
        return <Settings currentTheme={theme} setTheme={setTheme} currentUser={currentUser} updateUser={updateUser} />;
      default:
        return <Dashboard sales={sales} users={users} currentUser={currentUser} goals={goals} theme={theme} storeProgress={storeProgress} messages={messages} addMessage={addMessage} deleteMessage={deleteMessage} />;
    }
  };

  if (!currentUser) {
    return <LoginScreen users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black">
      <Sidebar 
        currentView={view} 
        setCurrentView={setView} 
        currentUser={currentUser} 
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 p-4 sm:p-8 lg:ml-64 overflow-y-auto bg-gray-100 dark:bg-black">
        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 mb-4 -ml-2 text-slate-600 dark:text-slate-400">
            <MenuIcon />
        </button>
        {renderView()}
      </main>
    </div>
  );
};

export default App;