import React, { useState } from 'react';

export default function CRM({ clients, onAddClient, onSelectClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los estados');
  
  // New client form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('Cliente Activo');

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      client.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'Todos los estados' || 
      client.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !company || !email) return;
    
    // Add client
    onAddClient({
      id: Date.now().toString(),
      name,
      company,
      email,
      phone: phone || 'N/A',
      status,
      initials: name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    });

    // Reset form
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setStatus('Cliente Activo');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-xl animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-xl gap-md">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Registro de Clientes</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Gestión centralizada de prospectos y clientes activos de la organización.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-secondary text-white px-lg py-md rounded-lg font-bold flex items-center justify-center gap-sm hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          <span>+ Crear Cliente</span>
        </button>
      </div>

      {/* Filter Bar */}
      <section className="glass-card rounded-xl p-md flex flex-wrap items-end gap-md shadow-sm">
        <div className="flex-grow min-w-[240px]">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Buscar Cliente/Empresa</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-secondary focus:outline-none" 
              placeholder="Ej: Tech Corp o Alejandro..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase">Estado</label>
          <select 
            className="w-full px-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-secondary focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>Todos los estados</option>
            <option>Prospecto</option>
            <option>Cliente Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
        <button 
          onClick={() => { setSearchTerm(''); setStatusFilter('Todos los estados'); }}
          className="px-lg py-2 border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-low transition-colors flex items-center gap-sm"
        >
          <span className="material-symbols-outlined text-[18px]">clear_all</span>
          <span>Limpiar</span>
        </button>
      </section>

      {/* CRM Main Table Container */}
      <div className="glass-card rounded-xl shadow-sm overflow-hidden">
        <div className="bg-surface-container-low px-lg py-md border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-title-lg text-title-lg text-primary font-semibold">Lista de Clientes</h3>
          <div className="flex gap-sm">
            <button className="p-2 hover:bg-white rounded transition-colors text-on-surface-variant" title="Exportar CSV">
              <span className="material-symbols-outlined">download</span>
            </button>
            <button className="p-2 hover:bg-white rounded transition-colors text-on-surface-variant" title="Imprimir">
              <span className="material-symbols-outlined">print</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant">Nombre del Cliente</th>
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant">Empresa</th>
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant">Correo de Contacto</th>
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant">Teléfono</th>
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant">Estado</th>
                <th className="px-lg py-4 font-label-md text-label-md text-on-surface-variant uppercase border-b border-outline-variant text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="px-lg py-4">
                      <div className="flex items-center gap-sm">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          client.status === 'Cliente Activo' 
                            ? 'bg-secondary-container text-on-secondary-container' 
                            : client.status === 'Inactivo'
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-primary-fixed text-on-primary-fixed'
                        }`}>
                          {client.initials}
                        </div>
                        <span className="font-body-md text-body-md text-primary font-medium">{client.name}</span>
                      </div>
                    </td>
                    <td className="px-lg py-4 text-body-md text-on-surface-variant">{client.company}</td>
                    <td className="px-lg py-4 text-body-md text-on-surface-variant">{client.email}</td>
                    <td className="px-lg py-4 text-body-md text-on-surface-variant">{client.phone}</td>
                    <td className="px-lg py-4">
                      <span className={`px-sm py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                        client.status === 'Cliente Activo'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : client.status === 'Inactivo'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-lg py-4 text-right">
                      <div className="flex justify-end gap-md md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onSelectClient(client)}
                          className="text-on-surface-variant hover:text-secondary" 
                          title="Ver Detalle"
                        >
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button className="text-on-surface-variant hover:text-primary" title="Editar">
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-on-surface-variant italic">
                    No se encontraron clientes que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-lg py-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
          <p className="text-body-sm text-on-surface-variant italic">
            Mostrando {filteredClients.length} de {clients.length} clientes registrados
          </p>
          <div className="flex items-center gap-base">
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-on-surface-variant disabled:opacity-30" disabled>
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-secondary text-white font-bold text-xs">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-on-surface-variant text-xs">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-white text-on-surface-variant">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Insights (Asymmetric Design) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl mt-xl">
        <div className="lg:col-span-2 glass-card rounded-xl p-lg flex items-center gap-lg">
          <div className="flex-1">
            <h4 class="font-title-lg text-title-lg text-primary mb-2 font-semibold">Análisis de Conversión</h4>
            <p className="text-body-md text-on-surface-variant mb-4">La tasa de conversión de Prospectos a Clientes Activos ha subido un 12% este mes.</p>
            <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-secondary-fixed" style={{ width: '68%' }}></div>
            </div>
            <div className="mt-2 flex justify-between text-label-md text-on-surface-variant uppercase font-semibold">
              <span>Eficiencia de Cierre</span>
              <span>68% Meta Mensual</span>
            </div>
          </div>
          <div className="hidden sm:block w-32 h-32 relative flex-shrink-0">
            <svg className="w-full h-full text-secondary transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="100, 100" strokeWidth="4"></path>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="68, 100" strokeLinecap="round" strokeWidth="4"></path>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-title-lg font-bold">68%</span>
            </div>
          </div>
        </div>
        <div className="bg-primary-container rounded-xl p-lg text-on-primary-container flex flex-col justify-center relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-[80px]" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
          </div>
          <h4 className="font-title-lg text-title-lg font-bold text-white mb-1">Crecimiento CRM</h4>
          <p className="text-body-sm mb-4">Nuevos prospectos registrados hoy: <span className="text-secondary-fixed font-bold">+24</span></p>
          <button className="w-fit px-md py-2 border border-on-primary-container/30 rounded-lg text-body-sm hover:bg-white/10 text-white transition-colors">
            Ver Informe Diario
          </button>
        </div>
      </div>

      {/* modal window / Crear cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-lg border border-outline-variant max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-primary text-white p-lg flex justify-between items-center">
              <h3 className="font-title-lg text-title-lg font-bold flex items-center gap-sm">
                <span className="material-symbols-outlined">person_add</span>
                Registrar Nuevo Cliente
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-secondary-fixed transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-lg flex flex-col gap-md">
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Nombre Completo
                </label>
                <input 
                  type="text" 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                  placeholder="Ej: Alejandro Sánchez"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Empresa
                </label>
                <input 
                  type="text" 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                  placeholder="Ej: TechNova Solutions"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                  placeholder="ejemplo@empresa.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Teléfono
                </label>
                <input 
                  type="text" 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none" 
                  placeholder="Ej: +34 912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">
                  Estado Inicial
                </label>
                <select 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option>Cliente Activo</option>
                  <option>Prospecto</option>
                  <option>Inactivo</option>
                </select>
              </div>
              <div className="flex gap-md mt-sm justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-lg py-md border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-white hover:bg-primary-container rounded-lg font-bold transition-all active:scale-[0.98]"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
