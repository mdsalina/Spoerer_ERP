import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

export default function Proyectos({ projects, setProjects, clients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState(null);
  
  // Document preview state
  const [previewFile, setPreviewFile] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');

  // Extra cost modal state
  const [extraCostProject, setExtraCostProject] = useState(null);
  const [extraCostUF, setExtraCostUF] = useState('');
  const [extraCostSuperficie, setExtraCostSuperficie] = useState('');
  const [extraCostComment, setExtraCostComment] = useState('');

  // Handle DOCX preview loading and conversion
  useEffect(() => {
    if (!previewFile) {
      setDocxHtml('');
      return;
    }

    if (previewFile.name.toLowerCase().endsWith('.docx')) {
      if (previewFile.fileObject) {
        const reader = new FileReader();
        reader.readAsArrayBuffer(previewFile.fileObject);
        reader.onload = async (event) => {
          const arrayBuffer = event.target.result;
          try {
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setDocxHtml(result.value || '<p class="text-on-surface-variant italic text-center">Documento vacío.</p>');
          } catch (error) {
            console.error('Error al convertir docx a html:', error);
            setDocxHtml('<p class="text-error font-bold text-center py-4">Error al generar la vista previa de Word.</p>');
          }
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setDocxHtml('<p class="text-error font-bold text-center py-4">Error al leer el archivo de Word.</p>');
        };
      } else {
        setDocxHtml('<div class="text-center py-10"><span class="material-symbols-outlined text-[48px] text-amber-500">warning</span><p class="font-bold text-body-md mt-2 text-on-surface">Vista previa no disponible para archivos simulados.</p><p class="text-label-md text-on-surface-variant mt-1">Por favor descarga el archivo para poder visualizarlo.</p></div>');
      }
    }
  }, [previewFile]);

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

  // Extra cost modal handlers
  const handleOpenExtraCostModal = (project) => {
    setExtraCostProject(project);
    setExtraCostUF('');
    setExtraCostSuperficie('');
    setExtraCostComment('');
  };

  const handleAddExtraCost = (e) => {
    e.preventDefault();
    if (!extraCostUF) {
      alert("Por favor ingrese el Costo Extra (UF)");
      return;
    }

    const newCost = {
      id: Date.now().toString(),
      amount: parseFloat(extraCostUF) || 0,
      superficie: parseFloat(extraCostSuperficie) || 0,
      comment: extraCostComment || ''
    };

    setProjects(prev => prev.map(p => {
      if (p.projectName === extraCostProject.projectName) {
        const updatedCosts = [...(p.extraCosts || []), newCost];
        // Sync extraCostProject so that the list in the modal updates immediately
        setExtraCostProject(prevProj => ({
          ...prevProj,
          extraCosts: updatedCosts
        }));
        return {
          ...p,
          extraCosts: updatedCosts
        };
      }
      return p;
    }));

    // Reset fields to allow adding another cost extra one by one
    setExtraCostUF('');
    setExtraCostSuperficie('');
    setExtraCostComment('');
  };

  const handleDeleteExtraCost = (costId) => {
    if (confirm("¿Está seguro de que desea eliminar este costo extra?")) {
      setProjects(prev => prev.map(p => {
        if (p.projectName === extraCostProject.projectName) {
          const updatedCosts = (p.extraCosts || []).filter(c => c.id !== costId);
          // Sync extraCostProject so that the list in the modal updates immediately
          setExtraCostProject(prevProj => ({
            ...prevProj,
            extraCosts: updatedCosts
          }));
          return {
            ...p,
            extraCosts: updatedCosts
          };
        }
        return p;
      }));
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
            const projectExtraCostsUF = (project.extraCosts || []).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

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
                        <span className="font-semibold text-on-surface-variant">
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
                    <div className="flex flex-col">
                      <span className="text-label-sm text-on-surface-variant/80 uppercase">Costos Extras</span>
                      <span className="font-bold text-body-md text-amber-600">{projectExtraCostsUF.toLocaleString('es-CL')} UF</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-sm border-l border-outline-variant/40">
                      <button
                        onClick={() => handleOpenExtraCostModal(project)}
                        className="p-2 hover:bg-slate-100 rounded text-emerald-600 hover:text-emerald-700 transition-all font-bold flex items-center justify-center animate-pulse-subtle"
                        title="Agregar costo extra"
                      >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
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

                            {budget.backupFiles && budget.backupFiles.length > 0 && (
                              <div className="mt-md pt-sm border-t border-slate-100/80 space-y-xs">
                                <span className="text-[11px] text-on-surface-variant font-bold block uppercase tracking-wider">
                                  Documentos de Respaldo
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  {budget.backupFiles.map((file, fIdx) => (
                                    <div key={fIdx} className="flex items-center gap-2 p-1.5 px-3 bg-white rounded border border-outline-variant/30 shadow-xs max-w-xs">
                                      <span className="material-symbols-outlined text-secondary flex-shrink-0 text-[18px]">
                                        {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                                      </span>
                                      <span className="text-body-sm font-bold truncate max-w-[130px]" title={file.name}>
                                        {file.name}
                                      </span>
                                      <div className="flex items-center gap-0.5 ml-2 border-l pl-1">
                                        <button
                                          type="button"
                                          onClick={() => setPreviewFile(file)}
                                          className="p-1 hover:bg-slate-100 rounded text-secondary transition-all"
                                          title="Ver archivo"
                                        >
                                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                                        </button>
                                        {file.url && (
                                          <a
                                            href={file.url}
                                            download={file.name}
                                            className="p-1 hover:bg-slate-100 rounded text-secondary transition-all"
                                            title="Descargar"
                                          >
                                            <span className="material-symbols-outlined text-[16px]">download</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                                  <th className="p-2.5 border-b border-slate-200 w-36">Estado</th>
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
                                    <td className="p-1.5 w-36">
                                      <select
                                        value={row.status || 'Por facturar'}
                                        onChange={(e) => handleRowFieldChange(pIdx, bIdx, rIdx, 'status', e.target.value)}
                                        className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm cursor-pointer font-medium"
                                      >
                                        <option value="Por facturar">Por facturar</option>
                                        <option value="Factura emitida">Factura emitida</option>
                                        <option value="Pagada">Pagada</option>
                                      </select>
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
                                        value={row.comment || ''}
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

                    {/* Costos Extras Section */}
                    <div className="border-t border-outline-variant/20 pt-md space-y-md">
                      <h4 className="font-label-md text-label-md text-primary uppercase tracking-widest font-bold border-b pb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add_card</span>
                        Detalle de Costos Extras del Proyecto
                      </h4>

                      {project.extraCosts && project.extraCosts.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 text-label-sm font-bold uppercase sticky top-0">
                              <tr>
                                <th className="p-2.5 border-b border-slate-200">Comentario</th>
                                <th className="p-2.5 border-b border-slate-200 text-right w-36">Superficie (m²)</th>
                                <th className="p-2.5 border-b border-slate-200 text-right w-36">Costo Extra (UF)</th>
                              </tr>
                            </thead>
                            <tbody className="text-body-sm divide-y divide-slate-100">
                              {project.extraCosts.map((cost) => (
                                <tr key={cost.id} className="hover:bg-slate-50/40">
                                  <td className="p-2.5 text-on-surface">
                                    {cost.comment || <span className="text-on-surface-variant/30 italic">Sin comentario</span>}
                                  </td>
                                  <td className="p-2.5 text-right font-medium text-on-surface">
                                    {cost.superficie ? `${cost.superficie.toLocaleString('es-CL')} m²` : '0 m²'}
                                  </td>
                                  <td className="p-2.5 text-right font-semibold text-secondary">
                                    {cost.amount.toLocaleString('es-CL', { minimumFractionDigits: 2 })} UF
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50/80 font-bold border-t border-slate-200 text-body-sm">
                                <td className="p-2.5 text-on-surface">Total Costos Extras</td>
                                <td className="p-2.5 text-right text-on-surface">
                                  {project.extraCosts.reduce((sum, c) => sum + (c.superficie || 0), 0).toLocaleString('es-CL')} m²
                                </td>
                                <td className="p-2.5 text-right text-secondary">
                                  {project.extraCosts.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString('es-CL', { minimumFractionDigits: 2 })} UF
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ) : (
                        <div className="p-md text-center text-on-surface-variant italic border border-dashed rounded-lg bg-slate-50/50">
                          No hay costos extras registrados para este proyecto.
                        </div>
                      )}
                    </div>
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

      {/* Modal: Agregar Costo Extra */}
      {extraCostProject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-lg max-w-2xl w-full text-left border border-outline-variant/30 animate-scale-up space-y-md flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-sm flex-shrink-0">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Costos Extras</h3>
                <p className="text-body-xs text-on-surface-variant font-bold truncate max-w-md">
                  Proyecto: {extraCostProject.projectName}
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setExtraCostProject(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-lg pr-1">
              {/* Form to add a new Costo Extra */}
              <form onSubmit={handleAddExtraCost} className="space-y-md bg-slate-50/50 p-md rounded-xl border border-slate-200 text-left">
                <h4 className="font-title-sm text-title-sm text-secondary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  Registrar Nuevo Costo Extra
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Costo Extra (UF)</label>
                    <input
                      type="number"
                      value={extraCostUF}
                      onChange={(e) => setExtraCostUF(e.target.value)}
                      placeholder="Ej: 15.50"
                      className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Superficie (m²)</label>
                    <input
                      type="number"
                      value={extraCostSuperficie}
                      onChange={(e) => setExtraCostSuperficie(e.target.value)}
                      placeholder="Ej: 45.0"
                      className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Comentario / Justificación</label>
                  <textarea
                    value={extraCostComment}
                    onChange={(e) => setExtraCostComment(e.target.value)}
                    placeholder="Ej: Adición de superficie para ductos de ventilación..."
                    className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all h-20 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end pt-xs">
                  <button
                    type="submit"
                    className="px-lg py-2 bg-secondary text-white rounded-lg hover:brightness-105 transition-all font-bold text-body-sm shadow-md shadow-secondary/15 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Agregar Costo Extra
                  </button>
                </div>
              </form>

              {/* List of current Costos Extras */}
              <div className="space-y-md">
                <h4 className="font-title-sm text-title-sm text-primary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  Costos Extras Registrados
                </h4>

                {extraCostProject.extraCosts && extraCostProject.extraCosts.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs max-h-[30vh]">
                    <table className="w-full text-left border-collapse text-body-sm">
                      <thead className="bg-slate-100 text-slate-700 text-label-xs font-bold uppercase sticky top-0">
                        <tr>
                          <th className="p-2.5 border-b border-slate-200">Comentario</th>
                          <th className="p-2.5 border-b border-slate-200 text-right w-28">Superficie</th>
                          <th className="p-2.5 border-b border-slate-200 text-right w-28">Monto (UF)</th>
                          <th className="p-2.5 border-b border-slate-200 text-center w-16">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extraCostProject.extraCosts.map((cost) => (
                          <tr key={cost.id} className="hover:bg-slate-50/40">
                            <td className="p-2.5 text-on-surface truncate max-w-[200px]" title={cost.comment}>
                              {cost.comment}
                            </td>
                            <td className="p-2.5 text-right text-on-surface">
                              {cost.superficie ? `${cost.superficie.toLocaleString('es-CL')} m²` : '0 m²'}
                            </td>
                            <td className="p-2.5 text-right font-bold text-secondary">
                              {cost.amount.toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteExtraCost(cost.id)}
                                className="p-1 hover:bg-red-50 text-error hover:text-red-700 rounded transition-all flex items-center justify-center mx-auto"
                                title="Eliminar este costo"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="sticky bottom-0 bg-slate-50 border-t font-bold">
                        <tr>
                          <td className="p-2.5 text-on-surface text-label-xs font-bold uppercase">Total</td>
                          <td className="p-2.5 text-right text-on-surface">
                            {extraCostProject.extraCosts.reduce((sum, c) => sum + (c.superficie || 0), 0).toLocaleString('es-CL')} m²
                          </td>
                          <td className="p-2.5 text-right text-secondary">
                            {extraCostProject.extraCosts.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="p-md text-center text-on-surface-variant italic border border-dashed rounded-lg bg-slate-50/20">
                    No hay costos extras registrados para este proyecto.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-sm border-t flex-shrink-0">
              <button
                type="button"
                onClick={() => setExtraCostProject(null)}
                className="px-lg py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-slate-50 transition-all font-bold text-body-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal Overlay */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-lg bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-scale-up text-left border border-outline-variant/30">
            {/* Header */}
            <div className="p-md border-b border-outline-variant bg-surface flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">
                  {previewFile.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                </span>
                <span className="font-bold text-body-md text-primary truncate max-w-md">{previewFile.name}</span>
              </div>
              <button
                onClick={() => {
                  setPreviewFile(null);
                  setDocxHtml('');
                }}
                className="p-1.5 hover:bg-slate-100 rounded-full transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            {/* Content Preview Frame */}
            <div className="flex-grow overflow-auto p-lg bg-slate-100/50 flex justify-center items-stretch">
              {previewFile.name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-full rounded border border-outline-variant/40 bg-white"
                  title="Vista previa PDF"
                />
              ) : previewFile.name.toLowerCase().endsWith('.docx') ? (
                docxHtml ? (
                  <div className="w-full bg-white p-lg rounded shadow border border-outline-variant/30 overflow-y-auto">
                    <div className="prose prose-slate max-w-none text-body-md" dangerouslySetInnerHTML={{ __html: docxHtml }} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant w-full h-full">
                    <span className="material-symbols-outlined text-[48px] animate-spin text-secondary">sync</span>
                    <span className="text-body-md font-medium mt-4">Procesando y generando vista previa de Word...</span>
                  </div>
                )
              ) : (
                <div className="text-center py-20 text-on-surface-variant italic">
                  Vista previa no soportada para este formato de archivo.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
