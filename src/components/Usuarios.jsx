import React, { useState } from 'react';

export default function Usuarios({ users, onAddUser, onToggleUserStatus }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Admin');
  const [permissions, setPermissions] = useState({
    viewAnalytics: true,
    editBilling: false,
    manageApi: false,
    exportData: false
  });

  // Calculate dynamic stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const adminRoles = users.filter(u => u.role === 'Admin').length;
  const lockedAccounts = users.filter(u => u.status === 'Inactive').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return;

    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      role,
      status: 'Active',
      joinedDate: new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      initials,
      permissions
    };

    onAddUser(newUser);

    // Reset form
    setName('');
    setEmail('');
    setRole('Admin');
    setPermissions({
      viewAnalytics: true,
      editBilling: false,
      manageApi: false,
      exportData: false
    });
    setIsModalOpen(false);
  };

  const handlePermissionChange = (key) => {
    setPermissions({
      ...permissions,
      [key]: !permissions[key]
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-lg animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary font-bold">Control de Usuarios y Accesos</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Administra el personal, sus roles y permisos de seguridad granulares.</p>
        </div>
        <div className="flex gap-sm">
          <button 
            onClick={() => setSearchTerm('')}
            className="flex items-center gap-sm px-md py-sm bg-white border border-outline-variant text-on-surface font-semibold rounded-lg hover:bg-surface-container transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>Limpiar</span>
          </button>
          <button className="flex items-center gap-sm px-md py-sm bg-white border border-outline-variant text-on-surface font-semibold rounded-lg hover:bg-surface-container transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">file_download</span>
            <span>Exportar</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-sm px-md py-sm bg-secondary text-white font-semibold rounded-lg hover:opacity-95 transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>Agregar Usuario</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Usuarios Totales</p>
            <p className="font-headline-md text-headline-md text-primary font-bold">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Activos Ahora</p>
            <p className="font-headline-md text-headline-md text-primary font-bold">{activeUsers}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined">security</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Administradores</p>
            <p className="font-headline-md text-headline-md text-primary font-bold">{adminRoles}</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant p-md rounded-xl flex items-center gap-md">
          <div className="w-12 h-12 rounded-full bg-error-container/20 flex items-center justify-center text-error">
            <span className="material-symbols-outlined">report_problem</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Cuentas Inactivas</p>
            <p className="font-headline-md text-headline-md text-primary font-bold">{lockedAccounts}</p>
          </div>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="relative flex items-center bg-white rounded-xl border border-outline-variant p-sm max-w-md w-full shadow-sm">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px] ml-sm mr-xs">search</span>
        <input 
          className="bg-transparent border-none focus:ring-0 text-body-md font-body-md text-on-surface w-full focus:outline-none" 
          placeholder="Buscar usuarios, roles..." 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Main Data Table Container */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-md py-sm bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-title-lg text-title-lg text-primary font-semibold">Directorio de Usuarios</h3>
          <div className="flex gap-sm items-center">
            <span className="font-body-sm text-body-sm text-on-surface-variant">Mostrando 1-{filteredUsers.length} de {filteredUsers.length}</span>
            <div className="flex border border-outline-variant rounded-lg overflow-hidden">
              <button className="px-2 py-1 bg-surface border-r border-outline-variant hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="px-2 py-1 bg-surface hover:bg-surface-container transition-all">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-md py-sm border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nombre</th>
                <th className="px-md py-sm border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Correo Electrónico</th>
                <th className="px-md py-sm border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Rol Asignado</th>
                <th className="px-md py-sm border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="px-md py-sm border-b border-outline-variant font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-container-lowest transition-all group">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-9 h-9 rounded-full bg-secondary-container/30 flex items-center justify-center font-bold text-secondary text-body-sm">
                          {user.initials}
                        </div>
                        <div>
                          <p className="font-body-md font-bold text-primary">{user.name}</p>
                          <p className="font-body-sm text-[11px] text-on-surface-variant">Creado el {user.joinedDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-md font-body-md text-body-md text-on-surface">{user.email}</td>
                    <td className="px-md py-md">
                      <span className="inline-flex items-center gap-xs px-sm py-xs rounded-full bg-primary-container text-secondary-fixed font-label-sm text-label-sm border border-outline-variant/20">
                        <span className="material-symbols-outlined text-[14px]">shield_person</span>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-md py-md">
                      <span className={`inline-flex items-center gap-xs px-sm py-xs rounded-full font-label-sm text-label-sm border ${
                        user.status === 'Active' 
                          ? 'bg-secondary/10 text-secondary border-secondary/20' 
                          : 'bg-error/10 text-error border-error/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-secondary' : 'bg-error'}`}></span>
                        {user.status === 'Active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-md py-md text-right">
                      <div className="flex justify-end gap-xs md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-all" title="Editar">
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button 
                          onClick={() => onToggleUserStatus(user.id)}
                          className={`p-2 rounded-lg transition-all ${user.status === 'Active' ? 'hover:bg-error/10 text-error' : 'hover:bg-secondary/10 text-secondary'}`} 
                          title={user.status === 'Active' ? 'Desactivar' : 'Activar'}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {user.status === 'Active' ? 'block' : 'check_circle'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-on-surface-variant italic">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-md">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden border border-outline-variant animate-scale-up">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <h2 className="font-headline-sm text-headline-sm text-primary font-bold">Agregar Nuevo Usuario ERP</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-lg space-y-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">NOMBRE COMPLETO</label>
                  <input 
                    className="w-full border border-outline-variant rounded-lg p-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-body-md" 
                    placeholder="Ej: John Doe" 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-xs">
                  <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">CORREO LABORAL</label>
                  <input 
                    className="w-full border border-outline-variant rounded-lg p-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-body-md" 
                    placeholder="john.doe@empresa.com" 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">ROL PRINCIPAL DEL SISTEMA</label>
                <select 
                  className="w-full border border-outline-variant rounded-lg p-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-body-md bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Admin">Administrador - Acceso Total</option>
                  <option value="Ventas">Ventas - CRM y Presupuestos</option>
                  <option value="Contabilidad">Contador - Finanzas e Impuestos</option>
                  <option value="Soporte">Soporte - Mesa de Ayuda</option>
                </select>
              </div>

              {/* Permission Scope */}
              <div className="space-y-sm">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-bold uppercase">Permisos Específicos</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <label className="flex items-center gap-md p-sm border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all">
                    <input 
                      type="checkbox" 
                      className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                      checked={permissions.viewAnalytics}
                      onChange={() => handlePermissionChange('viewAnalytics')}
                    />
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Ver Analíticas</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Acceso de lectura a reportes</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-md p-sm border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all">
                    <input 
                      type="checkbox" 
                      className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                      checked={permissions.editBilling}
                      onChange={() => handlePermissionChange('editBilling')}
                    />
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Editar Facturación</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Crear facturas y pagos</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-md p-sm border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all">
                    <input 
                      type="checkbox" 
                      className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                      checked={permissions.manageApi}
                      onChange={() => handlePermissionChange('manageApi')}
                    />
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Gestionar API</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Generar tokens de desarrollo</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-md p-sm border border-outline-variant rounded-lg cursor-pointer hover:bg-surface-container-low transition-all">
                    <input 
                      type="checkbox" 
                      className="rounded border-outline-variant text-secondary focus:ring-secondary cursor-pointer"
                      checked={permissions.exportData}
                      onChange={() => handlePermissionChange('exportData')}
                    />
                    <div>
                      <p className="font-label-md text-label-md text-primary font-bold">Exportar Datos</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">Derecho a exportar en CSV/JSON</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="pt-lg flex justify-end gap-md border-t border-outline-variant/30">
                <button 
                  className="px-lg py-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all" 
                  onClick={() => setIsModalOpen(false)} 
                  type="button"
                >
                  Cancelar
                </button>
                <button 
                  className="bg-primary text-white px-xl py-sm rounded-lg font-semibold shadow-sm hover:bg-primary-container active:scale-95 transition-all" 
                  type="submit"
                >
                  Crear Cuenta de Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
