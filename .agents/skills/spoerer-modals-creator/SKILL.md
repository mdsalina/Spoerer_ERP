---
name: spoerer-modals-creator
description: "Guía detallada y estándares de diseño para crear, editar o refactorizar ventanas modales, formularios emergentes y diálogos de confirmación en el ERP/CRM de SPOERER. Utiliza esta skill siempre que el usuario pida agregar un modal, un formulario emergente, un diálogo de éxito o confirmación, o cuando modifiques modales existentes en la aplicación React."
---

# Directrices para la Creación de Modales en SPOERER ERP

Esta skill define la estructura visual, la tipografía, la paleta de colores, las micro-animaciones y la lógica de negocio que deben aplicarse estrictamente al diseñar o editar ventanas modales y diálogos dentro de la aplicación.

---

## 1. Estructura y Clases de Tailwind

Todos los modales deben estructurarse usando el siguiente patrón JSX para garantizar la consistencia visual y los efectos premium de la aplicación:

### A. Backdrop (Fondo de superposición)
El fondo del modal bloquea la pantalla principal y enfoca la atención. Debe usar el color `primary` de la marca con opacidad y desenfoque:
* **Clase recomendada:** `fixed inset-0 z-50 flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4`
* Para modales secundarios o superpuestos sobre otros modales, incrementa el valor de `z-index` (ej: `z-[60]` o `z-[70]`).

### B. Contenedor del Modal (Card)
El contenedor principal del modal debe usar un fondo claro (`bg-white`), bordes redondeados y una sombra marcada para dar profundidad:
* **Clase recomendada:** `relative bg-white w-full rounded-xl shadow-2xl flex flex-col border border-outline-variant animate-scale-up`
* **Tamaños máximos estándar (`max-w-*`):**
  - **Diálogos de Confirmación / Alertas:** `max-w-md` (448px)
  - **Formularios Simples / Creación Básica:** `max-w-xl` (576px)
  - **Formularios Complejos (Clientes, Usuarios):** `max-w-2xl` (672px)
  - **Visualización de Detalles / Datos tabulares (Presupuestos, Proyectos):** `max-w-4xl` (896px) o `max-w-5xl` (1024px)
* **Control de Scroll:** Si el contenido es extenso, limita la altura máxima y permite el desplazamiento del cuerpo:
  `max-h-[90vh] overflow-y-auto`

### C. Cabecera (Header)
La cabecera debe estar claramente separada y contener el título y el botón de cierre:
* **Clase recomendada:** `px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface sticky top-0 z-10`
* **Título:** Usa `font-headline-sm text-headline-sm text-primary font-bold` (o `font-headline-md text-headline-md` para modales de tamaño `max-w-4xl` o superior).
* **Botón de Cierre:**
  ```jsx
  <button 
    type="button" 
    onClick={handleClose} 
    className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-all"
  >
    <span className="material-symbols-outlined">close</span>
  </button>
  ```

### D. Cuerpo (Body / Formulario)
El relleno interno debe ser generoso y alineado a la izquierda:
* **Clase recomendada:** `p-lg space-y-md text-left` o `p-lg space-y-lg text-left`
* **Distribución de campos (Grid):**
  ```jsx
  <div className="grid grid-cols-1 md:grid-cols-2 gap-md text-left">
    {/* Campos del formulario */}
  </div>
  ```

### E. Campos del Formulario (Inputs, Labels, Selects)
* **Labels (Etiquetas):** Deben ser de tamaño pequeño, negrita y en mayúsculas:
  `font-label-sm text-label-sm text-on-surface-variant font-bold uppercase tracking-wider`
* **Inputs y Selects:**
  `w-full border border-outline-variant rounded-lg p-sm focus:border-secondary focus:ring-1 focus:ring-secondary/20 outline-none transition-all font-body-md text-body-md bg-white`
  - *Nota sobre error de validación:* Si un campo tiene un error (como RUT inválido), cambia la clase del borde a:
    `border-error focus:ring-error/20 focus:border-error`

### F. Pie de Modal (Footer / Botones de acción)
Los botones deben alinearse a la derecha, con un espaciado consistente:
* **Clase recomendada:** `pt-lg flex justify-end gap-md border-t border-outline-variant/30 sticky bottom-0 bg-white z-10`
* **Botón Cancelar (Secundario):**
  `px-lg py-sm font-semibold text-on-surface-variant hover:text-on-surface transition-all` (debe ser un botón de tipo `type="button"`).
* **Botón Confirmar/Submit (Primario):**
  `bg-primary text-white px-xl py-sm rounded-lg font-semibold shadow-sm hover:bg-primary-container active:scale-95 transition-all`
  - Nota: Utiliza la micro-animación `active:scale-95 transition-all` para dar respuesta interactiva inmediata al clic del usuario.

---

## 2. Tipos de Modales Especiales

### A. Modal de Éxito o Confirmación
Utilizado para notificar que un registro fue creado o modificado de manera correcta:
* **Tamaño:** `max-w-md`
* **Estructura del Cuerpo:**
  - Icono grande y centrado en la parte superior:
    ```jsx
    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-sm mb-2">
      <span className="material-symbols-outlined text-[36px]">verified</span>
    </div>
    ```
  - Título y mensaje de confirmación:
    `<h3 className="font-headline-sm text-headline-sm text-primary font-bold">¡Acción Exitosa!</h3>`
  - Caja de resumen de datos (opcional):
    `<div className="bg-slate-50 p-md rounded-xl border border-slate-100 text-left space-y-sm">...</div>`

---

## 3. Consideraciones de Diseño y Configuración de Tailwind

* **Bordes Redondeados (`borderRadius`):** En este proyecto, la configuración de Tailwind en [index.html](file:///d:/Programacion/Spoerer_ERP/index.html) redefine los radios de borde estándar:
  - `rounded-lg` equivale a `0.25rem` (4px).
  - `rounded-xl` equivale a `0.5rem` (8px).
  - `rounded-full` equivale a `0.75rem` (12px).
  *Evita usar `rounded-full` si buscas crear un círculo perfecto para un botón de cierre o un avatar; en su lugar, utiliza un borde específico o asegúrate de que las dimensiones coincidan para que se aplique correctamente el radio.*

* **Colores de la Paleta Extendida:**
  - Fondo del Modal/Backdrop: `bg-primary/40` (o `bg-primary/60` para superposiciones).
  - Encabezados de Sección o Textos Destacados: `text-primary`.
  - Bordes y Separadores: `border-outline-variant`.
  - Estados o Focos de Entrada: `focus:border-secondary focus:ring-secondary/20`.
  - Subtextos y Labels: `text-on-surface-variant`.

---

## 4. Reglas de Negocio en Modales

Al desarrollar modales que capturen o muestren información, debes cumplir con las siguientes directrices de negocio del ERP:

### A. Conversión y Formato de Fechas
* Por definición de negocio, todas las fechas que se presenten al usuario en la interfaz o que se exporten deben mostrarse en formato `dd/mm/yyyy` (ej. `15/10/2026`).
* Como los elementos `<input type="date">` manejan nativamente el formato `yyyy-mm-dd`, debes:
  1. Convertir la fecha de la base de datos o estado (`dd/mm/yyyy`) al formato nativo `yyyy-mm-dd` al cargar el modal.
  2. Convertir el valor de entrada (`yyyy-mm-dd`) de vuelta a `dd/mm/yyyy` al guardar los datos o enviarlos al servicio.
  *Ejemplo de conversión:*
  ```javascript
  // Al cargar en el input (dd/mm/yyyy -> yyyy-mm-dd)
  const formatToInputDate = (dateStr) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Al guardar (yyyy-mm-dd -> dd/mm/yyyy)
  const formatToDbDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };
  ```

### B. Validaciones de Identificación (RUT Chileno)
* Si el modal incluye un campo de RUT (ej. en Clientes o Usuarios), es obligatorio:
  1. Formatear dinámicamente el valor usando la función `formatRut()` de [validation.js](file:///d:/Programacion/Spoerer_ERP/src/utils/validation.js).
  2. Validar que sea un RUT real usando `validateRut()` de [validation.js](file:///d:/Programacion/Spoerer_ERP/src/utils/validation.js).
  3. Mostrar mensajes de error de forma condicional aplicando clases `border-error` en el input si la validación falla.

### C. Integración con Supabase y Gestión del Estado Plano
* **Llamado a la Base de Datos:** Nunca ejecutes `supabase.from(...)` de manera directa en los componentes de los modales. Utiliza las funciones encapsuladas en [supabaseService.js](file:///d:/Programacion/Spoerer_ERP/src/utils/supabaseService.js). Si se requiere una nueva consulta, agrégala al objeto de servicios.
* **Mapeo de Datos:** Aplica los helpers de mapeo (ej. `mapClientToDb` y `mapClientFromDb`) al interactuar con el backend para la conversión de variables entre *camelCase* (Frontend) y *snake_case* (Base de Datos).
* **Actualización en Cascada:** Al guardar cambios de forma exitosa en el modal, actualiza las referencias en el estado plano de React mantenido en [App.jsx](file:///d:/Programacion/Spoerer_ERP/src/App.jsx) (ej. `clients`, `quotes`, `projects`) para gatillar renders limpios en cascada en toda la aplicación.
