import React, { useState, useEffect } from 'react';

export default function Presupuestos({ quotes, clients, onAddQuote }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New quote form state
  const [selectedClient, setSelectedClient] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState(30);
  const [quoteTitle, setQuoteTitle] = useState('Servicios ERP');
  const [lineItems, setLineItems] = useState([
    { id: 1, description: 'Enterprise Server License (Standard)', qty: 2, price: 1200.00 }
  ]);

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Calculate totals
  useEffect(() => {
    let sub = 0;
    lineItems.forEach(item => {
      sub += (item.qty || 0) * (item.price || 0);
    });
    const tx = sub * 0.16; // 16% tax
    setSubtotal(sub);
    setTax(tx);
    setTotal(sub + tx);
  }, [lineItems]);

  const handleAddRow = () => {
    setLineItems([
      ...lineItems,
      { id: Date.now(), description: '', qty: 1, price: 0 }
    ]);
  };

  const handleRemoveRow = (id) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          [field]: field === 'description' ? value : parseFloat(value) || 0
        };
      }
      return item;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient || selectedClient === 'Select Client...') {
      alert('Por favor seleccione un cliente');
      return;
    }

    const clientObj = clients.find(c => c.name === selectedClient) || { name: selectedClient };

    const newQuote = {
      id: `QT-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: clientObj.name,
      company: clientObj.company || 'N/A',
      title: quoteTitle,
      date: issueDate.split('-').reverse().join('/'),
      amount: total,
      validity: `${validity} días`,
      status: 'Borrador',
      items: lineItems
    };

    onAddQuote(newQuote);

    // Reset form
    setSelectedClient('');
    setValidity(30);
    setQuoteTitle('Servicios ERP');
    setLineItems([{ id: 1, description: 'Enterprise Server License (Standard)', qty: 2, price: 1200.00 }]);
    setIsModalOpen(false);
  };

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'Todos' || 
      quote.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-xl animate-fade-in text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary font-bold">Gestión de Presupuestos</h2>
          <p className="text-on-surface-variant font-body-md mt-1">Crea, edita y haz seguimiento de cotizaciones para tus clientes.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setSearchTerm('')}
            className="flex items-center gap-2 px-md py-2 border border-outline-variant rounded bg-white text-on-surface hover:bg-slate-50 transition-all font-label-md active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>Limpiar</span>
          </button>
          <button className="flex items-center gap-2 px-md py-2 border border-outline-variant rounded bg-white text-on-surface hover:bg-slate-50 transition-all font-label-md active:scale-95">
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Exportar PDF</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-md py-2 bg-secondary text-white rounded hover:brightness-105 transition-all font-label-md font-bold active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Filter and Summary Bar */}
      <section className="glass-card rounded-xl p-md flex flex-wrap items-center justify-between gap-md shadow-sm">
        <div className="flex-grow max-w-md min-w-[240px]">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input 
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-secondary focus:outline-none" 
              placeholder="Buscar por ID, cliente o descripción..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-sm">
          {['Todos', 'Borrador', 'Enviado', 'Aprobado', 'Vencido'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-md py-1.5 rounded-lg text-body-sm transition-all font-semibold ${
                statusFilter === status 
                  ? 'bg-primary text-white' 
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      {/* Data Table Section */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">ID Presupuesto</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Cliente</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha de Emisión</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Monto Total</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Validez</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Estado</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredQuotes.length > 0 ? (
                filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-md font-body-md font-bold text-primary">{quote.id}</td>
                    <td className="p-md">
                      <div className="flex flex-col">
                        <span className="font-body-md font-bold text-on-surface">{quote.clientName}</span>
                        <span className="text-label-sm text-on-surface-variant">{quote.title}</span>
                      </div>
                    </td>
                    <td className="p-md font-body-md text-on-surface">{quote.date}</td>
                    <td className="p-md font-body-md font-bold text-on-surface text-right">
                      ${quote.amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-md font-body-md text-on-surface">{quote.validity}</td>
                    <td className="p-md">
                      <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold border ${
                        quote.status === 'Borrador'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : quote.status === 'Enviado'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : quote.status === 'Aprobado'
                          ? 'bg-secondary-container text-on-secondary-container border-secondary/20'
                          : 'bg-error-container text-on-error-container border-error/20'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="p-md text-center">
                      <button className="p-1 hover:bg-slate-100 rounded text-on-surface-variant">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-on-surface-variant italic">
                    No se encontraron presupuestos que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Footer */}
        <div className="p-md bg-surface-container-low flex justify-between items-center border-t border-outline-variant">
          <span className="text-label-md text-on-surface-variant">
            Mostrando {filteredQuotes.length} de {quotes.length} presupuestos
          </span>
          <div className="flex gap-2">
            <button className="p-2 border border-outline-variant rounded bg-white hover:bg-slate-50 transition-all disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="p-2 border border-outline-variant rounded bg-white hover:bg-slate-50 transition-all">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Backdrop: New Quote Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm">
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0 z-10">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Crear Nuevo Presupuesto</h2>
                <p className="text-body-md text-on-surface-variant">Borrador de Cotización #QT-{Math.floor(9040 + Math.random() * 50)}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Modal Content (Form) */}
            <form onSubmit={handleSubmit} className="p-lg space-y-lg text-left">
              {/* Client & Title & Dates */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-lg">
                <div className="flex flex-col gap-xs md:col-span-2">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Cliente</label>
                  <select 
                    className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    required
                  >
                    <option value="">Seleccione Cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.name}>{c.name} ({c.company})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Fecha de Emisión</label>
                  <input 
                    className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all" 
                    type="date" 
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Validez (Días)</label>
                  <input 
                    className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all" 
                    type="number" 
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Título / Proyecto</label>
                <input 
                  className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all" 
                  type="text" 
                  value={quoteTitle}
                  onChange={(e) => setQuoteTitle(e.target.value)}
                  placeholder="Ej: Licencias e Implementación de Servidores"
                  required
                />
              </div>

              {/* Line Item Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-md text-label-md text-on-surface-variant uppercase font-bold border-b border-slate-200">Descripción del Ítem</th>
                      <th className="p-md text-label-md text-on-surface-variant uppercase font-bold border-b border-slate-200 w-24">Cant</th>
                      <th className="p-md text-label-md text-on-surface-variant uppercase font-bold border-b border-slate-200 w-40">Precio Unitario</th>
                      <th className="p-md text-label-md text-on-surface-variant uppercase font-bold border-b border-slate-200 w-40">Subtotal</th>
                      <th className="p-md text-label-md text-on-surface-variant uppercase font-bold border-b border-slate-200 w-16"></th>
                    </tr>
                  </thead>
                  <tbody id="line-items">
                    {lineItems.map((item) => (
                      <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="p-md border-b border-slate-100">
                          <input 
                            className="w-full bg-transparent border-0 focus:ring-0 text-body-md p-0 outline-none" 
                            placeholder="Descripción del ítem o servicio..." 
                            type="text" 
                            value={item.description}
                            onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                            required
                          />
                        </td>
                        <td className="p-md border-b border-slate-100">
                          <input 
                            className="w-full bg-transparent border-0 focus:ring-0 text-body-md p-0 line-qty outline-none" 
                            type="number" 
                            value={item.qty}
                            onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                            min="1"
                            required
                          />
                        </td>
                        <td className="p-md border-b border-slate-100">
                          <div className="flex items-center gap-1">
                            <span className="text-on-surface-variant">$</span>
                            <input 
                              className="w-full bg-transparent border-0 focus:ring-0 text-body-md p-0 line-price outline-none" 
                              type="number" 
                              value={item.price}
                              onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </td>
                        <td className="p-md border-b border-slate-100">
                          <span className="text-body-md font-bold line-total">
                            ${((item.qty || 0) * (item.price || 0)).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="p-md border-b border-slate-100 text-right">
                          <button 
                            className="text-slate-300 hover:text-red-500 transition-colors" 
                            type="button"
                            onClick={() => handleRemoveRow(item.id)}
                            disabled={lineItems.length === 1}
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-md bg-slate-50/50">
                  <button 
                    className="text-secondary font-bold text-label-md flex items-center gap-2 hover:opacity-80 transition-opacity" 
                    type="button"
                    onClick={handleAddRow}
                  >
                    <span className="material-symbols-outlined text-sm">add</span> 
                    <span>Agregar Fila</span>
                  </button>
                </div>
              </div>

              {/* Totals Calculation */}
              <div className="flex flex-col items-end gap-2 pt-lg">
                <div className="w-64 flex justify-between px-md py-1 border-b border-slate-100">
                  <span className="text-label-md text-on-surface-variant">Subtotal</span>
                  <span className="text-body-md font-medium">
                    ${subtotal.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-64 flex justify-between px-md py-1 border-b border-slate-100">
                  <span className="text-label-md text-on-surface-variant">Impuesto (16%)</span>
                  <span className="text-body-md font-medium">
                    ${tax.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="w-64 flex justify-between px-md py-3 bg-secondary-container/30 rounded mt-2">
                  <span className="text-title-lg font-black text-secondary">Total</span>
                  <span className="text-title-lg font-black text-secondary">
                    ${total.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-md pt-lg border-t border-outline-variant">
                <button 
                  className="px-lg py-2 border border-outline-variant rounded text-on-surface hover:bg-slate-50 transition-all font-bold" 
                  onClick={() => setIsModalOpen(false)} 
                  type="button"
                >
                  Descartar
                </button>
                <button 
                  type="submit"
                  className="px-lg py-2 bg-secondary text-white rounded hover:brightness-110 transition-all font-bold shadow-lg shadow-secondary/20 active:scale-95"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
