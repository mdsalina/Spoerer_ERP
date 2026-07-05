import React, { useState } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import CRM from './components/CRM';
import Presupuestos from './components/Presupuestos';
import Facturacion from './components/Facturacion';
import Usuarios from './components/Usuarios';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('crm');

  // Shared state: Clients (CRM)
  const [clients, setClients] = useState([
    { id: '1', name: 'Alejandro Sánchez', company: 'TechNova Solutions S.A.', email: 'a.sanchez@technova.com', phone: '+34 912 345 678', status: 'Cliente Activo', initials: 'AS' },
    { id: '2', name: 'Rosa Martínez', company: 'Estética & Bienestar', email: 'ventas@esteticabien.es', phone: '+34 600 123 456', status: 'Prospecto', initials: 'RM' },
    { id: '3', name: 'Javier Peralta', company: 'Logística Global Express', email: 'jperalta@logistica.com', phone: '+34 911 222 333', status: 'Cliente Activo', initials: 'JP' },
    { id: '4', name: 'Lucía Urbina', company: 'Diseño & Espacios', email: 'lucia@disespacios.com', phone: '+34 677 889 900', status: 'Prospecto', initials: 'LU' }
  ]);

  // Shared state: Quotes (Presupuestos)
  const [quotes, setQuotes] = useState([
    { id: 'QT-9032', clientName: 'Alejandro Sánchez', company: 'TechNova Solutions S.A.', title: 'Migración Cloud - Fase 1', date: '20/11/2023', amount: 8500.00, validity: '15 días', status: 'Borrador' },
    { id: 'QT-8992', clientName: 'Horizon Data Systems', company: 'Horizon Data Systems', title: 'Actualización de Infraestructura', date: '18/11/2023', amount: 12400.00, validity: '30 días', status: 'Enviado' },
    { id: 'QT-8841', clientName: 'Aurora Energy Ltd', company: 'Aurora Energy Ltd', title: 'Mantenimiento Anual', date: '15/11/2023', amount: 45000.00, validity: 'Vencido hoy', status: 'Aprobado' },
    { id: 'QT-8560', clientName: 'Javier Peralta', company: 'Logística Global Express', title: 'Integración Legacy', date: '01/11/2023', amount: 5500.00, validity: 'Expirada', status: 'Vencido' }
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

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // State modifiers
  const addClient = (newClient) => {
    setClients([...clients, newClient]);
  };

  const addQuote = (newQuote) => {
    setQuotes([newQuote, ...quotes]);
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
          onSelectClient={(client) => {
            alert(`Cliente seleccionado: ${client.name}\nEmpresa: ${client.company}\nEmail: ${client.email}`);
          }} 
        />
      )}
      {currentTab === 'presupuestos' && (
        <Presupuestos 
          quotes={quotes} 
          clients={clients} 
          onAddQuote={addQuote} 
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
    </Sidebar>
  );
}
