import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://pbqeepnxthppgpdpbzwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JZmwSp6d8vF0WV-hChz9EQ_KQozWIt5';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cargar dinámicamente las sucursales y categorías al abrir el formulario
async function cargarOpcionesFormulario() {
    const selectSucursal = document.getElementById('sucursal');
    const selectCategoria = document.getElementById('categoria');

    if (selectSucursal) {
        const { data: sucs } = await supabase.from('config_sucursales').select('*').order('id');
        if (sucs) {
            selectSucursal.innerHTML = '<option value="">Selecciona una sucursal...</option>' + 
                sucs.map(s => `<option value="${s.nombre}">${s.nombre}</option>`).join('');
        }
    }

    if (selectCategoria) {
        const { data: cats } = await supabase.from('config_categorias').select('*').order('id');
        if (cats) {
            selectCategoria.innerHTML = '<option value="">Selecciona una categoría...</option>' + 
                cats.map(c => `<option value="${c.nombre}">${c.nombre}</option>`).join('');
        }
    }
}

cargarOpcionesFormulario();

// Manejo del envío del ticket
document.getElementById('ticketForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const sucursal = document.getElementById('sucursal').value;
    const solicitante = document.getElementById('solicitante').value;
    const correo = document.getElementById('correo').value;
    const categoria = document.getElementById('categoria').value;
    const urgencia = document.getElementById('urgencia').value;
    const descripcion = document.getElementById('descripcion').value;
    const archivoInput = document.getElementById('adjunto');
    const archivoNombre = archivoInput.files.length > 0 ? archivoInput.files[0].name : "Ninguno";

    const { error } = await supabase
        .from('tickets')
        .insert([{ sucursal, solicitante, correo, categoria, urgencia, descripcion, archivo: archivoNombre, estado: 'Abierto' }]);

    if (error) {
        console.error('Error al guardar el ticket:', error);
        alert('Hubo un error al crear el ticket.');
    } else {
        alert(`¡Ticket creado con éxito y guardado en la base de datos!\n\nSucursal: ${sucursal}\nSolicitante: ${solicitante}`);
        document.getElementById('ticketForm').reset();
    }
});