import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';

export default function Presupuestos({ quotes, clients, onAddQuote, onDeleteQuote, projects, onAddProject }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Project Approval modal states
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvingQuote, setApprovingQuote] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [rentabilidad, setRentabilidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [anio, setAnio] = useState('');
  const [numCuotas, setNumCuotas] = useState('');
  const [valorProyecto, setValorProyecto] = useState(0);
  const [cliente, setCliente] = useState('');
  const [billingTable, setBillingTable] = useState([]);
  const [validationError, setValidationError] = useState('');

  // New quote form state
  const [quoteId, setQuoteId] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState(30);
  const [quoteTitle, setQuoteTitle] = useState('Servicios ERP');
  const [backupFiles, setBackupFiles] = useState([]);
  const [isExistingQuote, setIsExistingQuote] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [docxHtml, setDocxHtml] = useState('');
  const [showAiSuccessModal, setShowAiSuccessModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  // Calculate totals
  useEffect(() => {
    const roundedSub = Math.round((parseFloat(subtotal) || 0) * 100) / 100;
    const tx = Math.round((roundedSub * 0.19) * 100) / 100; // 19% tax (IVA)
    const roundedTotal = Math.round((roundedSub + tx) * 100) / 100;

    setTax(tx);
    setTotal(roundedTotal);
  }, [subtotal]);

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
        // Fallback for mocked files in initial state
        setDocxHtml('<div class="text-center py-10"><span class="material-symbols-outlined text-[48px] text-amber-500">warning</span><p class="font-bold text-body-md mt-2 text-on-surface">Vista previa no disponible para archivos simulados.</p><p class="text-label-md text-on-surface-variant mt-1">Por favor descarga el archivo para poder visualizarlo.</p></div>');
      }
    }
  }, [previewFile]);

  // Helper to suggest next quote ID
  const getNextQuoteId = () => {
    const numericIds = quotes
      .map(q => parseInt(q.id.replace(/\D/g, '')))
      .filter(id => !isNaN(id));
    const maxId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    return String(maxId + 1).padStart(4, '0');
  };

  const handleDeleteQuote = (id) => {
    setDeleteConfirmId(id);
  };

  const validateProjectNameFormat = (name) => {
    const regex = /^\d+[\s\S]*?-[\s\S]*?\s+-\s+[\s\S]+$/;
    return regex.test(name);
  };

  const checkAndPrefillExistingProject = (name) => {
    if (!projects) return;
    const existing = projects.find(p => p.projectName.toLowerCase() === name.toLowerCase());
    if (existing) {
      setSuperficie(existing.superficie || '');
      setRentabilidad(existing.rentabilidad || '');
      setAnio(existing.anio || new Date().getFullYear());
      setCliente(existing.cliente || '');
    }
  };

  const handleFolderSearch = async () => {
    try {
      setValidationError('');
      if (window.showDirectoryPicker) {
        const dirHandle = await window.showDirectoryPicker();
        const folderName = dirHandle.name;
        if (validateProjectNameFormat(folderName)) {
          setProjectName(folderName);
          checkAndPrefillExistingProject(folderName);
        } else {
          setValidationError(`La carpeta seleccionada "${folderName}" no cumple con el formato requerido: Nº Proyecto-Nombre - Cliente (Ej: 0280-Edificio Ciudad - TechNova Solutions).`);
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.onchange = (e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const path = files[0].webkitRelativePath;
            const folderName = path.split('/')[0];
            if (validateProjectNameFormat(folderName)) {
              setProjectName(folderName);
              checkAndPrefillExistingProject(folderName);
            } else {
              setValidationError(`La carpeta seleccionada "${folderName}" no cumple con el formato requerido: Nº Proyecto-Nombre - Cliente (Ej: 0280-Edificio Ciudad - TechNova Solutions).`);
            }
          }
        };
        input.click();
      }
    } catch (err) {
      console.warn("Folder picker error or cancelled:", err);
    }
  };

  const handleNumCuotasChange = (val) => {
    setNumCuotas(val);
    regenerateBillingTable(fechaInicio, val, valorProyecto);
  };

  const handleFechaInicioChange = (val) => {
    setFechaInicio(val);
    regenerateBillingTable(val, numCuotas, valorProyecto);
  };

  const handleValorProyectoChange = (val) => {
    setValorProyecto(val);
    regenerateBillingTable(fechaInicio, numCuotas, val);
  };

  const regenerateBillingTable = (startDate, cuotas, totalVal) => {
    const parsedCuotas = parseInt(cuotas);
    const parsedTotalVal = parseFloat(totalVal) || 0;
    if (!startDate || isNaN(parsedCuotas) || parsedCuotas <= 0) {
      setBillingTable([]);
      return;
    }
    
    const ufPerQuota = parseFloat((parsedTotalVal / parsedCuotas).toFixed(2));
    let currentDate = new Date(startDate + 'T00:00:00');
    
    const newTable = [];
    for (let i = 1; i <= parsedCuotas; i++) {
      newTable.push({
        numQuota: String(i).padStart(2, '0'),
        date: currentDate.toISOString().split('T')[0],
        uf: ufPerQuota,
        comment: ''
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    setBillingTable(newTable);
  };

  const handleRowChange = (index, field, value) => {
    setBillingTable(prev => prev.map((row, idx) => {
      if (idx === index) {
        return {
          ...row,
          [field]: field === 'uf' ? (parseFloat(value) || 0) : value
        };
      }
      return row;
    }));
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!projectName) {
      setValidationError("Por favor ingrese el Nº y Nombre del proyecto.");
      return;
    }
    if (!validateProjectNameFormat(projectName)) {
      setValidationError("El nombre del proyecto no cumple con el formato requerido. Debe ser: Nº Proyecto-Nombre - Cliente (Ej: 0280-Edificio Ciudad - TechNova Solutions).");
      return;
    }
    if (!fechaInicio) {
      setValidationError("Por favor seleccione la fecha de inicio de facturación.");
      return;
    }
    if (!numCuotas || numCuotas <= 0) {
      setValidationError("Por favor ingrese un número de cuotas válido.");
      return;
    }

    // Validate that sum of cuotas equals valorProyecto
    const currentSum = billingTable.reduce((acc, row) => acc + (parseFloat(row.uf) || 0), 0);
    const roundedSum = Math.round(currentSum * 100) / 100;
    const expectedTotal = Math.round((parseFloat(valorProyecto) || 0) * 100) / 100;
    if (Math.abs(roundedSum - expectedTotal) >= 0.02) {
      setValidationError(`La suma de las cuotas (${roundedSum.toFixed(2)} UF) no coincide con el valor total del proyecto (${expectedTotal.toFixed(2)} UF). Diferencia: ${(expectedTotal - roundedSum).toFixed(2)} UF.`);
      return;
    }

    // Save project
    const newProjectData = {
      id: projectName,
      projectName: projectName,
      superficie: parseFloat(superficie) || 0,
      rentabilidad: parseFloat(rentabilidad) || 0,
      anio: parseInt(anio) || new Date().getFullYear(),
      cliente: cliente,
      budgets: [
        {
          quoteId: approvingQuote.id,
          amount: parseFloat(valorProyecto) || 0,
          description: descripcion,
          numCuotas: parseInt(numCuotas),
          billingTable: billingTable
        }
      ]
    };

    onAddProject(newProjectData);

    // Update budget status to Approved
    onAddQuote({
      ...approvingQuote,
      status: 'Aprobado'
    });

    // Reset approval modal states
    setIsApproveModalOpen(false);
    setApprovingQuote(null);
    setValidationError('');
  };

  const handleStatusChange = (id, newStatus) => {
    const quote = quotes.find(q => q.id === id);
    if (quote) {
      if (newStatus === 'Aprobado') {
        setApprovingQuote(quote);
        setProjectName('');
        setSuperficie('');
        setRentabilidad('');
        setDescripcion(quote.title || '');
        setValidationError('');
        
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const nextMonthDate = d.toISOString().split('T')[0];
        setFechaInicio(nextMonthDate);
        
        const currentYear = new Date().getFullYear();
        setAnio(currentYear);
        
        setValorProyecto(quote.amount || 0);
        
        const clientNameVal = quote.company || quote.clientName || '';
        setCliente(clientNameVal);
        setNumCuotas(1); // Default 1 cuota as requested
        
        // Regenerate billing table for 1 cuota
        const ufPerQuota = parseFloat((quote.amount || 0).toFixed(2));
        const initialTable = [
          {
            numQuota: '01',
            date: nextMonthDate,
            uf: ufPerQuota,
            comment: ''
          }
        ];
        setBillingTable(initialTable);
        setIsApproveModalOpen(true);
      } else {
        onAddQuote({
          ...quote,
          status: newStatus
        });
      }
    }
  };

  // Open modal for a new quote
  const handleOpenNewQuoteModal = () => {
    setQuoteId(getNextQuoteId());
    setSelectedClient('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setValidity(30);
    setQuoteTitle('Servicios ERP');
    setSubtotal(1200.00); // default value
    setBackupFiles([]);
    setIsExistingQuote(false);
    setIsModalOpen(true);
  };

  // Open modal to edit an existing quote
  const handleEditQuote = (quote) => {
    setQuoteId(quote.id);
    const matchedClient = clients.find(c =>
      c.name === quote.clientName ||
      c.company === quote.company ||
      (c.name || c.company) === quote.clientName
    );
    setSelectedClient(matchedClient ? (matchedClient.name || matchedClient.company) : (quote.clientName || ''));

    let formattedDate = '';
    if (quote.date) {
      const parts = quote.date.split('/');
      if (parts.length === 3) {
        formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        formattedDate = quote.date;
      }
    }
    setIssueDate(formattedDate || new Date().toISOString().split('T')[0]);

    const valDays = quote.validity ? parseInt(quote.validity) || 30 : 30;
    setValidity(valDays);
    setQuoteTitle(quote.title || '');
    
    // Calculate initial subtotal
    const initialSubtotal = quote.items && quote.items.length > 0
      ? quote.items.reduce((sum, item) => sum + (item.qty * item.price), 0)
      : (quote.amount / 1.19);
    setSubtotal(Math.round(initialSubtotal * 100) / 100);

    setBackupFiles(quote.backupFiles || []);
    setIsExistingQuote(true);
    setIsModalOpen(true);
  };

  // Auto-detect if quoteId exists and load it
  useEffect(() => {
    if (!isModalOpen || !quoteId) return;

    // Check if the padded quoteId matches an existing quote
    const paddedId = quoteId.padStart(4, '0');
    const existing = quotes.find(q => q.id === quoteId || q.id === paddedId);

    if (existing) {
      setIsExistingQuote(true);
      const matchedClient = clients.find(c =>
        c.name === existing.clientName ||
        c.company === existing.company ||
        (c.name || c.company) === existing.clientName
      );
      setSelectedClient(matchedClient ? (matchedClient.name || matchedClient.company) : (existing.clientName || ''));

      let formattedDate = '';
      if (existing.date) {
        const parts = existing.date.split('/');
        if (parts.length === 3) {
          formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formattedDate = existing.date;
        }
      }
      setIssueDate(formattedDate || new Date().toISOString().split('T')[0]);

      const valDays = existing.validity ? parseInt(existing.validity) || 30 : 30;
      setValidity(valDays);
      setQuoteTitle(existing.title || '');

      const initialSubtotal = existing.items && existing.items.length > 0
        ? existing.items.reduce((sum, item) => sum + (item.qty * item.price), 0)
        : (existing.amount / 1.19);
      setSubtotal(Math.round(initialSubtotal * 100) / 100);

      setBackupFiles(existing.backupFiles || []);
    } else {
      setIsExistingQuote(false);
    }
  }, [quoteId, isModalOpen, quotes, clients]);

  // Helper to convert file to Base64 (needed for Gemini PDF upload)
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper to extract raw text from DOCX using Mammoth
  const parseDocxText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async (event) => {
        const arrayBuffer = event.target.result;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          resolve(result.value);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Get API key from env
  const getApiKey = () => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'ingresa_tu_api_key_aqui' && envKey.trim() !== '') {
      return envKey;
    }
    return '';
  };
  // Process file with Gemini AI
  const extractDataWithAi = async (file) => {
    const key = getApiKey();
    if (!key) {
      alert('Por favor configure su API Key de Gemini agregando VITE_GEMINI_API_KEY en su archivo .env en la raíz del proyecto.');
      return;
    }

    setIsAiExtracting(true);
    try {
      let payload = null;

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const base64Data = await fileToBase64(file);
        payload = {
          contents: [
            {
              parts: [
                {
                  text: `Extrae los datos de esta cotización / presupuesto en formato JSON estructurado. 
                  Identifica los siguientes campos:
                  - quoteId (número de presupuesto o cotización, ej: 0685 o 8992. Si no se indica o no se encuentra en el documento, devolver vacío)
                  - clientName (nombre del cliente)
                  - title (título o proyecto)
                  - date (fecha de emisión en formato YYYY-MM-DD)
                  - validity (validez en días, solo el número, ej: si dice 30 días o validez 30, devuelve 30. Por defecto 30)
                  - subtotal (monto total neto antes de impuestos. Si en el documento solo viene el total con IVA/impuestos incluidos, calcula el subtotal neto dividiendo el total por 1.19. Si ya viene el subtotal o valor neto, úsalo directamente como número)
                  
                  Busca mapear el nombre del cliente lo mejor posible con alguno de los siguientes clientes si se parecen:
                  ${clients.map(c => `- ${c.name ? `${c.name} (${c.company})` : c.company}`).join('\n')}`
                },
                {
                  inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                  }
                }
              ]
            }
          ]
        };
      } else if (file.name.toLowerCase().endsWith('.docx')) {
        const textContent = await parseDocxText(file);
        payload = {
          contents: [
            {
              parts: [
                {
                  text: `Extrae los datos de esta cotización / presupuesto en formato JSON estructurado a partir del siguiente texto extraído de un archivo Word DOCX:
                  
                  TEXTO DEL DOCUMENTO:
                  """
                  ${textContent}
                  """
                  
                  Identifica los siguientes campos:
                  - quoteId (número de presupuesto o cotización, ej: 0685 o 8992. Si no se indica o no se encuentra en el documento, devolver vacío)
                  - clientName (nombre del cliente)
                  - title (título o proyecto)
                  - date (fecha de emisión en formato YYYY-MM-DD)
                  - validity (validez en días, solo el número, ej: si dice 30 días o validez 30, devuelve 30. Por defecto 30)
                  - subtotal (monto total neto antes de impuestos. Si en el documento solo viene el total con IVA/impuestos incluidos, calcula el subtotal neto dividiendo el total por 1.19. Si ya viene el subtotal o valor neto, úsalo directamente como número)
                  
                  Busca mapear el nombre del cliente lo mejor posible con alguno de los siguientes clientes si se parecen:
                  ${clients.map(c => `- ${c.name ? `${c.name} (${c.company})` : c.company}`).join('\n')}`
                }
              ]
            }
          ]
        };
      } else {
        alert('Formato de archivo no soportado. Por favor use PDF o DOCX.');
        setIsAiExtracting(false);
        return;
      }

      // Using gemini-3.5-flash as the standard model
      const model = "gemini-3.5-flash";
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                quoteId: { type: "STRING", description: "Número de presupuesto o cotización (ej: 0685). Devolver vacío si no se encuentra o no se puede obtener." },
                clientName: { type: "STRING" },
                title: { type: "STRING" },
                date: { type: "STRING", description: "Formato YYYY-MM-DD" },
                validity: { type: "INTEGER", description: "Validez en días (número)" },
                subtotal: { type: "NUMBER", description: "Monto total neto antes de impuestos (subtotal). Si el documento sólo tiene el total bruto, divídelo por 1.19 para obtener el neto." }
              },
              required: ["clientName", "title", "subtotal"]
            }
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errText}`);
      }

      const resJson = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('No se recibió respuesta estructurada de Gemini');
      }

      const data = JSON.parse(rawText);

      // Fill form values:

      // 1. Budget ID (Quote Number)
      if (data.quoteId) {
        const digits = data.quoteId.replace(/\D/g, '');
        if (digits) {
          setQuoteId(digits.padStart(4, '0'));
        }
      }

      // 2. Client Name (Only map if it matches a pre-existing client in the DB)
      if (data.clientName) {
        const matched = clients.find(c =>
          (c.name && c.name.toLowerCase().includes(data.clientName.toLowerCase())) ||
          (c.name && data.clientName.toLowerCase().includes(c.name.toLowerCase())) ||
          (c.company && c.company.toLowerCase().includes(data.clientName.toLowerCase()))
        );
        if (matched) {
          setSelectedClient(matched.name || matched.company);
        }
      }

      // 3. Project Title
      if (data.title) setQuoteTitle(data.title);

      // 4. Dates
      if (data.date) setIssueDate(data.date);
      if (data.validity) setValidity(data.validity);

      // 5. Subtotal
      if (typeof data.subtotal === 'number' || data.subtotal) {
        setSubtotal(parseFloat(data.subtotal) || 0);
      }

      setShowAiSuccessModal(true);
    } catch (error) {
      console.error('Error al extraer datos con IA:', error);
      alert(`Error al procesar el archivo con la IA: ${error.message}. Por favor verifique su API Key o la conexión.`);
    } finally {
      setIsAiExtracting(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const invalidFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ext !== 'pdf' && ext !== 'docx';
    });

    if (invalidFiles.length > 0) {
      alert('Solo se permiten archivos PDF y DOCX.');
      return;
    }

    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      fileObject: file // Keep the original File object for AI extraction
    }));

    setBackupFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setBackupFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedClient || selectedClient === 'Select Client...') {
      alert('Por favor seleccione un cliente');
      return;
    }

    const clientObj = clients.find(c => (c.name || c.company) === selectedClient) || { name: selectedClient };
    const clientName = clientObj.name || clientObj.company || selectedClient;
    const companyName = clientObj.company || 'N/A';

    const formattedId = quoteId.replace(/\D/g, '').padStart(4, '0');
    if (!formattedId) {
      alert('Por favor ingrese un número de presupuesto válido');
      return;
    }

    const newQuote = {
      id: formattedId,
      clientName: clientName,
      company: companyName,
      title: quoteTitle,
      date: issueDate.split('-').reverse().join('/'),
      amount: total,
      validity: `${validity} días`,
      status: 'Borrador',
      items: [
        { id: 1, description: quoteTitle || 'Servicios ERP', qty: 1, price: parseFloat(subtotal) || 0 }
      ],
      backupFiles: backupFiles
    };

    onAddQuote(newQuote);

    // Reset form
    setSelectedClient('');
    setValidity(30);
    setQuoteTitle('Servicios ERP');
    setSubtotal(0);
    setBackupFiles([]);
    setQuoteId('');
    setIsExistingQuote(false);
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
            onClick={handleOpenNewQuoteModal}
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

        <div className="flex gap-2 overflow-x-auto pb-2">
          {['Todos', 'Borrador', 'En revisión', 'Enviado', 'Aprobado', 'Rechazado'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-md py-1.5 rounded-lg text-body-sm transition-all font-semibold ${statusFilter === status
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
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Título / Proyecto</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha de Emisión</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Monto Total (UF)</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Validez</th>
                <th className="p-md font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Respaldo</th>
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
                      </div>
                    </td>
                    <td className="p-md font-body-md text-on-surface">{quote.title}</td>
                    <td className="p-md font-body-md text-on-surface">{quote.date}</td>
                    <td className="p-md font-body-md font-bold text-on-surface text-right">
                      ${quote.amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-md font-body-md text-on-surface">{quote.validity}</td>
                    <td className="p-md text-center">
                      {quote.backupFiles && quote.backupFiles.length > 0 ? (
                        <div className="flex justify-center items-center gap-1.5">
                          {quote.backupFiles.map((file, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              className="text-secondary hover:text-primary transition-colors flex items-center"
                              title={`Previsualizar ${file.name}`}
                            >
                              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>
                                {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/30 text-label-sm italic">-</span>
                      )}
                    </td>
                    <td className="p-md">
                      <select
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                        className={`px-2 py-0.5 rounded-full text-label-sm font-bold border cursor-pointer outline-none transition-all ${
                          quote.status === 'Borrador'
                            ? 'bg-slate-100 text-slate-700 border-slate-300'
                            : quote.status === 'En revisión'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : quote.status === 'Enviado'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : quote.status === 'Aprobado' || quote.status === 'Aprovado'
                                  ? 'bg-secondary-container text-on-secondary-container border-secondary/20'
                                  : quote.status === 'Rechazado'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Borrador">Borrador</option>
                        <option value="En revisión">En revisión</option>
                        <option value="Enviado">Enviado</option>
                        <option value="Aprobado">Aprobado</option>
                        <option value="Rechazado">Rechazado</option>
                      </select>
                    </td>
                    <td className="p-md text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="p-1 hover:bg-slate-100 rounded text-secondary hover:text-secondary-fixed-dim transition-all"
                          title="Editar Presupuesto"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-1 hover:bg-red-50 rounded text-error hover:text-red-700 transition-all"
                          title="Eliminar Presupuesto"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-on-surface-variant italic">
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
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0 z-10">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Detalle del Presupuesto</h2>
                <p className="text-body-md text-on-surface-variant flex items-center gap-2">
                  {isExistingQuote ? (
                    <>
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="font-bold text-emerald-600">Editando Presupuesto Existente #{quoteId.padStart(4, '0')}</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <span>Creando Nuevo Presupuesto #{quoteId.padStart(4, '0')}</span>
                    </>
                  )}
                </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                
                {/* Columna Izquierda: Información General, Fechas y Finanzas */}
                <div className="space-y-lg">
                  {/* Tarjeta de Información de la Cotización */}
                  <div className="bg-slate-50/50 p-md rounded-xl border border-slate-200/60 space-y-md animate-fade-in">
                    <h3 className="text-body-md font-bold text-primary flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">info</span>
                      Información de la Cotización
                    </h3>
                    
                    {/* Fila 1: N° Presupuesto y Cliente */}
                    <div className="grid grid-cols-3 gap-md">
                      <div className="flex flex-col gap-xs col-span-1">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">N° Presupuesto</label>
                        <input
                          className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="text"
                          value={quoteId}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setQuoteId(val);
                          }}
                          onBlur={() => {
                            if (quoteId) {
                              setQuoteId(quoteId.padStart(4, '0'));
                            }
                          }}
                          placeholder="Ej: 0685"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-xs col-span-2">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Cliente</label>
                        <select
                          className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          value={selectedClient}
                          onChange={(e) => setSelectedClient(e.target.value)}
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
                          {selectedClient && !clients.some(c => (c.name || c.company) === selectedClient) && (
                            <option value={selectedClient}>{selectedClient}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Fila 2: Título / Proyecto */}
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Título / Proyecto</label>
                      <input
                        className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                        type="text"
                        value={quoteTitle}
                        onChange={(e) => setQuoteTitle(e.target.value)}
                        placeholder="Ej: Licencias e Implementación de Servidores"
                        required
                      />
                    </div>

                    {/* Fila 3: Fecha de Emisión y Validez */}
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Fecha de Emisión</label>
                        <input
                          className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="date"
                          value={issueDate}
                          onChange={(e) => setIssueDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Validez (Días)</label>
                        <input
                          className="w-full border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="number"
                          value={validity}
                          onChange={(e) => setValidity(e.target.value)}
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Separador de Valores Financieros */}
                    <h4 className="text-body-sm font-bold text-primary flex items-center gap-2 pt-sm border-t border-slate-200/60">
                      <span className="material-symbols-outlined text-[18px] text-secondary">payments</span>
                      Valores Financieros (Neto)
                    </h4>

                    {/* Fila 4: Subtotal Neto */}
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Subtotal (Neto)</label>
                      <div className="relative rounded-lg shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-slate-500 text-body-md">$</span>
                        </div>
                        <input
                          type="number"
                          className="w-full pl-7 border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all font-bold bg-white"
                          value={subtotal}
                          onChange={(e) => setSubtotal(e.target.value)}
                          onBlur={(e) => {
                            const rounded = Math.round((parseFloat(e.target.value) || 0) * 100) / 100;
                            setSubtotal(rounded);
                          }}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Fila 5: Impuestos y Totales */}
                    <div className="space-y-sm pt-sm border-t border-slate-200/60">
                      <div className="flex justify-between text-body-sm text-on-surface-variant px-1">
                        <span>Impuesto (19% IVA)</span>
                        <span className="font-medium">${tax.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center bg-secondary/5 px-md py-2.5 rounded-lg border border-secondary/10">
                        <span className="text-body-md font-bold text-secondary">Total (IVA Incluido)</span>
                        <span className="text-title-lg font-black text-secondary">
                          ${total.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Documentos de Respaldo */}
                <div className="space-y-lg">
                  {/* Tarjeta de Documentos de Respaldo y Extracción IA */}
                  <div className="bg-slate-50/50 p-md rounded-xl border border-slate-200/60 space-y-md">
                    <h3 className="text-body-md font-bold text-primary flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">cloud_upload</span>
                      Documentos de Respaldo
                    </h3>

                    <div className="flex items-center gap-md flex-wrap pt-xs">
                      <label className="flex items-center gap-2 px-md py-2.5 border border-dashed border-outline-variant hover:border-secondary rounded-lg bg-white hover:bg-slate-50 text-on-surface hover:text-primary transition-all cursor-pointer text-body-sm font-bold shadow-sm">
                        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">upload_file</span>
                        <span>Subir Respaldo</span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>

                      {backupFiles.some(f => f.fileObject) && (
                        <button
                          type="button"
                          onClick={() => {
                            const recentFile = [...backupFiles].reverse().find(f => f.fileObject);
                            if (recentFile) {
                              extractDataWithAi(recentFile.fileObject);
                            }
                          }}
                          disabled={isAiExtracting}
                          className={`flex items-center gap-2 px-md py-2.5 rounded-lg text-white font-bold text-body-sm shadow-md transition-all active:scale-95 ${isAiExtracting
                            ? 'bg-slate-400 cursor-not-allowed animate-pulse'
                            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/20'
                            }`}
                        >
                          {isAiExtracting ? (
                            <>
                              <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                              <span>Procesando...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px]">psychology</span>
                              <span>Extracción IA</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <span className="text-label-sm text-on-surface-variant italic block">Formatos permitidos: PDF y DOCX</span>

                    {backupFiles.length > 0 ? (
                      <div className="space-y-sm mt-md max-h-[300px] overflow-y-auto pr-xs custom-scrollbar">
                        {backupFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-outline-variant/30 shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-secondary flex-shrink-0">
                                {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-body-sm font-bold truncate max-w-[140px]" title={file.name}>{file.name}</span>
                                <span className="text-label-sm text-on-surface-variant">{(file.size / 1024).toFixed(1)} KB</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="p-1 hover:bg-slate-200 rounded text-secondary hover:text-primary transition-all"
                                title="Visualizar respaldo"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                              {file.url && (
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="p-1 hover:bg-slate-200 rounded text-secondary transition-all"
                                  title="Descargar"
                                >
                                  <span className="material-symbols-outlined text-[18px]">download</span>
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(idx)}
                                className="p-1 hover:bg-slate-200 rounded text-error hover:text-red-600 transition-all"
                                title="Eliminar"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-body-sm text-on-surface-variant italic pt-sm">No hay archivos de respaldo adjuntos.</p>
                    )}
                  </div>
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

      {/* AI Success Notification Modal */}
      {showAiSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-lg max-w-sm w-full text-center border border-outline-variant/30 animate-scale-up space-y-md">
            <div className="mx-auto w-14 h-14 bg-secondary-container/40 rounded-full flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-[32px] animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <div className="space-y-xs">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">¡Procesamiento Exitoso!</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                La inteligencia artificial ha analizado el archivo y cargado los campos del presupuesto correctamente en el formulario.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAiSuccessModal(false)}
              className="w-full py-2.5 bg-secondary text-white rounded-lg hover:brightness-105 transition-all font-bold text-label-md active:scale-95 shadow-md shadow-secondary/15"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-lg max-w-sm w-full text-center border border-outline-variant/30 animate-scale-up space-y-md animate-fade-in">
            <div className="mx-auto w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <span className="material-symbols-outlined text-[32px] text-error animate-pulse" style={{ fontVariationSettings: "'FILL' 0" }}>
                warning
              </span>
            </div>
            <div className="space-y-xs text-center">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">¿Eliminar Presupuesto?</h3>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                ¿Está seguro de que desea eliminar el presupuesto <strong>#{deleteConfirmId}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-bold text-label-md active:scale-95 border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteQuote) {
                    onDeleteQuote(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2 bg-error text-white rounded-lg hover:brightness-105 transition-all font-bold text-label-md active:scale-95 shadow-md shadow-error/15"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Aprobar Presupuesto y Crear Proyecto */}
      {isApproveModalOpen && approvingQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-primary/40 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl flex flex-col animate-scale-up border border-outline-variant/30">
            {/* Header */}
            <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0 z-10">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">Aprobar Presupuesto y Crear Proyecto</h2>
                <p className="text-body-md text-on-surface-variant flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                  <span>Configurando proyecto para el Presupuesto <strong>#{approvingQuote.id}</strong></span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsApproveModalOpen(false);
                  setApprovingQuote(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content (Form) */}
            <form onSubmit={handleApproveSubmit} className="p-lg space-y-lg text-left">
              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-md text-body-sm flex items-start gap-2 animate-fade-in mb-md">
                  <span className="material-symbols-outlined text-[18px] text-red-600 flex-shrink-0">warning</span>
                  <div>
                    <span className="font-bold">Aviso del Sistema: </span>
                    {validationError}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                
                {/* Columna Izquierda: Información del Proyecto */}
                <div className="space-y-lg">
                  <div className="bg-slate-50/50 p-md rounded-xl border border-slate-200/60 space-y-md">
                    <h3 className="text-body-md font-bold text-primary flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">folder</span>
                      Datos Generales del Proyecto
                    </h3>
                    
                    {/* Campo: Nº y Nombre del proyecto */}
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                        Nº y Nombre del Proyecto
                      </label>
                      <div className="flex gap-2">
                        <input
                          className="flex-grow border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="text"
                          value={projectName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProjectName(val);
                            checkAndPrefillExistingProject(val);
                          }}
                          placeholder="Ej: 0280-NombreProyecto - Cliente"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleFolderSearch}
                          className="px-3 bg-secondary text-white rounded-lg hover:brightness-105 transition-all flex items-center justify-center shadow-sm"
                          title="Buscar carpeta en PC"
                        >
                          <span className="material-symbols-outlined text-[20px]">search</span>
                        </button>
                      </div>
                      <span className="text-[11px] text-on-surface-variant/80">
                        Formato requerido: <strong>Nº Proyecto-Nombre - Cliente</strong>
                      </span>
                    </div>

                    {/* Fila: Nº Presupuesto y Cliente (Solo lectura) */}
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Nº Presupuesto</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 bg-slate-100/80 text-on-surface-variant/80 cursor-not-allowed outline-none"
                          type="text"
                          value={approvingQuote.id}
                          readOnly
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Cliente</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 bg-slate-100/80 text-on-surface-variant/80 cursor-not-allowed outline-none"
                          type="text"
                          value={cliente}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Fila: Superficie y Rentabilidad */}
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Superficie (m2)</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="number"
                          value={superficie}
                          onChange={(e) => setSuperficie(e.target.value)}
                          placeholder="Ej: 150"
                          min="0"
                          step="0.1"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Rentabilidad Esperada (%)</label>
                        <div className="relative rounded-lg shadow-sm">
                          <input
                            className="w-full pr-7 border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white font-bold"
                            type="number"
                            value={rentabilidad}
                            onChange={(e) => setRentabilidad(e.target.value)}
                            placeholder="Ej: 25"
                            min="0"
                            max="100"
                            step="0.1"
                            required
                          />
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <span className="text-slate-500 text-body-md">%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Fila: Valor Proyecto (UF) y Año */}
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Valor Proyecto (UF)</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white font-bold text-secondary"
                          type="number"
                          value={valorProyecto}
                          onChange={(e) => handleValorProyectoChange(e.target.value)}
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Año del Proyecto</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                          type="number"
                          value={anio}
                          onChange={(e) => setAnio(e.target.value)}
                          placeholder="Ej: 2026"
                          required
                        />
                      </div>
                    </div>

                    {/* Fila: Fecha inicio y Nº Cuotas */}
                    <div className="grid grid-cols-2 gap-md">
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Inicio Facturación</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white font-medium"
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => handleFechaInicioChange(e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-xs">
                        <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Nº Cuotas</label>
                        <input
                          className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white font-medium"
                          type="number"
                          value={numCuotas}
                          onChange={(e) => handleNumCuotasChange(e.target.value)}
                          placeholder="Ej: 12"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Descripción del Proyecto */}
                    <div className="flex flex-col gap-xs">
                      <label className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Descripción Corta</label>
                      <textarea
                        className="w-full border border-slate-200 rounded-lg text-body-md py-2 px-3 focus:ring-1 focus:ring-secondary focus:border-secondary outline-none transition-all bg-white"
                        rows="2"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Ingrese comentarios sobre los alcances del proyecto..."
                      />
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Tabla de Facturación */}
                <div className="space-y-lg flex flex-col h-full">
                  <div className="bg-slate-50/50 p-md rounded-xl border border-slate-200/60 space-y-md flex-grow flex flex-col">
                    <h3 className="text-body-md font-bold text-primary flex items-center gap-2 border-b border-slate-200/60 pb-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">calendar_month</span>
                      Cronograma de Facturación
                    </h3>

                    {billingTable.length > 0 ? (
                      <>
                        <div className="flex-grow overflow-y-auto max-h-[380px] custom-scrollbar border border-slate-200/60 rounded-lg bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-100 text-slate-700 text-label-sm uppercase font-bold sticky top-0">
                              <tr>
                                <th className="p-2 border-b border-slate-200 text-center w-12">Cuota</th>
                                <th className="p-2 border-b border-slate-200">Fecha</th>
                                <th className="p-2 border-b border-slate-200 text-right w-24">UF</th>
                                <th className="p-2 border-b border-slate-200">Comentario</th>
                              </tr>
                            </thead>
                            <tbody className="text-body-sm divide-y divide-slate-100">
                              {billingTable.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2 font-bold text-slate-500 text-center w-12 bg-slate-50/40">
                                    {row.numQuota}
                                  </td>
                                  <td className="p-1">
                                    <input
                                      type="date"
                                      value={row.date}
                                      onChange={(e) => handleRowChange(idx, 'date', e.target.value)}
                                      className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm"
                                    />
                                  </td>
                                  <td className="p-1 w-24">
                                    <input
                                      type="number"
                                      value={row.uf}
                                      onChange={(e) => handleRowChange(idx, 'uf', e.target.value)}
                                      className="w-full border-0 bg-transparent p-1 focus:ring-1 focus:ring-secondary focus:bg-white rounded outline-none text-body-sm font-semibold text-right"
                                      step="0.01"
                                    />
                                  </td>
                                  <td className="p-1">
                                    <input
                                      type="text"
                                      value={row.comment}
                                      onChange={(e) => handleRowChange(idx, 'comment', e.target.value)}
                                      placeholder="..."
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
                          const currentSum = billingTable.reduce((acc, r) => acc + (parseFloat(r.uf) || 0), 0);
                          const roundedSum = Math.round(currentSum * 100) / 100;
                          const expectedTotal = Math.round((parseFloat(valorProyecto) || 0) * 100) / 100;
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
                      </>
                    ) : (
                      <div className="flex-grow flex flex-col items-center justify-center p-xl border border-dashed border-outline-variant/60 rounded-lg text-on-surface-variant italic text-body-sm">
                        <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2">calendar_today</span>
                        Ingrese Fecha Inicio y Nº Cuotas para generar la tabla.
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-md pt-lg border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => {
                    setIsApproveModalOpen(false);
                    setApprovingQuote(null);
                  }}
                  className="px-lg py-2 border border-outline-variant rounded text-on-surface hover:bg-slate-50 transition-all font-bold"
                >
                  Cancelar Aprobación
                </button>
                <button
                  type="submit"
                  className="px-lg py-2 bg-secondary text-white rounded hover:brightness-110 transition-all font-bold shadow-lg shadow-secondary/20 active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Aprobar Presupuesto y Crear Proyecto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
