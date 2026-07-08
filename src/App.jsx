import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import CRM from './components/CRM';
import Presupuestos from './components/Presupuestos';
import Facturacion from './components/Facturacion';
import Usuarios from './components/Usuarios';
import Proyectos from './components/Proyectos';
import { supabaseService } from './utils/supabaseService';
import { supabase } from './utils/supabaseClient';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('crm');
  const [loading, setLoading] = useState(true);

  // Flat SQL-aligned states
  const [clients, setClients] = useState([]);
  const [quotes, setQuotes] = useState([]); // Budgets
  const [projects, setProjects] = useState([]);
  const [installments, setInstallments] = useState([]); // Flat billing installments
  const [extraCosts, setExtraCosts] = useState([]); // Flat extra costs
  const [users, setUsers] = useState([]); // Public profiles

  // Temporary mock invoice state for the billing tab (future expansion)
  const [invoices, setInvoices] = useState([
    { id: 'INV-2023-001', clientName: 'Logística Global S.A.', amount: 4200.00, dueDate: '15 Oct, 2023', status: 'Pagada' },
    { id: 'INV-2023-002', clientName: 'TecnoCorp Solutions', amount: 12850.00, dueDate: '02 Oct, 2023', status: 'No Pagada' },
    { id: 'INV-2023-003', clientName: 'Constructora Horizonte', amount: 7400.00, dueDate: '22 Oct, 2023', status: 'Pago Parcial' },
    { id: 'INV-2023-004', clientName: 'Retail Max S.L.', amount: 2100.00, dueDate: '28 Oct, 2023', status: 'No Pagada' },
    { id: 'INV-2023-005', clientName: 'Distribuidora Alianza', amount: 9900.00, dueDate: '05 Oct, 2023', status: 'Pagada' }
  ]);

  // Authenticate user on load or session
  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión en Supabase:", err);
    }
    setUser(null);
  };

  // Load flat data from Supabase on mount and check active session
  useEffect(() => {
    async function checkSessionAndLoadData() {
      try {
        setLoading(true);
        
        // 1. Verificar sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profile && profile.status === 'Active') {
            setUser({
              email: profile.email,
              name: profile.name,
              role: profile.role
            });
          } else {
            await supabase.auth.signOut();
          }
        }

        // 2. Cargar datos de Supabase
        const [cls, bgs, prjs, insts, costs, usrs] = await Promise.all([
          supabaseService.getClients(),
          supabaseService.getBudgets(),
          supabaseService.getProjects(),
          supabaseService.getInstallments(),
          supabaseService.getExtraCosts(),
          supabaseService.getProfiles()
        ]);
        setClients(cls);
        setQuotes(bgs);
        setProjects(prjs);
        setInstallments(insts);
        setExtraCosts(costs);
        setUsers(usrs);
      } catch (error) {
        console.error("Error cargando datos de Supabase:", error);
      } finally {
        setLoading(false);
      }
    }
    checkSessionAndLoadData();
  }, []);

  // CLIENTS ACTIONS
  const addClient = async (newClient) => {
    try {
      const savedClient = await supabaseService.saveClient(newClient);
      setClients(prev => {
        const exists = prev.some(c => c.id === savedClient.id || c.rut === savedClient.rut);
        if (exists) {
          return prev.map(c => c.id === savedClient.id ? savedClient : c);
        }
        return [...prev, savedClient];
      });
      return savedClient;
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      throw err;
    }
  };

  const deleteClient = async (id) => {
    try {
      await supabaseService.deleteClient(id);
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error al eliminar cliente:", err);
      throw new Error("Error al eliminar cliente. Verifique que no tenga proyectos activos asociados.");
    }
  };

  // QUOTES (BUDGETS) ACTIONS
  const addQuote = async (newQuote, items, billingInstallments) => {
    try {
      const result = await supabaseService.saveQuote(newQuote, items || newQuote.items || [], billingInstallments);
      const savedQuote = result.budget;
      setQuotes(prev => {
        const exists = prev.some(q => q.id === savedQuote.id);
        if (exists) {
          return prev.map(q => q.id === savedQuote.id ? savedQuote : q);
        }
        return [savedQuote, ...prev];
      });
      if (result.installments) {
        setInstallments(prev => {
          const filtered = prev.filter(i => i.origin_budget_id !== savedQuote.id);
          return [...filtered, ...result.installments];
        });
      }
    } catch (err) {
      alert("Error al guardar el presupuesto: " + err.message);
    }
  };

  const deleteQuote = async (id) => {
    try {
      await supabaseService.deleteQuote(id);
      setQuotes(prev => prev.filter(q => q.id !== id));
      setInstallments(prev => prev.filter(i => i.origin_budget_id !== id));
    } catch (err) {
      alert("Error al eliminar presupuesto: " + err.message);
    }
  };

  // VÍNCULO: APROBACIÓN Y CREACIÓN DE PROYECTO CON CUOTAS
  const handleApproveBudgetAndCreateProject = async (projectForm, budgetId, installmentsList) => {
    try {
      setLoading(true);
      const result = await supabaseService.approveBudgetAndCreateProject(
        projectForm, 
        budgetId, 
        installmentsList
      );
      
      // Actualizar estados planos locales
      setProjects(prev => {
        const exists = prev.some(p => p.id === result.project.id);
        if (exists) {
          return prev.map(p => p.id === result.project.id ? result.project : p);
        } else {
          return [result.project, ...prev];
        }
      });
      setQuotes(prev => prev.map(q => q.id === budgetId ? result.budget : q));
      setInstallments(prev => [...prev, ...result.installments]);
      
      alert("¡Presupuesto aprobado y Proyecto guardado con éxito!");
    } catch (err) {
      console.error("Error al aprobar presupuesto:", err);
      alert("Error al aprobar presupuesto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisassociateBudget = async (budgetId) => {
    try {
      const updatedBudget = await supabaseService.disassociateBudget(budgetId);
      setQuotes(prev => prev.map(q => q.id === budgetId ? updatedBudget : q));
      alert("Presupuesto desasociado del proyecto correctamente.");
    } catch (err) {
      alert("Error al desasociar presupuesto: " + err.message);
    }
  };

  // INSTALLMENTS (CUOTAS) ACTIONS
  const handleUpdateInstallment = async (id, updates) => {
    try {
      const updatedInst = await supabaseService.updateInstallment(id, updates);
      setInstallments(prev => prev.map(i => i.id === id ? updatedInst : i));
    } catch (err) {
      alert("Error al actualizar la cuota: " + err.message);
    }
  };

  // PROJECTS ACTIONS
  const handleSaveProject = async (updatedProject) => {
    try {
      const saved = await supabaseService.saveProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === saved.id ? saved : p));
      alert("Proyecto actualizado exitosamente.");
    } catch (err) {
      alert("Error al actualizar proyecto: " + err.message);
    }
  };

  const handleDeleteProject = async (id) => {
    if (confirm("¿Está seguro de que desea eliminar el proyecto por completo? Se perderán todas sus tablas de facturación.")) {
      try {
        await supabaseService.deleteProject(id);
        setProjects(prev => prev.filter(p => p.id !== id));
        alert("Proyecto eliminado exitosamente.");
      } catch (err) {
        alert("Error al eliminar proyecto: " + err.message);
      }
    }
  };

  const handleSaveInstallments = async (budgetId, installmentsList) => {
    // Fallback if called with one argument
    if (Array.isArray(budgetId)) {
      installmentsList = budgetId;
      budgetId = installmentsList[0]?.origin_budget_id;
    }
    if (!budgetId) {
      alert("Error: No se pudo identificar el presupuesto asociado.");
      return;
    }

    try {
      setLoading(true);

      // Find original installments for this budget
      const originalInsts = installments.filter(inst => inst.origin_budget_id === budgetId);

      // Identify deleted installments
      const deletedInsts = originalInsts.filter(orig => !installmentsList.some(curr => curr.id === orig.id));

      // Identify new installments
      const newInsts = installmentsList.filter(inst => typeof inst.id === 'string' && inst.id.startsWith('temp-'));

      // Identify updated installments
      const updatedInsts = installmentsList.filter(inst => !newInsts.some(ni => ni.id === inst.id));

      // Execute deletions
      if (deletedInsts.length > 0) {
        await Promise.all(deletedInsts.map(inst => supabaseService.deleteInstallment(inst.id)));
      }

      // Execute updates
      if (updatedInsts.length > 0) {
        await Promise.all(updatedInsts.map(inst => 
          supabaseService.updateInstallment(inst.id, {
            numQuota: inst.numQuota,
            date: inst.date,
            status: inst.status,
            uf: inst.uf,
            comment: inst.comment
          })
        ));
      }

      // Execute insertions
      if (newInsts.length > 0) {
        await Promise.all(newInsts.map(inst => 
          supabaseService.createInstallment({
            project_id: inst.project_id,
            origin_budget_id: inst.origin_budget_id,
            numQuota: inst.numQuota,
            date: inst.date,
            uf: inst.uf,
            status: inst.status,
            comment: inst.comment
          })
        ));
      }

      const freshInsts = await supabaseService.getInstallments();
      setInstallments(freshInsts);
      alert("¡Tabla de facturación guardada exitosamente en Supabase!");
    } catch (err) {
      alert("Error al guardar facturación: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // EXTRA COSTS ACTIONS
  const handleAddExtraCost = async (newCost) => {
    try {
      const savedCost = await supabaseService.saveExtraCost(newCost);
      setExtraCosts(prev => {
        const exists = prev.some(ec => ec.id === savedCost.id);
        if (exists) return prev.map(ec => ec.id === savedCost.id ? savedCost : ec);
        return [...prev, savedCost];
      });
      alert("Costo extra registrado exitosamente.");
    } catch (err) {
      alert("Error al registrar costo extra: " + err.message);
    }
  };

  const handleDeleteExtraCost = async (id) => {
    try {
      await supabaseService.deleteExtraCost(id);
      setExtraCosts(prev => prev.filter(ec => ec.id !== id));
      alert("Costo extra eliminado exitosamente.");
    } catch (err) {
      alert("Error al eliminar costo extra: " + err.message);
    }
  };

  // INVOICES ACTIONS (Simulated)
  const addInvoice = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  const updateInvoiceStatus = (id, newStatus) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
  };

  // USERS / PROFILES ACTIONS
  const addUser = async (newUser) => {
    try {
      const { data: userId, error } = await supabase.rpc('create_user_admin', {
        new_email: newUser.email,
        new_password: newUser.password || 'Password123!',
        new_name: newUser.name,
        new_role: newUser.role || 'Sales'
      });

      if (error) throw error;
      
      if (userId) {
        setUsers(prev => [...prev, {
          id: userId,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role || 'Sales',
          status: 'Active',
          joinedDate: new Date().toLocaleDateString('es-CL'),
          initials: newUser.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        }]);
      }
    } catch (err) {
      throw err;
    }
  };

  const toggleUserStatus = async (id) => {
    try {
      const userToToggle = users.find(u => u.id === id);
      if (!userToToggle) return;
      await supabaseService.toggleProfileStatus(id, userToToggle.status);
      setUsers(prev => prev.map(u => u.id === id 
        ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } 
        : u
      ));
    } catch (err) {
      throw err;
    }
  };

  const editUser = async (userId, updates) => {
    try {
      const updated = await supabaseService.updateUser(userId, updates);
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        initials: updated.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      } : u));
    } catch (err) {
      throw err;
    }
  };

  const deleteUser = async (userId) => {
    try {
      await supabaseService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      throw err;
    }
  };

  // Render Login Check
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const isAdmin = user?.role?.toLowerCase() === 'admin' || 
                  user?.role?.toLowerCase() === 'administrador' || 
                  user?.role?.toLowerCase() === 'system administrator';

  return (
    <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} onLogout={handleLogout}>
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-md">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-body-md text-on-surface-variant font-bold">Cargando base de datos de Supabase...</span>
        </div>
      ) : (
        <>
          {currentTab === 'crm' && (
            <CRM 
              clients={clients} 
              onAddClient={addClient} 
              onDeleteClient={deleteClient}
            />
          )}
          {currentTab === 'presupuestos' && (
            <Presupuestos 
              quotes={quotes} 
              clients={clients} 
              onAddQuote={addQuote} 
              onDeleteQuote={deleteQuote}
              projects={projects}
              onApproveBudgetAndCreateProject={handleApproveBudgetAndCreateProject}
              installments={installments}
            />
          )}
          {currentTab === 'facturacion' && (
            <Facturacion 
              invoices={invoices} 
              clients={clients}
              onUpdateInvoiceStatus={updateInvoiceStatus} 
              onAddInvoice={addInvoice} 
            />
          )}
          {currentTab === 'usuarios' && isAdmin && (
            <Usuarios 
              users={users} 
              onAddUser={addUser} 
              onToggleUserStatus={toggleUserStatus} 
              onEditUser={editUser}
              onDeleteUser={deleteUser}
            />
          )}
          {currentTab === 'proyectos' && (
            <Proyectos
              projects={projects}
              setProjects={setProjects}
              clients={clients}
              budgets={quotes}
              installments={installments}
              extraCosts={extraCosts}
              onUpdateInstallment={handleUpdateInstallment}
              onDisassociateBudget={handleDisassociateBudget}
              onAddExtraCost={handleAddExtraCost}
              onDeleteExtraCost={handleDeleteExtraCost}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
              onSaveInstallments={handleSaveInstallments}
            />
          )}
        </>
      )}
    </Sidebar>
  );
}
