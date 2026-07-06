import React, { useState } from 'react';

export default function Proyectos({ projects, setProjects, clients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  
  // Edit project modal state
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editSuperficie, setEditSuperficie] = useState('');
  const [editRentabilidad, setEditRentabilidad] = useState('');
  const [editAnio, setEditAnio] = useState('');
  const [editCliente, setEditCliente] = useState('');

  // Search filter
  const filteredProjects = projects.filter(project => {
    const term = searchTerm.toLowerCase();
    return (
      project.projectName.toLowerCase().includes(term) ||
      project.cliente.toLowerCase().includes(term) ||
      project.anio.toString().includes(term)
    );
  });

  // Calculate KPIs
  const totalProjects = projects.length;
  const totalUF = projects.reduce((acc, p) => 
    acc + p.budgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0)
  , 0);
  const avgProfitability = projects.length > 0 
    ? (projects.reduce((acc, p) => acc + (parseFloat(p.rentabilidad) || 0), 0) / projects.length).toFixed(1)
    : 0;
  const totalSurface = projects.reduce((acc, p) => acc + (parseFloat(p.superficie) || 0), 0);

  const toggleExpand = (id) => {
    if (expandedProjectId === id) {
      setExpandedProjectId(null);
    } else {
      setExpandedProjectId(id);
    }
  };

  // Open edit modal
  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setEditName(project.projectName);
    setEditSuperficie(project.superficie || '');
    setEditRentabilidad(project.rentabilidad || '');
    setEditAnio(project.anio || new Date().getFullYear());
    setEditCliente(project.cliente || '');
  };

  // Save project general parameters edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editName) {
      alert("Por favor ingrese el Nº y Nombre del proyecto");
      return;
    }

    setProjects(prev => prev.map(p => {
      if (p.projectName === editingProject.projectName) {
        return {
          ...p,
          projectName: editName,
          superficie: parseFloat(editSuperficie) || 0,
          rentabilidad: parseFloat(editRentabilidad) || 0,
          anio: parseInt(editAnio) || new Date().getFullYear(),
          cliente: editCliente
        };
      }
      return p;
    }));

    setEditingProject(null);
  };

  // Save billing table edits (inline saving)
  const handleSaveBillingTable = (projectIdx, budgetIdx, updatedTable) => {
    const budget = projects[projectIdx].budgets[budgetIdx];
    const currentSum = updatedTable.reduce((acc, row) => acc + (parseFloat(row.uf) || 0), 0);
    const roundedSum = Math.round(currentSum * 100) / 100;
    const expectedTotal = Math.round((parseFloat(budget.amount) || 0) * 100) / 100;
    
    if (Math.abs(roundedSum - expectedTotal) >= 0.02) {
      alert(`Error al guardar: La suma de las cuotas (${roundedSum.toFixed(2)} UF) no es igual al total requerido del presupuesto (${expectedTotal.toFixed(2)} UF). Diferencia: ${(expectedTotal - roundedSum).toFixed(2)} UF.`);
      return;
    }

    setProjects(prev => prev.map((p, pIdx) => {
      if (pIdx === projectIdx) {
        const updatedBudgets = p.budgets.map((b, bIdx) => {
          if (bIdx === budgetIdx) {
            return {
              ...b,
              billingTable: updatedTable
            };
          }
          return b;
        });
        return {
          ...p,
          budgets: updatedBudgets
        };
      }
      return p;
    }));
    alert("¡Tabla de facturación actualizada correctamente!");
  };

  const handleRowFieldChange = (projectIdx, budgetIdx, rowIndex, field, value) => {
    setProjects(prev => prev.map((p, pIdx) => {
      if (pIdx === projectIdx) {
        const updatedBudgets = p.budgets.map((b, bIdx) => {
          if (bIdx === budgetIdx) {
            const updatedTable = b.billingTable.map((row, rIdx) => {
              if (rIdx === rowIndex) {
                return {
                  ...row,
                  [field]: field === 'uf' ? (parseFloat(value) || 0) : value
                };
              }
              return row;
            });
            return {
              ...b,
              billingTable: updatedTable
            };
          }
          return b;
        });
        return {
          ...p,
          budgets: updatedBudgets
        };
      }
      return p;
    }));
  };

  // Disassociate budget
  const handleDisassociateBudget = (projectName, quoteId) => {
    if (confirm(`¿Está seguro de que desea desasociar el presupuesto #${quoteId} de este proyecto?`)) {
      setProjects(prev => prev.map(p => {
        if (p.projectName === projectName) {
          return {
            ...p,
            budgets: p.budgets.filter(b => b.quoteId !== quoteId)
          };
        }
        return p;
      }).filter(p => p.budgets.length > 0)); // If a project has no budgets left, delete it.
    }
  };

  // Delete project
  const handleDeleteProject = (projectName) => {
    if (confirm(`¿Está seguro de que desea eliminar el proyecto "${projectName}"? Se perderán todas sus tablas de facturación.`)) {
      setProjects(prev => prev.filter(p => p.projectName !== projectName));
    }
  };

  return (
    <div className="space-y-xl animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display-lg text-display-lg text-primary font-bold">Gestión de Proyectos</h2>
          <p className="text-on-surface-variant font-body-md mt-1">
            Supervisa el estado físico, rentabilidad y cronograma de facturación de los proyectos activos.
          </p>
        </div>
      </div>

      {/* KPI Dashboard */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* KPI 1 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">folder</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Proyectos Activos</span>
            <span className="font-headline-md text-headline-md text-primary font-black mt-1">{totalProjects}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">payments</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Monto Total Presupuestos</span>
            <span className="font-headline-md text-headline-md text-secondary font-black mt-1">
              {totalUF.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} UF
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">trending_up</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Rentabilidad Promedio</span>
            <span className="font-headline-md text-headline-md text-indigo-600 font-black mt-1">{avgProfitability}%</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">square_foot</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Superficie Total</span>
            <span className="font-headline-md text-headline-md text-emerald-600 font-black mt-1">
              {totalSurface.toLocaleString('es-CL')} m²
            </span>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="glass-card rounded-xl p-md flex items-center justify-between gap-md shadow-sm">
        <div className="flex-grow max-w-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-1 focus:ring-secondary focus:outline-none"
              placeholder="Buscar por código, cliente o año..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Projects List */}
      <div className="space-y-md">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, pIdx) => {
            const isExpanded = expandedProjectId === project.projectName;
            const projectTotalUF = project.budgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

            return (
              <div 
                key={project.projectName} 
                className="bg-white rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden transition-all hover:shadow"
              >
                {/* Project Summary Header */}
                <div className="p-md sm:p-lg flex flex-col md:flex-row md:items-center justify-between gap-md bg-slate-50/50">
                  <div className="flex items-start gap-md min-w-0">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-1">
                      <span className="material-symbols-outlined text-[20px]">folder_special</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-title-lg text-title-lg text-primary font-bold truncate max-w-lg" title={project.projectName}>
                        {project.projectName}
                      </h3>
                      <div className="flex flex-wrap gap-x-base gap-y-1 text-body-sm text-on-surface-variant mt-1 items-center">
                        <span className="font-semibold text-secondary-container bg-secondary/10 px-2 py-0.5 rounded text-xs uppercase tracking-wide">
                          {project.cliente}
                        </span>
                        <span className="text-outline-variant">•</span>
                        <span>Año {project.anio}</span>
                      </div>
                    </div>
                  </div>

                  {/* General parameters metrics */}
                  <div className="flex flex-wrap items-center gap-md sm:gap-lg md:text-right">
                    <div className="flex flex-col">
                      <span className="text-label-sm text-on-surface-variant/80 uppercase">Superficie</span>
                      <span className="font-bold text-body-md text-on-surface">{project.superficie} m²</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-label-sm text-on-surface-variant/80 uppercase">Rentabilidad</span>
                      <span className="font-bold text-body-md text-indigo-600">{project.rentabilidad}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-label-sm text-on-surface-variant/80 uppercase">Monto Total</span>
                      <span className="font-bold text-body-md text-secondary">{projectTotalUF.toLocaleString('es-CL')} UF</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-sm border-l border-outline-variant/40">
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="p-2 hover:bg-slate-100 rounded text-slate-700 hover:text-primary transition-all"
                        title="Editar parámetros generales del proyecto"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.projectName)}
                        className="p-2 hover:bg-red-50 rounded text-error hover:text-red-700 transition-all"
                        title="Eliminar proyecto por completo"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <button
                        onClick={() => toggleExpand(project.projectName)}
                        className={`p-2 hover:bg-slate-100 rounded text-secondary transition-all flex items-center gap-1 font-bold text-body-sm ${
                          isExpanded ? 'bg-slate-100' : ''
                        }`}
                      >
                        <span>{isExpanded ? 'Colapsar' : 'Facturación'}</span>
                        <span className={`material-symbols-outlined transition-all ${isExpanded ? 'rotate-180' : ''}`}>
                          keyboard_arrow_down
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Details: Associated Budgets and Billing Tables */}
                {isExpanded && (
                  <div className="border-t border-outline-variant/20 p-md sm:p-lg space-y-lg bg-white">
                    <h4 className="font-label-md text-label-md text-primary uppercase tracking-widest font-bold border-b pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      Presupuestos y Planificación de Cuotas Asociadas
                    </h4>

                    {project.budgets.map((budget, bIdx) => (
                      <div key={budget.quoteId} className="border border-slate-200 rounded-xl p-md space-y-md shadow-sm bg-slate-50/20">
                        {/* Budget Info Header */}
                        <div className="flex justify-between items-start gap-md pb-md border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-body-md text-primary">
                                Presupuesto #{budget.quoteId}
                              </span>
                              <span className="text-xs bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">
                                {budget.amount} UF
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface-variant leading-relaxed">
                              <strong>Descripción:</strong> {budget.description || 'Sin descripción'}
                            </p>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => handleDisassociateBudget(project.projectName, budget.quoteId)}
                            className="text-error hover:bg-red-50 px-2 py-1 rounded text-body-sm transition-all flex items-center gap-1 font-semibold"
                            title="Desasociar presupuesto"
                          >
                            <span className="material-symbols-outlined text-[16px]">link_off</span>
                            <span>Desasociar</span>
                          </button>
                        </div>

                        {/* Billing Table */}
                        <div className="space-y-sm">
                          <h5 className="text-body-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-slate-500">list_alt</span>
                            Detalle de Cuotas ({budget.numCuotas} cuotas)
                          </h5>

                          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-700 text-label-sm font-bold uppercase font-bold sticky top-0">
                                <tr>
                                  <th className="p-2.5 border-b border-slate-200 text-center w-12">Cuota</th>
                                  <th className="p-2.5 border-b border-slate-200">Fecha</th>
                                  <th className="p-2.5 border-b border-slate-200 text-right w-28">UF</th>
                                  <th className="p-2.5 border-b border-slate-200">Comentario / Estado de Hito</th>
                                </tr>
                              </thead>
                              <tbody className="text-body-sm divide-y divide-slate-100">
                                {budget.billingTable && budget.billingTable.map((row, rIdx) => (
                                  <tr key={rIdx} className="hover:bg-slate-50/40">
                                    <td className="p-2.5 font-bold text-slate-500 text-center bg-slate-50/50">
                                      {row.numQuota}
                                    </td>
                                    <td className="p-1.5">
                                      <input
                                        type="date"
                                        value={row.date}
                                        onChange={(e) => handleRowFieldChange(pIdx, bIdx, rIdx, 'date', e.target.value)}
                                        className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm"
                                      />
                                    </td>
                                    <td className="p-1.5 w-28">
                                      <input
                                        type="number"
                                        value={row.uf}
                                        onChange={(e) => handleRowFieldChange(pIdx, bIdx, rIdx, 'uf', e.target.value)}
                                        className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm font-semibold text-right"
                                        step="0.01"
                                      />
                                    </td>
                                    <td className="p-1.5">
                                      <input
                                        type="text"
                                        value={row.comment}
                                        onChange={(e) => handleRowFieldChange(pIdx, bIdx, rIdx, 'comment', e.target.value)}
                                        placeholder="Agregar comentario..."
                                        className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm"
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Verification Total Bar */}
                          {(() => {
                            const currentSum = budget.billingTable.reduce((acc, r) => acc + (parseFloat(r.uf) || 0), 0);
                            const roundedSum = Math.round(currentSum * 100) / 100;
                            const expectedTotal = Math.round((parseFloat(budget.amount) || 0) * 100) / 100;
                            const isMatch = Math.abs(roundedSum - expectedTotal) < 0.02;
                            return (
                              <div className={`mt-3 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 font-bold text-body-sm border ${
                                isMatch 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                <div className="flex flex-wrap gap-x-md gap-y-1">
                                  <span>Suma Planificada: {roundedSum.toFixed(2)} UF</span>
                                  <span className="text-slate-350">/</span>
                                  <span>Monto Requerido: {expectedTotal.toFixed(2)} UF</span>
                                </div>
                                <div>
                                  {isMatch ? (
                                    <span className="flex items-center gap-1 text-emerald-600">
                                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                      Montos coinciden
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-amber-600">
                                      <span className="material-symbols-outlined text-[18px]">warning</span>
                                      Diferencia: {(expectedTotal - roundedSum).toFixed(2)} UF
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Save Changes Button */}
                          <div className="flex justify-end pt-sm">
                            <button
                              type="button"
                              onClick={() => handleSaveBillingTable(pIdx, bIdx, budget.billingTable)}
                              className="px-4 py-1.5 bg-secondary text-white text-body-sm font-bold rounded-lg hover:brightness-105 transition-all shadow-sm flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[16px]">save</span>
                              <span>Guardar Facturación</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="glass-card rounded-xl p-xl text-center text-on-surface-variant italic border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-[48px] text-slate-300 mb-2">folder_open</span>
            <p className="font-semibold text-body-md mt-1">No se encontraron proyectos.</p>
            <p className="text-label-md mt-1">Los proyectos se generan automáticamente cuando apruebas un presupuesto.</p>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-lg max-w-md w-full text-left border border-outline-variant/30 animate-scale-up space-y-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Editar Proyecto</h3>
              <button 
                type="button"
                onClick={() => setEditingProject(null)}
                className="p-1 hover:bg-slate-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-md text-left">
              {/* Name */}
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Nombre del Proyecto</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                  required
                />
              </div>

              {/* Client */}
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Cliente</label>
                <select
                  value={editCliente}
                  onChange={(e) => setEditCliente(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
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
                </select>
              </div>

              {/* Surface & Profitability */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Superficie (m2)</label>
                  <input
                    type="number"
                    value={editSuperficie}
                    onChange={(e) => setEditSuperficie(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Rentabilidad (%)</label>
                  <input
                    type="number"
                    value={editRentabilidad}
                    onChange={(e) => setEditRentabilidad(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all font-bold"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>
              </div>

              {/* Year */}
              <div className="flex flex-col gap-xs">
                <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Año</label>
                <input
                  type="number"
                  value={editAnio}
                  onChange={(e) => setEditAnio(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-md pt-sm border-t">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-lg py-2 border border-outline-variant rounded text-on-surface hover:bg-slate-50 transition-all font-bold text-body-sm"
                >
                  Descartar
                </button>
                <button
                  type="submit"
                  className="px-lg py-2 bg-secondary text-white rounded hover:brightness-105 transition-all font-bold text-body-sm shadow-md shadow-secondary/15"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
