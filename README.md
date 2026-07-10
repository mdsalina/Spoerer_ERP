# SPOERER ERP Suite

**SPOERER ERP Suite** es una plataforma web modular tipo Single Page Application (SPA) para la administración y control del flujo de clientes, presupuestos, facturación y proyectos de la empresa Spoerer. La aplicación está construida sobre un stack moderno con **React (v19)**, **Vite** y **Supabase** como backend.

---

## 🚀 Características Principales

El sistema está dividido en módulos independientes a los cuales se accede según el rol del usuario:

*   **👥 CRM (Clientes):**
    *   Registro y administración completa de fichas de clientes (RUT, Razón Social, Giro, Dirección, Comuna, Ciudad, Datos de Contacto).
    *   Formateo automático y validación algorítmica de RUT chileno.
    *   Agrupación unificada bajo el parámetro de **"Cliente Real"** para reportes consolidados.
*   **📄 Presupuestos:**
    *   Generación de cotizaciones con ítems detallados (cantidad, precio unitario, total neto automático).
    *   Flujo de estados: *Borrador* ➔ *En revisión* ➔ *Enviado* ➔ *Aprobado* / *Rechazado*.
    *   Carga y almacenamiento de archivos de respaldo en **Supabase Storage**.
    *   Reorganización física automática de archivos en carpetas de almacenamiento según el estado actual del presupuesto.
*   **📊 Proyectos:**
    *   Creación automática de proyectos activos tras la aprobación de un presupuesto (heredando montos y clientes).
    *   Gestión de métricas del proyecto: superficie (m²), rentabilidad proyectada y año de ejecución.
    *   Registro de **Costos Extras** imprevistos asociados al proyecto que afectan la rentabilidad real.
*   **🧾 Facturación:**
    *   Cronograma de cuotas programadas de facturación (*billing installments*).
    *   Conversión automática de montos de UF a CLP en base al valor UF del día de facturación.
    *   Gestión de estados de facturación (*Por facturar* ➔ *Facturada* ➔ *Pagada*).
    *   Registro de número de factura, fecha real de cobro y carga de respaldos de pago.
    *   Exportación de reportes de presupuestos y costos extras consolidados a archivos de Excel (.xlsx).
*   **🔑 Control de Accesos (Usuarios):**
    *   Panel exclusivo para administradores para la gestión de accesos corporativos.
    *   Creación, edición y suspensión (Activo/Inactivo) de perfiles de usuario.
    *   Roles de seguridad (e.g., `Admin`, `Sales`).

---

## 🛠️ Stack Tecnológico

*   **Frontend:**
    *   [React 19](https://react.dev/) - Biblioteca para construir interfaces de usuario.
    *   [Vite](https://vite.dev/) - Herramienta de compilación rápida y servidor de desarrollo.
    *   [Tailwind CSS (v3)](https://tailwindcss.com/) - Estilos vía CDN con configuración personalizada y extendida en `index.html`.
    *   [Lucide React](https://lucide.dev/) - Iconografía de interfaz.
    *   [Mammoth](https://www.npmjs.com/package/mammoth) - Extracción de texto y análisis de archivos `.docx` adjuntos.
    *   [XLSX (SheetJS)](https://sheetjs.com/) - Generación de hojas de cálculo de Excel para reportes financieros.
*   **Backend & Base de Datos:**
    *   [Supabase](https://supabase.com/) - Infraestructura Backend-as-a-Service (PostgreSQL, Auth, Storage).
    *   `@supabase/supabase-js` - SDK oficial para consultas y control en tiempo real.

---

## 📁 Estructura del Código

La estructura de carpetas de la aplicación web sigue un esquema plano y modular:

```
Spoerer_ERP/
├── .agents/                    # Reglas de contexto y habilidades para asistentes de IA
│   └── AGENTS.md               # Directrices del proyecto y diseño para IAs
├── public/                     # Recursos estáticos públicos del navegador
├── src/
│   ├── assets/                 # Imágenes, logos corporativos y recursos gráficos
│   ├── components/             # Componentes de interfaz (Vistas por pestaña)
│   │   ├── CRM.jsx             # Vista del CRM y control de Clientes
│   │   ├── Facturacion.jsx     # Gestión del flujo de cuotas y facturas emitidas
│   │   ├── Login.jsx           # Pantalla de inicio de sesión de Supabase Auth
│   │   ├── Presupuestos.jsx    # Creador de presupuestos y gestión de archivos adjuntos
│   │   ├── Proyectos.jsx       # Gestión de proyectos activos, costos extras y cuotas
│   │   ├── Sidebar.jsx         # Contenedor principal con barra lateral de navegación
│   │   └── Usuarios.jsx        # Gestión de accesos de administrador (Perfiles)
│   ├── utils/                  # Herramientas auxiliares y lógica de servicios
│   │   ├── supabaseClient.js   # Inicialización y exportación del cliente Supabase
│   │   ├── supabaseService.js  # Capa CRUD unificada para consultas y storage
│   │   └── validation.js       # Algoritmos de validación y formateo de RUT chileno
│   ├── App.css                 # Estilos específicos del wrapper de React
│   ├── index.css               # Estilos globales y utilidades personalizadas (.glass-card, etc.)
│   ├── main.jsx                # Punto de entrada y render de React
│   └── App.jsx                 # Estado global de la aplicación y ruteador
├── index.html                  # Plantilla HTML con Tailwind CDN y configuración extendida
├── package.json                # Listado de dependencias y scripts de ejecución
└── vite.config.js              # Configuración del servidor y bundler Vite
```

---

## ⚙️ Configuración del Entorno de Desarrollo

### Requisitos Previos

Asegúrate de tener instalados los siguientes componentes:
*   [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
*   Una base de datos de [Supabase](https://supabase.com/) configurada con las tablas correspondientes (`clients`, `budgets`, `budget_items`, `projects`, `billing_installments`, `extra_costs`, `profiles`).

### Instalación

1.  Clona el repositorio o abre el directorio del proyecto.
2.  Instala las dependencias necesarias ejecutando:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales de Supabase:
    ```env
    VITE_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co
    VITE_SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
    ```
4.  Inicia el servidor de desarrollo local:
    ```bash
    npm run dev
    ```
5.  Abre en tu navegador la dirección indicada en la terminal (usualmente `http://localhost:5173`).

---

## 📋 Scripts Disponibles

En el directorio del proyecto puedes ejecutar:

*   `npm run dev`: Arranca el servidor de desarrollo con recarga en caliente (Hot Module Replacement).
*   `npm run build`: Compila la aplicación optimizada para producción en la carpeta `dist`.
*   `npm run preview`: Previsualiza localmente el build de producción antes del despliegue.
*   `npm run lint`: Ejecuta el analizador estático `oxlint` para verificar errores de sintaxis y buenas prácticas.
