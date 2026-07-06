import React, { useState } from 'react';

export default function Facturacion({ invoices, onUpdateInvoiceStatus, onAddInvoice, clients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  
  // Payment Registration Form State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  // Invoice creation form state (Optional, but great for realism!)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Calculate dynamic stats
  const totalFacturado = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const pagosPendientes = invoices
    .filter(inv => inv.status === 'No Pagada' || inv.status === 'Pago Parcial')
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  // We simulate "critical/expired" as invoices with status 'No Pagada' that have an amount > 5000 (just for simulation)
  const facturasVencidas = invoices
    .filter(inv => inv.status === 'No Pagada' && inv.amount > 5000)
    .reduce((sum, inv) => sum + inv.amount, 0);
  
  const countVencidas = invoices.filter(inv => inv.status === 'No Pagada' && inv.amount > 5000).length;

  const handleRegisterPaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    onUpdateInvoiceStatus(selectedInvoiceId, 'Pagada');
    setSelectedInvoiceId('');
    setPaymentAmount('');
    setIsPaymentModalOpen(false);
  };

  const handleCreateInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!clientName || !amount) return;

    const newInvoice = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName: clientName,
      amount: parseFloat(amount),
      dueDate: dueDate.split('-').reverse().join(' '), // Format: 15 Oct, 2026
      status: 'No Pagada'
    };

    onAddInvoice(newInvoice);
    setClientName('');
    setAmount('');
    setIsInvoiceModalOpen(false);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'Todas' || 
      inv.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-lg animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary font-bold">Gestión de Facturación</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Supervisión y control de transacciones financieras</p>
        </div>
        <div className="flex gap-sm">
          <button className="flex items-center gap-xs px-md py-sm border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant font-bold rounded-lg transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
            <span className="font-label-md text-label-md">Exportar PDF</span>
          </button>
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-xs px-md py-sm border border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant font-bold rounded-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="font-label-md text-label-md">Nueva Factura</span>
          </button>
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="flex items-center gap-xs px-md py-sm bg-secondary hover:bg-secondary/90 text-white font-bold rounded-lg transition-all shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add_card</span>
            <span className="font-label-md text-label-md">Registrar Pago</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Total Facturado */}
        <div className="bg-white p-lg border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Total Facturado (Histórico)</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-sm">
                ${totalFacturado.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-secondary-container/30 p-2 rounded-lg">
              <span className="material-symbols-outlined text-secondary">payments</span>
            </div>
          </div>
          <div className="mt-md flex items-center gap-sm">
            <span className="text-secondary font-bold text-sm flex items-center">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              +12.5%
            </span>
            <span className="text-on-surface-variant font-body-sm text-body-sm">vs mes anterior</span>
          </div>
        </div>

        {/* Pagos Pendientes */}
        <div className="bg-white p-lg border border-outline-variant rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Pagos Pendientes</p>
              <h3 className="font-display-lg text-display-lg text-primary mt-sm">
                ${pagosPendientes.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-surface-container-high p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">pending_actions</span>
            </div>
          </div>
          <div className="mt-md">
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
              <div 
                className="bg-secondary h-full rounded-full transition-all" 
                style={{ width: `${totalFacturado > 0 ? ((totalFacturado - pagosPendientes) / totalFacturado) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="text-body-sm font-body-sm mt-sm text-on-surface-variant">
              {totalFacturado > 0 ? Math.round(((totalFacturado - pagosPendientes) / totalFacturado) * 100) : 0}% de la facturación cobrada
            </p>
          </div>
        </div>

        {/* Facturas Vencidas (High Alert) */}
        <div className="bg-white p-lg border border-error/20 border-l-4 border-l-error rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-label-md text-label-md text-error uppercase tracking-wider font-bold">Vencidas Críticas</p>
              <h3 className="font-display-lg text-display-lg text-error mt-sm">
                ${facturasVencidas.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="bg-error-container p-2 rounded-lg">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
          </div>
          <div className="mt-md flex items-center gap-sm text-error">
            <span className="font-bold text-sm">{countVencidas} facturas vencidas críticas</span>
          </div>
        </div>
      </div>

      {/* Central Invoices Table Card */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-lg py-md border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row justify-between items-center gap-sm">
          <div className="flex items-center gap-md w-full sm:max-w-xs">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
              <input 
                className="w-full pl-10 pr-4 py-1.5 bg-white border border-outline-variant rounded-lg text-body-sm focus:outline-none" 
                placeholder="Buscar por ID o Cliente..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-sm">
            {['Todas', 'Pagada', 'Pago Parcial', 'No Pagada'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-sm py-1 rounded text-xs font-semibold ${
                  statusFilter === status 
                    ? 'bg-primary text-white' 
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-bright">
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">ID FACTURA</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">CLIENTE</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">MONTO TOTAL</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant">VENCIMIENTO</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant text-center">ESTADO</th>
                <th className="px-lg py-sm font-label-md text-label-md text-on-surface-variant border-b border-outline-variant text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-container-lowest transition-colors cursor-pointer group">
                    <td className="px-lg py-md font-body-md text-body-md text-primary font-semibold">{inv.id}</td>
                    <td className="px-lg py-md font-body-md text-body-md">{inv.clientName}</td>
                    <td className="px-lg py-md font-body-md text-body-md font-bold">
                      ${inv.amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-lg py-md font-body-md text-body-md ${
                      inv.status === 'No Pagada' && inv.amount > 5000 ? 'text-error font-semibold' : 'text-on-surface-variant'
                    }`}>{inv.dueDate}</td>
                    <td className="px-lg py-md text-center">
                      <span className={`inline-flex items-center px-sm py-xs rounded-full text-[11px] font-bold uppercase ${
                        inv.status === 'Pagada'
                          ? 'bg-secondary-container/30 text-on-secondary-container'
                          : inv.status === 'Pago Parcial'
                          ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                          : 'bg-error-container text-on-error-container'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-lg py-md text-right md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-outline hover:text-primary">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-on-surface-variant italic">
                    No se encontraron facturas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-lg py-sm bg-surface-bright border-t border-outline-variant flex justify-between items-center text-label-md text-on-surface-variant">
          <span>Mostrando {filteredInvoices.length} de {invoices.length} facturas</span>
          <div className="flex gap-xs">
            <button className="px-2 py-1 rounded hover:bg-surface-container-low transition-colors" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="px-3 py-1 rounded bg-secondary text-white font-bold">1</button>
            <button className="px-2 py-1 rounded hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Activity / Quick Stats */}
      <div className="flex flex-col lg:flex-row gap-lg">
        <div className="flex-1 bg-white p-lg border border-outline-variant rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-md">
            <h5 className="font-title-lg text-title-lg text-primary font-semibold">Flujo Mensual</h5>
            <span className="text-on-surface-variant font-label-md text-label-md">Últimos 30 días</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 px-md">
            <div className="bg-surface-container-high w-full rounded-t" style={{ height: '40%' }}></div>
            <div className="bg-surface-container-high w-full rounded-t" style={{ height: '65%' }}></div>
            <div className="bg-secondary w-full rounded-t" style={{ height: '85%' }}></div>
            <div className="bg-surface-container-high w-full rounded-t" style={{ height: '55%' }}></div>
            <div className="bg-surface-container-high w-full rounded-t" style={{ height: '70%' }}></div>
            <div className="bg-secondary w-full rounded-t" style={{ height: '95%' }}></div>
            <div className="bg-surface-container-high w-full rounded-t" style={{ height: '45%' }}></div>
          </div>
          <div className="flex justify-between mt-sm text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter">
            <span>S1</span><span>S2</span><span className="text-secondary font-bold">S3</span><span>S4</span><span>S5</span><span className="text-secondary font-bold">S6</span><span>S7</span>
          </div>
        </div>
        <div className="lg:w-1/3 bg-primary text-white p-lg border border-outline-variant rounded-xl shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 text-left">
            <h5 className="font-title-lg text-title-lg mb-sm font-semibold">Asistente de Conciliación</h5>
            <p className="font-body-sm text-body-sm opacity-80 mb-lg">Tienes 24 transacciones bancarias listas para ser vinculadas con facturas pendientes.</p>
          </div>
          <button className="w-full py-sm bg-secondary-fixed text-on-secondary-fixed font-bold rounded-lg hover:bg-secondary-fixed-dim transition-all relative z-10 active:scale-95">
            Comenzar ahora
          </button>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <span className="material-symbols-outlined text-[160px]">account_balance_wallet</span>
          </div>
        </div>
      </div>

      {/* Modal: Registrar Pago */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-outline-variant shadow-lg max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-primary text-white p-lg flex justify-between items-center">
              <h3 className="font-title-lg text-title-lg font-bold flex items-center gap-sm">
                <span className="material-symbols-outlined">add_card</span>
                Registrar Pago de Factura
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-white hover:text-secondary-fixed transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRegisterPaymentSubmit} className="p-lg flex flex-col gap-md text-left">
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Factura a Pagar</label>
                <select 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find(i => i.id === e.target.value);
                    if (inv) setPaymentAmount(inv.amount);
                  }}
                  required
                >
                  <option value="">Seleccione una factura pendiente...</option>
                  {invoices.filter(i => i.status !== 'Pagada').map(i => (
                    <option key={i.id} value={i.id}>{i.id} - {i.clientName} (${i.amount})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Monto del Pago</label>
                <input 
                  type="number"
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="flex gap-md justify-end mt-sm">
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-lg py-md border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-white hover:bg-primary-container rounded-lg font-bold transition-all active:scale-[0.98]"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear Factura */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-outline-variant shadow-lg max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-primary text-white p-lg flex justify-between items-center">
              <h3 className="font-title-lg text-title-lg font-bold flex items-center gap-sm">
                <span className="material-symbols-outlined">receipt_long</span>
                Crear Nueva Factura
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-white hover:text-secondary-fixed transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateInvoiceSubmit} className="p-lg flex flex-col gap-md text-left">
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Cliente</label>
                <select 
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                >
                  <option value="">Seleccione Cliente...</option>
                  {clients.map(c => {
                    const val = c.name || c.company;
                    const label = c.name ? `${c.name} (${c.company})` : c.company;
                    return (
                      <option key={c.id} value={val}>{label}</option>
                    );
                  })}
                  {clientName && !clients.some(c => (c.name || c.company) === clientName) && (
                    <option value={clientName}>{clientName}</option>
                  )}
                </select>
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Monto de la Factura</label>
                <input 
                  type="number"
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Monto en $"
                  required
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">Fecha de Vencimiento</label>
                <input 
                  type="date"
                  className="w-full px-md py-md bg-surface-container-low border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-md justify-end mt-sm">
                <button 
                  type="button" 
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-lg py-md border border-outline-variant text-on-surface-variant rounded-lg font-bold hover:bg-surface-container-low transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-md bg-primary text-white hover:bg-primary-container rounded-lg font-bold transition-all active:scale-[0.98]"
                >
                  Generar Factura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
