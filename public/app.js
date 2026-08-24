import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://pbqeepnxthppgpdpbzwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JZmwSp6d8vF0WV-hChz9EQ_KQozWIt5';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cargar dinámicamente las sucursales, departamentos y categorías al abrir el formulario
async function cargarOpcionesFormulario() {
    const selectSucursal = document.getElementById('sucursal');
    const selectDepartamento = document.getElementById('departamento');
    const selectCategoria = document.getElementById('categoria');

    // 1. Cargar Sucursales
    if (selectSucursal) {
        const { data: sucs, error } = await supabase.from('config_sucursales').select('*').order('id');
        if (!error && sucs) {
            selectSucursal.innerHTML = '<option value="">Selecciona una sucursal...</option>' + 
                sucs.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
        } else {
            selectSucursal.innerHTML = '<option value="">Error al cargar sucursales</option>';
        }
    }

    // 2. Cargar Departamentos / Áreas
    if (selectDepartamento) {
        const { data: deps, error } = await supabase.from('config_departamentos').select('*').order('id');
        if (!error && deps) {
            selectDepartamento.innerHTML = '<option value="">Selecciona un departamento...</option>' + 
                deps.map(d => `<option value="${d.nombre}">${d.nombre}</option>`).join('');
        } else {
            selectDepartamento.innerHTML = '<option value="">Error al cargar departamentos</option>';
        }
    }

    // 3. Cargar Categorías
    if (selectCategoria) {
        const { data: cats, error } = await supabase.from('config_categorias').select('*').order('id');
        if (!error && cats) {
            selectCategoria.innerHTML = '<option value="">Selecciona una categoría...</option>' + 
                cats.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
        } else {
            selectCategoria.innerHTML = '<option value="">Error al cargar categorías</option>';
        }
    }
}

// Ejecutar al cargar la página
cargarOpcionesFormulario();

// Manejo del envío del ticket
const ticketForm = document.getElementById('ticketForm');
if (ticketForm) {
    ticketForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const sucursal = document.getElementById('sucursal').value;
        const departamento = document.getElementById('departamento').value;
        const solicitante = document.getElementById('solicitante').value;
        const correo = document.getElementById('correo').value;
        const categoria = document.getElementById('categoria').value;
        const urgencia = document.getElementById('urgencia').value;
        const descripcion = document.getElementById('descripcion').value;
        const archivoInput = document.getElementById('adjunto');
        const archivoNombre = archivoInput.files.length > 0 ? archivoInput.files[0].name : "Ninguno";

        const { error } = await supabase
            .from('tickets')
            .insert([{ 
                sucursal, 
                departamento, 
                solicitante, 
                correo, 
                categoria, 
                urgencia, 
                descripcion, 
                archivo: archivoNombre, 
                estado: 'Abierto' 
            }]);

        if (error) {
            console.error('Error al guardar el ticket:', error);
            alert('Hubo un error al crear el ticket: ' + error.message);
        } else {
            alert(`¡Ticket creado con éxito y guardado en la base de datos!\n\nSucursal: ${sucursal}\nDepartamento: ${departamento}\nSolicitante: ${solicitante}`);
            ticketForm.reset();
            // Recargar opciones si es necesario
            cargarOpcionesFormulario();
        }
    });
}