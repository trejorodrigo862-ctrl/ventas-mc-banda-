import React, { useState, useEffect } from 'react';
import { Theme, User } from '../types';

interface SettingsProps {
  currentTheme: Theme;
  setTheme: (theme: Theme) => void;
  currentUser: User;
  updateUser: (id: string, data: Partial<Omit<User, 'id'>>) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentTheme, setTheme, currentUser, updateUser }) => {
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setAvatarUrl(currentUser.avatarUrl);
  }, [currentUser.avatarUrl]);

  const handleSaveAvatar = () => {
    if (avatarUrl.trim()) {
      updateUser(currentUser.id, { avatarUrl });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000); // Hide message after 2 seconds
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-6">Ajustes</h2>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800 mb-6">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Tema de la Aplicación</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setTheme('light')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 w-full
              ${currentTheme === 'light'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
          >
            Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-6 py-3 font-semibold rounded-md transition-all duration-200 w-full
              ${currentTheme === 'dark'
                ? 'bg-red-600 text-white shadow'
                : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
              }
            `}
          >
            Oscuro
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Imagen de Perfil</h3>
        <div className="flex items-center space-x-4">
          <img 
            src={avatarUrl} 
            alt="Avatar actual" 
            className="w-20 h-20 rounded-full object-cover" 
            onError={(e) => e.currentTarget.src = `https://i.pravatar.cc/150?u=${currentUser.id}`} 
          />
          <div className="flex-grow">
            <label htmlFor="avatarUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL de la nueva imagen</label>
            <input
              type="text"
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.png"
              className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-red-500 dark:focus:border-red-500"
            />
          </div>
        </div>
        <div className="flex justify-end items-center mt-4">
            {isSaved && <p className="text-sm text-green-600 dark:text-green-400 mr-4">¡Guardado con éxito!</p>}
            <button
                onClick={handleSaveAvatar}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50"
                disabled={avatarUrl === currentUser.avatarUrl || !avatarUrl.trim()}
            >
                Guardar Cambios
            </button>
        </div>
      </div>

    </div>
  );
};

export default Settings;