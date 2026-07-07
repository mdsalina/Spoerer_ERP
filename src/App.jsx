import React, { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import CRM from './components/CRM';
import Presupuestos from './components/Presupuestos';
import Facturacion from './components/Facturacion';
import Usuarios from './components/Usuarios';
import Proyectos from './components/Proyectos';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('crm');

  // Shared state: Clients (CRM)
  const [clients, setClients] = useState([
    {
      id: '1',
      rut: '76.123.456-7',
      company: 'TechNova Solutions S.A.',
      giro: 'Servicios Informáticos',
      address: 'Av. Providencia 1234, Of. 501',
      comuna: 'Providencia',
      ciudad: 'Santiago',
      name: 'Alejandro Sánchez',
      email: 'a.sanchez@technova.com',
      phone: '+56 9 1234 5678',
      initials: 'TS'
    },
    {
      id: '2',
      rut: '77.987.654-3',
      company: 'Estética & Bienestar Ltda.',
      giro: 'Servicios de Estética',
      address: 'Av. Las Condes 8900',
      comuna: 'Las Condes',
      ciudad: 'Santiago',
      name: 'Rosa Martínez',
      email: 'ventas@esteticabien.cl',
      phone: '+56 9 6000 1234',
      initials: 'EB'
    },
    {
      id: '3',
      rut: '75.456.789-K',
      company: 'Logística Global Express SpA',
      giro: 'Transporte de Carga',
      address: 'Panamericana Norte Km 15',
      comuna: 'Quilicura',
      ciudad: 'Santiago',
      name: 'Javier Peralta',
      email: 'jperalta@logistica.com',
      phone: '+56 2 2111 2222',
      initials: 'LG'
    },
    {
      id: '4',
      rut: '78.321.654-2',
      company: 'Diseño & Espacios E.I.R.L.',
      giro: 'Arquitectura y Diseño',
      address: 'Av. Apoquindo 4500, Piso 10',
      comuna: 'Las Condes',
      ciudad: 'Santiago',
      name: 'Lucía Urbina',
      email: 'lucia@disespacios.cl',
      phone: '+56 9 7788 9900',
      initials: 'DE'
    }
  ]);

  // Shared state: Quotes (Presupuestos)
  const [quotes, setQuotes] = useState([
    { 
      id: '9032', 
      clientName: 'Alejandro Sánchez', 
      company: 'TechNova Solutions S.A.', 
      title: 'Migración Cloud - Fase 1', 
      date: '20/11/2023', 
      amount: 10115.00, 
      validity: '15 días', 
      status: 'Borrador',
      items: [
        { id: 1, description: 'Migración base de datos PostgreSQL a AWS RDS', qty: 1, price: 5000.00 },
        { id: 2, description: 'Configuración de Terraform & CI/CD Pipelines', qty: 1, price: 3500.00 }
      ],
      backupFiles: []
    },
    { 
      id: '8992', 
      clientName: 'Horizon Data Systems', 
      company: 'Horizon Data Systems', 
      title: 'Actualización de Infraestructura', 
      date: '18/11/2023', 
      amount: 14756.00, 
      validity: '30 días', 
      status: 'Enviado',
      items: [
        { id: 1, description: 'Servidor Físico Dell PowerEdge R750', qty: 1, price: 8900.00 },
        { id: 2, description: 'Licencia Windows Server Datacenter', qty: 1, price: 3500.00 }
      ],
      backupFiles: []
    },
    { 
      id: '8841', 
      clientName: 'Aurora Energy Ltd', 
      company: 'Aurora Energy Ltd', 
      title: 'Mantenimiento Anual', 
      date: '15/11/2023', 
      amount: 53550.00, 
      validity: '30 días', 
      status: 'Aprobado',
      items: [
        { id: 1, description: 'Soporte preventivo y correctivo 24/7 ERP', qty: 12, price: 3750.00 }
      ],
      backupFiles: []
    },
    { 
      id: '8560', 
      clientName: 'Javier Peralta', 
      company: 'Logística Global Express SpA', 
      title: 'Integración Legacy', 
      date: '01/11/2023', 
      amount: 6545.00, 
      validity: '30 días', 
      status: 'Rechazado',
      items: [
        { id: 1, description: 'Consultoría y desarrollo API REST legacy', qty: 1, price: 5500.00 }
      ],
      backupFiles: []
    }
  ]);

  // Shared state: Invoices (Facturación)
  const [invoices, setInvoices] = useState([
    { id: 'INV-2023-001', clientName: 'Logística Global S.A.', amount: 4200.00, dueDate: '15 Oct, 2023', status: 'Pagada' },
    { id: 'INV-2023-002', clientName: 'TecnoCorp Solutions', amount: 12850.00, dueDate: '02 Oct, 2023', status: 'No Pagada' },
    { id: 'INV-2023-003', clientName: 'Constructora Horizonte', amount: 7400.00, dueDate: '22 Oct, 2023', status: 'Pago Parcial' },
    { id: 'INV-2023-004', clientName: 'Retail Max S.L.', amount: 2100.00, dueDate: '28 Oct, 2023', status: 'No Pagada' },
    { id: 'INV-2023-005', clientName: 'Distribuidora Alianza', amount: 9900.00, dueDate: '05 Oct, 2023', status: 'Pagada' }
  ]);

  // Shared state: Users (Control de Accesos)
  const [users, setUsers] = useState([
    { id: '1', name: 'Alejandro Luna', email: 'a.luna@enterprise.com', role: 'Admin', status: 'Active', joinedDate: '12 Oct 2023', initials: 'AL' },
    { id: '2', name: 'Mariana Beltrán', email: 'm.beltran@sales.com', role: 'Sales', status: 'Active', joinedDate: '05 Nov 2023', initials: 'MB' },
    { id: '3', name: 'Roberto Hernandez', email: 'r.hernandez@accounting.com', role: 'Accountant', status: 'Inactive', joinedDate: '20 Jan 2024', initials: 'RH' }
  ]);

  // Shared state: Projects (Proyectos)
  const [projects, setProjects] = useState([
    {
      id: '0280-Mantenimiento Anual - Aurora Energy Ltd',
      projectName: '0280-Mantenimiento Anual - Aurora Energy Ltd',
      superficie: 150,
      rentabilidad: 25,
      anio: 2023,
      cliente: 'Aurora Energy Ltd',
      extraCosts: [
        {
          id: 'ec-1',
          amount: 150.00,
          superficie: 25.0,
          comment: 'Instalación de racks adicionales'
        }
      ],
      budgets: [
        {
          quoteId: '8841',
          amount: 53550.00,
          description: 'Mantenimiento preventivo y correctivo de servidores ERP',
          numCuotas: 12,
          billingTable: [
            { numQuota: '01', date: '2023-12-15', uf: 4462.5, comment: 'Primera cuota' },
            { numQuota: '02', date: '2024-01-15', uf: 4462.5, comment: '' },
            { numQuota: '03', date: '2024-02-15', uf: 4462.5, comment: '' },
            { numQuota: '04', date: '2024-03-15', uf: 4462.5, comment: '' },
            { numQuota: '05', date: '2024-04-15', uf: 4462.5, comment: '' },
            { numQuota: '06', date: '2024-05-15', uf: 4462.5, comment: '' },
            { numQuota: '07', date: '2024-06-15', uf: 4462.5, comment: '' },
            { numQuota: '08', date: '2024-07-15', uf: 4462.5, comment: '' },
            { numQuota: '09', date: '2024-08-15', uf: 4462.5, comment: '' },
            { numQuota: '10', date: '2024-09-15', uf: 4462.5, comment: '' },
            { numQuota: '11', date: '2024-10-15', uf: 4462.5, comment: '' },
            { numQuota: '12', date: '2024-11-15', uf: 4462.5, comment: '' }
          ]
        }
      ]
    }
  ]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // State modifiers
  const addClient = (newClient) => {
    setClients(prev => {
      const exists = prev.some(c => c.id === newClient.id || (newClient.rut && c.rut === newClient.rut));
      if (exists) {
        return prev.map(c => (c.id === newClient.id || (newClient.rut && c.rut === newClient.rut)) ? { ...c, ...newClient } : c);
      }
      return [...prev, newClient];
    });
  };

  const deleteClient = (id) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const addQuote = (newQuote) => {
    setQuotes(prev => {
      const exists = prev.some(q => q.id === newQuote.id);
      if (exists) {
        return prev.map(q => q.id === newQuote.id ? newQuote : q);
      }
      return [newQuote, ...prev];
    });
  };

  const deleteQuote = (id) => {
    setQuotes(prev => prev.filter(q => q.id !== id));
  };

  const addInvoice = (newInvoice) => {
    setInvoices([newInvoice, ...invoices]);
  };

  const updateInvoiceStatus = (id, newStatus) => {
    setInvoices(invoices.map(inv => {
      if (inv.id === id) {
        return { ...inv, status: newStatus };
      }
      return inv;
    }));
  };

  const addUser = (newUser) => {
    setUsers([...users, newUser]);
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return u;
    }));
  };

  const addProject = (projectData) => {
    setProjects(prev => {
      const exists = prev.some(p => p.projectName === projectData.projectName);
      if (exists) {
        return prev.map(p => {
          if (p.projectName === projectData.projectName) {
            const newBudget = projectData.budgets[0];
            const filteredBudgets = p.budgets.filter(b => b.quoteId !== newBudget.quoteId);
            return {
              ...p,
              superficie: projectData.superficie,
              rentabilidad: projectData.rentabilidad,
              anio: projectData.anio,
              cliente: projectData.cliente,
              budgets: [...filteredBudgets, newBudget]
            };
          }
          return p;
        });
      } else {
        return [projectData, ...prev];
      }
    });
  };

  // Login check
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} user={user} onLogout={handleLogout}>
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
          onAddProject={addProject}
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
      {currentTab === 'usuarios' && (
        <Usuarios 
          users={users} 
          onAddUser={addUser} 
          onToggleUserStatus={toggleUserStatus} 
        />
      )}
      {currentTab === 'proyectos' && (
        <Proyectos
          projects={projects}
          setProjects={setProjects}
          clients={clients}
        />
      )}
    </Sidebar>
  );
}
