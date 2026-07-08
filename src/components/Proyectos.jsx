import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

export default function Proyectos({ 
  projects, 
  setProjects, 
  clients,
  budgets,
  installments,
  extraCosts,
  onUpdateInstallment,
  onDisassociateBudget,
  onAddExtraCost,
  onDeleteExtraCost,
  onSaveProject,
  onDeleteProject,
  onSaveInstallments
}) {
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

  // Local state for billing installments to allow inline typing before clicking Save
  const [localInstallments, setLocalInstallments] = useState([]);

  useEffect(() => {
    setLocalInstallments(installments);
  }, [installments]);

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

  // Calculate KPIs using flat arrays
  const totalProjects = projects.length;
  
  const totalUF = projects.reduce((acc, p) => {
    const projectBudgets = budgets.filter(b => b.projectId === p.id);
    const budgetSum = projectBudgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
    return acc + budgetSum;
  }, 0);

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

    // Parse project number and name from semantic string
    const nameParts = editName.split('-');
    const projectNumber = nameParts[0]?.trim() || '';
    const rawProjectName = nameParts.slice(1).join('-').split(' - ')[0]?.trim() || editName;

    // Resolve client
    const selectedCli = clients.find(c => c.company === editCliente);

    onSaveProject({
      id: editingProject.id,
      projectNumber: projectNumber,
      rawProjectName: rawProjectName,
      superficie: parseFloat(editSuperficie) || 0,
      rentabilidad: parseFloat(editRentabilidad) || 0,
      anio: parseInt(editAnio) || new Date().getFullYear(),
      clientId: selectedCli ? selectedCli.id : editingProject.clientId,
      status: editingProject.status
    });

    setEditingProject(null);
  };

  // Save billing table edits (batch saving)
  const handleSaveBillingTable = (budgetId, budgetAmount) => {
    const budgetInsts = localInstallments.filter(i => i.origin_budget_id === budgetId);
    const currentSum = budgetInsts.reduce((acc, row) => acc + (parseFloat(row.uf) || 0), 0);
    const roundedSum = Math.round(currentSum * 100) / 100;
    const expectedTotal = Math.round((parseFloat(budgetAmount) || 0) * 100) / 100;
    
    if (Math.abs(roundedSum - expectedTotal) >= 0.02) {
      alert(`Error al guardar: La suma de las cuotas (${roundedSum.toFixed(2)} UF) no es igual al total requerido del presupuesto (${expectedTotal.toFixed(2)} UF). Diferencia: ${(expectedTotal - roundedSum).toFixed(2)} UF.`);
      return;
    }

    onSaveInstallments(budgetInsts);
  };

  const handleRowFieldChange = (installmentId, field, value) => {
    setLocalInstallments(prev => prev.map(inst => {
      if (inst.id === installmentId) {
        return {
          ...inst,
          [field]: field === 'uf' ? (parseFloat(value) || 0) : value
        };
      }
      return inst;
    }));
  };

  // Disassociate budget
  const handleDisassociateBudgetLocal = (budgetId) => {
    if (confirm(`¿Está seguro de que desea desasociar este presupuesto del proyecto?`)) {
      onDisassociateBudget(budgetId);
    }
  };

  // Extra cost modal handlers
  const handleOpenExtraCostModal = (project) => {
    setExtraCostProject(project);
    setExtraCostUF('');
    setExtraCostSuperficie('');
    setExtraCostComment('');
  };

  const handleAddExtraCostLocal = (e) => {
    e.preventDefault();
    if (!extraCostUF) {
      alert("Por favor ingrese el Costo Extra (UF)");
      return;
    }

    onAddExtraCost({
      project_id: extraCostProject.id,
      amount: parseFloat(extraCostUF) || 0,
      superficie: parseFloat(extraCostSuperficie) || 0,
      comment: extraCostComment || ''
    });

    // Reset fields to allow adding another cost extra
    setExtraCostUF('');
    setExtraCostSuperficie('');
    setExtraCostComment('');
  };

  const handleDeleteExtraCostLocal = (costId) => {
    if (confirm("¿Está seguro de que desea eliminar este costo extra?")) {
      onDeleteExtraCost(costId);
    }
  };

  // Delete project
  const handleDeleteProjectLocal = (id, name) => {
    onDeleteProject(id);
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
            <span className="font-headline-md text-headline-md text-secondary font-black mt-1">{totalUF.toLocaleString('es-CL', { maximumFractionDigits: 1 })} <span className="text-body-sm font-semibold">UF</span></span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-indigo-55 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-65 text-indigo-75 flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">monitoring</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Rentabilidad Promedio</span>
            <span className="font-headline-md text-headline-md text-indigo-600 font-black mt-1">{avgProfitability}%</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-card rounded-xl p-lg shadow-sm border border-outline-variant/30 flex items-center gap-md">
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0">
            <span className="material-symbols-outlined text-[28px]">architecture</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Superficie Total</span>
            <span className="font-headline-md text-headline-md text-emerald-600 font-black mt-1">{totalSurface.toLocaleString('es-CL')} <span className="text-body-sm font-semibold">m²</span></span>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-md bg-surface-variant/20 p-md rounded-xl border border-outline-variant/20 shadow-xs">
        <div className="flex flex-1 max-w-md items-center gap-2 bg-white rounded-lg px-md py-sm border border-outline-variant/40 focus-within:border-primary transition-all">
          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Buscar por código, nombre o cliente..." 
            className="w-full bg-transparent border-0 outline-none text-body-md text-on-surface placeholder:text-on-surface-variant/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Projects List */}
      <div className="space-y-md">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const isExpanded = expandedProjectId === project.id;
            
            // Filter budgets associated with this project
            const projectBudgets = budgets.filter(b => b.projectId === project.id);
            const projectTotalUF = projectBudgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
            
            // Filter extra costs associated with this project
            const projectExtraCosts = extraCosts.filter(ec => ec.project_id === project.id);
            const projectExtraCostsUF = projectExtraCosts.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

            return (
              <div 
                key={project.id} 
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
                        onClick={() => handleDeleteProjectLocal(project.id, project.projectName)}
                        className="p-2 hover:bg-red-50 rounded text-error hover:text-red-700 transition-all"
                        title="Eliminar proyecto por completo"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <button
                        onClick={() => toggleExpand(project.id)}
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
                    {/* Costos Extras Detallados */}
                    {projectExtraCosts.length > 0 && (
                      <div className="border border-amber-200 rounded-xl p-md bg-amber-50/10 space-y-sm">
                        <h4 className="font-label-md text-label-md text-amber-700 uppercase tracking-widest font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">add_circle</span>
                          Costos Adicionales Registrados
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-md">
                          {projectExtraCosts.map((cost) => (
                            <div key={cost.id} className="p-md bg-white border border-slate-200 rounded-lg flex justify-between items-start gap-md shadow-xs">
                              <div>
                                <p className="text-body-sm font-semibold text-slate-800">{cost.comment || 'Sin descripción'}</p>
                                <div className="flex gap-2 text-label-xs text-on-surface-variant/80 mt-1">
                                  <span>{cost.superficie} m²</span>
                                  <span>•</span>
                                  <span className="font-bold text-amber-600">{cost.amount} UF</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteExtraCostLocal(cost.id)}
                                className="p-1 hover:bg-red-50 text-error hover:text-red-700 rounded transition-all flex items-center justify-center flex-shrink-0"
                                title="Eliminar costo extra"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <h4 className="font-label-md text-label-md text-primary uppercase tracking-widest font-bold border-b pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      Presupuestos y Planificación de Cuotas Asociadas
                    </h4>

                    {projectBudgets.map((budget) => {
                      const budgetInstallments = localInstallments.filter(
                        i => i.project_id === project.id && i.origin_budget_id === budget.id
                      );

                      return (
                        <div key={budget.id} className="border border-slate-200 rounded-xl p-md space-y-md shadow-sm bg-slate-50/20">
                          {/* Budget Info Header */}
                          <div className="flex justify-between items-start gap-md pb-md border-b border-slate-100">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-body-md text-primary">
                                  Presupuesto #{budget.title}
                                </span>
                                <span className="text-xs bg-secondary/10 text-secondary font-bold px-2 py-0.5 rounded-full">
                                  {budget.amount} UF
                                </span>
                              </div>
                              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                                <strong>Monto total:</strong> {budget.amount} UF ({budget.validity})
                              </p>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleDisassociateBudgetLocal(budget.id)}
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
                              Detalle de Cuotas ({budgetInstallments.length} cuotas)
                            </h5>

                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
                              <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-700 text-label-sm font-bold uppercase sticky top-0">
                                  <tr>
                                    <th className="p-2.5 border-b border-slate-200 text-center w-12">Cuota</th>
                                    <th className="p-2.5 border-b border-slate-200">Fecha Planificada</th>
                                    <th className="p-2.5 border-b border-slate-200 w-36">Estado</th>
                                    <th className="p-2.5 border-b border-slate-200 text-right w-28">UF</th>
                                    <th className="p-2.5 border-b border-slate-200">Comentario / Estado de Hito</th>
                                  </tr>
                                </thead>
                                <tbody className="text-body-sm divide-y divide-slate-100">
                                  {budgetInstallments.map((row) => (
                                    <tr key={row.id} className="hover:bg-slate-50/40">
                                      <td className="p-2.5 font-bold text-slate-500 text-center bg-slate-50/50">
                                        {row.numQuota}
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="date"
                                          value={row.date}
                                          onChange={(e) => handleRowFieldChange(row.id, 'date', e.target.value)}
                                          className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm"
                                        />
                                      </td>
                                      <td className="p-1.5 w-36">
                                        <select
                                          value={row.status || 'Por facturar'}
                                          onChange={(e) => handleRowFieldChange(row.id, 'status', e.target.value)}
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
                                          onChange={(e) => handleRowFieldChange(row.id, 'uf', e.target.value)}
                                          className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm font-semibold text-right"
                                          step="0.01"
                                        />
                                      </td>
                                      <td className="p-1.5">
                                        <input
                                          type="text"
                                          value={row.comment || ''}
                                          onChange={(e) => handleRowFieldChange(row.id, 'comment', e.target.value)}
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
                              const currentSum = budgetInstallments.reduce((acc, r) => acc + (parseFloat(r.uf) || 0), 0);
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
                                onClick={() => handleSaveBillingTable(budget.id, budget.amount)}
                                className="px-4 py-1.5 bg-secondary text-white text-body-sm font-bold rounded-lg hover:brightness-105 transition-all shadow-sm flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[16px]">save</span>
                                <span>Guardar Facturación</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-xl text-center text-on-surface-variant italic border-2 border-dashed border-outline-variant/40 rounded-xl bg-white/40">
            No se encontraron proyectos activos.
          </div>
        )}
      </div>

      {/* Modal: Edit Project */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-md z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
            <h2 className="font-headline-md text-headline-md text-primary font-bold mb-md">Editar Parámetros del Proyecto</h2>
            <form onSubmit={handleSaveEdit} className="space-y-md overflow-y-auto flex-1 pr-sm">
              <div className="flex flex-col">
                <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Nombre / Código Proyecto</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="p-md bg-surface-variant/20 border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-md text-on-surface"
                  placeholder="Ej: 0280-Mantenimiento Anual"
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Superficie (m²)</label>
                <input 
                  type="number" 
                  value={editSuperficie}
                  onChange={(e) => setEditSuperficie(e.target.value)}
                  className="p-md bg-surface-variant/20 border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-md text-on-surface"
                  placeholder="Superficie total"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Rentabilidad Esperada (%)</label>
                <input 
                  type="number" 
                  value={editRentabilidad}
                  onChange={(e) => setEditRentabilidad(e.target.value)}
                  className="p-md bg-surface-variant/20 border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-md text-on-surface"
                  placeholder="Margen de ganancia"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Año</label>
                <input 
                  type="number" 
                  value={editAnio}
                  onChange={(e) => setEditAnio(e.target.value)}
                  className="p-md bg-surface-variant/20 border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-md text-on-surface"
                  placeholder="Año contable"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Cliente</label>
                <select 
                  value={editCliente}
                  onChange={(e) => setEditCliente(e.target.value)}
                  className="p-md bg-surface-variant/20 border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-md text-on-surface font-medium cursor-pointer"
                >
                  <option value="">Seleccione un cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.company}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-sm pt-md border-t">
                <button 
                  type="button" 
                  onClick={() => setEditingProject(null)}
                  className="px-lg py-sm text-primary font-bold hover:bg-slate-100 rounded-lg transition-all text-body-md"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-lg py-sm bg-primary text-white font-bold rounded-lg hover:brightness-105 transition-all shadow-sm text-body-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Costos Extras */}
      {extraCostProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-md z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-lg shadow-xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-md flex-shrink-0">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Gestión de Costos Extras</h2>
                <p className="text-on-surface-variant font-body-sm mt-1 truncate max-w-md">
                  Proyecto: <strong>{extraCostProject.projectName}</strong>
                </p>
              </div>
              <button 
                onClick={() => setExtraCostProject(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-secondary"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-lg pr-sm">
              {/* Form to add Costo Extra */}
              <form onSubmit={handleAddExtraCostLocal} className="p-md border rounded-xl bg-slate-50/50 space-y-md">
                <h4 className="font-title-sm text-title-sm text-primary font-bold uppercase tracking-wider text-xs">Agregar Nuevo Costo Extra</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                  <div className="flex flex-col">
                    <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Monto (UF)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="Ej: 45.50"
                      value={extraCostUF}
                      onChange={(e) => setExtraCostUF(e.target.value)}
                      className="p-sm bg-white border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Superficie asociada (m²)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="Ej: 15.00 (Opcional)"
                      value={extraCostSuperficie}
                      onChange={(e) => setExtraCostSuperficie(e.target.value)}
                      className="p-sm bg-white border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-label-sm text-on-surface-variant font-bold mb-1 uppercase tracking-wider">Comentario / Justificación</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Modificaciones estructurales solicitadas por el cliente"
                    value={extraCostComment}
                    onChange={(e) => setExtraCostComment(e.target.value)}
                    className="p-sm bg-white border border-outline-variant/50 focus:border-primary outline-none rounded-lg text-body-sm"
                  />
                </div>
                <div className="flex justify-end pt-sm">
                  <button 
                    type="submit" 
                    className="px-lg py-1.5 bg-primary text-white text-body-sm font-bold rounded-lg hover:brightness-105 transition-all shadow-sm flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    <span>Registrar Costo</span>
                  </button>
                </div>
              </form>

              {/* List of current Costos Extras */}
              <div className="space-y-md">
                <h4 className="font-title-sm text-title-sm text-primary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[20px]">list_alt</span>
                  Costos Extras Registrados
                </h4>

                {(() => {
                  const projectModalExtraCosts = extraCosts.filter(ec => ec.project_id === extraCostProject.id);
                  return projectModalExtraCosts.length > 0 ? (
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
                          {projectModalExtraCosts.map((cost) => (
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
                                  onClick={() => handleDeleteExtraCostLocal(cost.id)}
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
                              {projectModalExtraCosts.reduce((sum, c) => sum + (c.superficie || 0), 0).toLocaleString('es-CL')} m²
                            </td>
                            <td className="p-2.5 text-right text-secondary">
                              {projectModalExtraCosts.reduce((sum, c) => sum + (c.amount || 0), 0).toLocaleString('es-CL', { minimumFractionDigits: 2 })}
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
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end pt-sm border-t flex-shrink-0">
              <button 
                onClick={() => setExtraCostProject(null)}
                className="px-lg py-sm bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-all text-body-md shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Document Preview */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-md z-55 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-lg shadow-xl border border-outline-variant/30 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-md flex-shrink-0">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold truncate max-w-xl" title={previewFile.name}>
                  Vista Previa: {previewFile.name}
                </h3>
              </div>
              <button 
                onClick={() => setPreviewFile(null)}
                className="p-1 hover:bg-slate-100 rounded-full transition-all text-secondary"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-outline-variant/20 rounded-xl bg-slate-50/30 p-md min-h-[40vh]">
              {previewFile.name.toLowerCase().endsWith('.docx') ? (
                docxHtml ? (
                  <div 
                    className="prose prose-slate max-w-none text-body-md text-on-surface bg-white p-lg rounded-lg border shadow-xs"
                    dangerouslySetInnerHTML={{ __html: docxHtml }} 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-md">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-body-sm text-on-surface-variant font-bold">Convirtiendo documento a HTML...</span>
                  </div>
                )
              ) : (
                <div className="text-center py-20">
                  <span className="material-symbols-outlined text-[64px] text-amber-500">warning</span>
                  <h4 className="font-bold text-title-md mt-4 text-on-surface">Formato de archivo no soportado para vista previa</h4>
                  <p className="text-body-md text-on-surface-variant mt-2">
                    Solo los archivos Word (.docx) se pueden previsualizar directamente en el ERP.
                  </p>
                  {previewFile.url && (
                    <a 
                      href={previewFile.url} 
                      download={previewFile.name}
                      className="inline-flex items-center gap-1.5 mt-md px-lg py-sm bg-primary text-white font-bold rounded-lg hover:brightness-105 transition-all shadow-sm text-body-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Descargar Archivo</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-sm border-t mt-md flex-shrink-0">
              <button 
                onClick={() => setPreviewFile(null)}
                className="px-lg py-sm bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-all text-body-md shadow-xs"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
