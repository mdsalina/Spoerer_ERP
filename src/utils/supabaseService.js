import { supabase } from './supabaseClient';

// Helper: Verify if a string is a valid Postgres UUID
const isUuid = (id) => {
  if (typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

// Helper: Map client fields between database (snake_case) and frontend (camelCase)
const mapClientFromDb = (dbClient) => ({
  id: dbClient.id,
  rut: dbClient.rut,
  company: dbClient.company_name,
  giro: dbClient.giro,
  address: dbClient.address,
  comuna: dbClient.comuna,
  ciudad: dbClient.ciudad,
  name: dbClient.contact_name,
  email: dbClient.contact_email,
  phone: dbClient.contact_phone,
  initials: dbClient.company_name 
    ? dbClient.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() 
    : 'CL'
});

const mapClientToDb = (client) => ({
  rut: client.rut,
  company_name: client.company,
  giro: client.giro,
  address: client.address,
  comuna: client.comuna,
  ciudad: client.ciudad,
  contact_name: client.name,
  contact_email: client.email,
  contact_phone: client.phone
});

// Helper: Map budget fields between database and frontend
const mapBudgetFromDb = (dbBudget) => ({
  id: dbBudget.id,
  clientId: dbBudget.client_id,
  projectId: dbBudget.project_id,
  clientName: dbBudget.clients ? dbBudget.clients.contact_name : '',
  company: dbBudget.clients ? dbBudget.clients.company_name : '',
  title: dbBudget.title,
  date: dbBudget.date ? dbBudget.date.split('-').reverse().join('/') : '', // YYYY-MM-DD -> DD/MM/YYYY
  amount: parseFloat(dbBudget.total_amount) || 0,
  validity: `${dbBudget.validity_days} días`,
  status: dbBudget.status,
  items: dbBudget.budget_items ? dbBudget.budget_items.map(item => ({
    id: item.id,
    description: item.description,
    qty: parseFloat(item.quantity) || 0,
    price: parseFloat(item.unit_price) || 0
  })) : [],
  backupFiles: []
});

// Helper: Map project fields between database and frontend
const mapProjectFromDb = (dbProject) => ({
  id: dbProject.id,
  projectNumber: dbProject.project_number,
  projectName: `${dbProject.project_number}-${dbProject.project_name} - ${dbProject.clients ? dbProject.clients.company_name : ''}`, // Concatenated for legacy UI
  rawProjectName: dbProject.project_name, // Clean name
  superficie: parseFloat(dbProject.superficie) || 0,
  rentabilidad: parseFloat(dbProject.rentabilidad) || 0,
  anio: dbProject.year,
  cliente: dbProject.clients ? dbProject.clients.company_name : '',
  clientId: dbProject.client_id,
  status: dbProject.status
});

// Helper: Map installment fields
const mapInstallmentFromDb = (dbInst) => ({
  id: dbInst.id,
  project_id: dbInst.project_id,
  origin_budget_id: dbInst.origin_budget_id,
  numQuota: dbInst.installment_number,
  date: dbInst.scheduled_date,
  uf: parseFloat(dbInst.planned_amount_uf) || 0,
  net_clp: dbInst.net_amount_clp ? parseFloat(dbInst.net_amount_clp) : null,
  tax_clp: dbInst.tax_amount_clp ? parseFloat(dbInst.tax_amount_clp) : null,
  total_clp: dbInst.total_amount_clp ? parseFloat(dbInst.total_amount_clp) : null,
  status: dbInst.status,
  actualInvoiceDate: dbInst.actual_invoice_date || null,
  invoiceNumber: dbInst.invoice_number || '',
  invoiceFileUrl: dbInst.invoice_file_url || '',
  actualPaymentDate: dbInst.actual_payment_date || null,
  paymentBackupUrl: dbInst.payment_backup_url || '',
  comment: dbInst.comment || ''
});

// Helper: Map extra costs fields
const mapExtraCostFromDb = (dbCost) => ({
  id: dbCost.id,
  project_id: dbCost.project_id,
  amount: parseFloat(dbCost.amount) || 0,
  superficie: parseFloat(dbCost.superficie) || 0,
  comment: dbCost.comment || ''
});

// Main Database Service
export const supabaseService = {
  // CLIENTS CRM CRUD
  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true });
    
    if (error) throw error;
    return data.map(mapClientFromDb);
  },

  async saveClient(client) {
    const dbData = mapClientToDb(client);
    
    if (client.id && isUuid(client.id)) {
      // Update
      const { data, error } = await supabase
        .from('clients')
        .update(dbData)
        .eq('id', client.id)
        .select();
      
      if (error) throw error;
      return mapClientFromDb(data[0]);
    } else {
      // Insert
      const { data, error } = await supabase
        .from('clients')
        .insert([dbData])
        .select();
      
      if (error) throw error;
      return mapClientFromDb(data[0]);
    }
  },

  async deleteClient(id) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return id;
  },

  // BUDGETS CRUD
  async getBudgets() {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, clients(*), budget_items(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(mapBudgetFromDb);
  },

  async saveQuote(quote, items) {
    // 1. Calculate amount dynamically if in draft/revision
    let totalAmount = null;
    if (quote.status === 'Aprobado') {
      totalAmount = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 1) * (parseFloat(item.price) || 0)), 0);
    }

    const validityDays = quote.validity 
      ? parseInt(quote.validity.replace(/[^0-9]/g, '')) || 30 
      : 30;

    const formattedDate = quote.date 
      ? quote.date.split('/').reverse().join('-') // DD/MM/YYYY -> YYYY-MM-DD
      : new Date().toISOString().split('T')[0];

    const budgetData = {
      client_id: quote.clientId,
      project_id: quote.projectId || null,
      title: quote.title,
      date: formattedDate,
      total_amount: totalAmount,
      validity_days: validityDays,
      status: quote.status || 'Borrador',
      created_by: quote.createdBy || null
    };

    let savedBudget;

    if (quote.id && isUuid(quote.id)) {
      // Update Budget
      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', quote.id)
        .select();
      if (error) throw error;
      savedBudget = data[0];
    } else {
      // Insert Budget
      // Get first profile/user to link if created_by is null
      if (!budgetData.created_by) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
          budgetData.created_by = profiles[0].id;
        } else {
          // Fallback to active session user
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            budgetData.created_by = session.user.id;
          }
        }
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert([budgetData])
        .select();
      if (error) throw error;
      savedBudget = data[0];
    }

    // 2. Sync Items (Budget Items)
    // Delete existing items for this budget first
    await supabase.from('budget_items').delete().eq('budget_id', savedBudget.id);

    // Insert new items
    if (items && items.length > 0) {
      const itemsToInsert = items.map(item => ({
        budget_id: savedBudget.id,
        description: item.description,
        quantity: parseFloat(item.qty) || 1,
        unit_price: parseFloat(item.price) || 0
      }));
      const { error: itemsError } = await supabase.from('budget_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }

    // Retrieve fully hydrated budget
    const { data: finalBudget, error: finalError } = await supabase
      .from('budgets')
      .select('*, clients(*), budget_items(*)')
      .eq('id', savedBudget.id)
      .single();

    if (finalError) throw finalError;
    return mapBudgetFromDb(finalBudget);
  },

  async deleteQuote(id) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return id;
  },

  // PROJECTS CRUD
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(mapProjectFromDb);
  },

  async saveProject(project) {
    const projectData = {
      project_number: project.projectNumber,
      project_name: project.rawProjectName,
      client_id: project.clientId,
      superficie: parseFloat(project.superficie) || 0,
      rentabilidad: parseFloat(project.rentabilidad) || 0,
      year: parseInt(project.anio) || new Date().getFullYear(),
      status: project.status || 'Activo'
    };

    if (project.id && isUuid(project.id)) {
      // Update
      const { data, error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', project.id)
        .select('*, clients(*)');
      
      if (error) throw error;
      return mapProjectFromDb(data[0]);
    } else {
      // Insert
      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select('*, clients(*)');
      
      if (error) throw error;
      return mapProjectFromDb(data[0]);
    }
  },

  async deleteProject(id) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return id;
  },

  // EXTRA COSTS CRUD
  async getExtraCosts() {
    const { data, error } = await supabase
      .from('extra_costs')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data.map(mapExtraCostFromDb);
  },

  async saveExtraCost(cost) {
    const dbData = {
      project_id: cost.project_id,
      amount: parseFloat(cost.amount) || 0,
      superficie: parseFloat(cost.superficie) || 0,
      comment: cost.comment
    };

    if (cost.id && isUuid(cost.id)) {
      const { data, error } = await supabase
        .from('extra_costs')
        .update(dbData)
        .eq('id', cost.id)
        .select();
      if (error) throw error;
      return mapExtraCostFromDb(data[0]);
    } else {
      const { data, error } = await supabase
        .from('extra_costs')
        .insert([dbData])
        .select();
      if (error) throw error;
      return mapExtraCostFromDb(data[0]);
    }
  },

  async deleteExtraCost(id) {
    const { error } = await supabase
      .from('extra_costs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return id;
  },

  // INSTALLMENTS CRUD
  async getInstallments() {
    const { data, error } = await supabase
      .from('billing_installments')
      .select('*')
      .order('scheduled_date', { ascending: true });
    
    if (error) throw error;
    return data.map(mapInstallmentFromDb);
  },

  async updateInstallment(id, updates) {
    const dbUpdates = {};
    if (updates.date !== undefined) dbUpdates.scheduled_date = updates.date;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.uf !== undefined) dbUpdates.planned_amount_uf = parseFloat(updates.uf) || 0;
    if (updates.comment !== undefined) dbUpdates.comment = updates.comment;
    
    // Financial details
    if (updates.actualInvoiceDate !== undefined) dbUpdates.actual_invoice_date = updates.actualInvoiceDate;
    if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
    if (updates.invoiceFileUrl !== undefined) dbUpdates.invoice_file_url = updates.invoiceFileUrl;
    if (updates.actualPaymentDate !== undefined) dbUpdates.actual_payment_date = updates.actualPaymentDate;
    if (updates.paymentBackupUrl !== undefined) dbUpdates.payment_backup_url = updates.paymentBackupUrl;
    
    // CLP Desglose calculations (when moving to Facturado)
    if (updates.net_clp !== undefined) dbUpdates.net_amount_clp = updates.net_clp;
    if (updates.tax_clp !== undefined) dbUpdates.tax_amount_clp = updates.tax_clp;
    if (updates.total_clp !== undefined) dbUpdates.total_amount_clp = updates.total_clp;

    const { data, error } = await supabase
      .from('billing_installments')
      .update(dbUpdates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return mapInstallmentFromDb(data[0]);
  },

  // Vínculo Presupuesto + Proyecto + Cuotas (Transacción Atómica de Aprobación)
  async approveBudgetAndCreateProject(projectForm, budgetId, billingInstallments) {
    // 1. Create Project
    const projectData = {
      project_number: projectForm.projectNumber,
      project_name: projectForm.rawProjectName,
      client_id: projectForm.clientId,
      superficie: parseFloat(projectForm.superficie) || 0,
      rentabilidad: parseFloat(projectForm.rentabilidad) || 0,
      year: parseInt(projectForm.anio) || new Date().getFullYear(),
      status: 'Activo'
    };

    const { data: dbProj, error: projError } = await supabase
      .from('projects')
      .insert([projectData])
      .select('*, clients(*)')
      .single();
    
    if (projError) throw projError;
    const project = mapProjectFromDb(dbProj);

    // 2. Fetch budget to freeze total_amount
    const { data: dbBudgetItemData } = await supabase
      .from('budget_items')
      .select('*')
      .eq('budget_id', budgetId);

    const frozenTotalAmount = dbBudgetItemData 
      ? dbBudgetItemData.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price)), 0)
      : 0;

    // 3. Update Budget (setApproved and link project_id)
    const { error: budgetError } = await supabase
      .from('budgets')
      .update({
        status: 'Aprobado',
        project_id: project.id,
        total_amount: frozenTotalAmount
      })
      .eq('id', budgetId);
    
    if (budgetError) throw budgetError;

    // 4. Insert billing installments linked to project and budget
    if (billingInstallments && billingInstallments.length > 0) {
      const installmentsToInsert = billingInstallments.map(inst => ({
        project_id: project.id,
        origin_budget_id: budgetId,
        installment_number: inst.numQuota,
        scheduled_date: inst.date,
        planned_amount_uf: parseFloat(inst.uf) || 0,
        status: 'Por facturar'
      }));

      const { error: instError } = await supabase
        .from('billing_installments')
        .insert(installmentsToInsert);
      
      if (instError) throw instError;
    }

    // Retrieve fresh budgets and installments to sync states
    const { data: freshBudget } = await supabase
      .from('budgets')
      .select('*, clients(*), budget_items(*)')
      .eq('id', budgetId)
      .single();

    const { data: freshInsts } = await supabase
      .from('billing_installments')
      .select('*')
      .eq('project_id', project.id);

    return {
      project,
      budget: freshBudget ? mapBudgetFromDb(freshBudget) : null,
      installments: freshInsts ? freshInsts.map(mapInstallmentFromDb) : []
    };
  },

  async disassociateBudget(budgetId) {
    const { data, error } = await supabase
      .from('budgets')
      .update({ project_id: null })
      .eq('id', budgetId)
      .select('*, clients(*), budget_items(*)');
    if (error) throw error;
    return mapBudgetFromDb(data[0]);
  },

  // PROFILES (USERS)
  async getProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data.map(p => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role,
      status: p.status,
      joinedDate: new Date(p.created_at).toLocaleDateString('es-CL'),
      initials: p.name 
        ? p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() 
        : 'US'
    }));
  },

  async toggleProfileStatus(id, currentStatus) {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: nextStatus })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  async updateUser(userId, updates) {
    const { error } = await supabase.rpc('update_user', {
      user_id: userId,
      new_name: updates.name,
      new_email: updates.email,
      new_role: updates.role,
      new_status: updates.status,
      new_password: updates.password || null
    });
    if (error) throw error;
    return {
      id: userId,
      ...updates
    };
  },

  async deleteUser(userId) {
    const { error } = await supabase.rpc('delete_user', {
      user_id: userId
    });
    if (error) throw error;
    return userId;
  }
};
