import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://pbqeepnxthppgpdpbzwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JZmwSp6d8vF0WV-hChz9EQ_KQozWIt5';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar autenticación al cargar
if (sessionStorage.getItem('auth_ti') !== 'true') {
    window.location.href = 'login.html';
}

// Botón de cerrar sesión
document.getElementById('btnCerrarSesion').addEventListener('click', function() {
    sessionStorage.removeItem('auth_ti');
    window.location.href = 'login.html';
});

// Control de navegación entre secciones del panel
window.cambiarSeccion = function(seccion) {
    document.getElementById('seccion-dashboard').classList.add('hidden');
    document.getElementById('seccion-usuarios').classList.add('hidden');
    document.getElementById('seccion-configuracion').classList.add('hidden');

    document.getElementById('nav-dashboard').className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";
    document.getElementById('nav-usuarios').className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";
    document.getElementById('nav-configuracion').className = "px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";

    document.getElementById(`seccion-${seccion}`).classList.remove('hidden');
    document.getElementById(`nav-${seccion}`).className = "px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow-sm transition cursor-pointer";

    if (seccion === 'usuarios') cargarUsuarios();
    if (seccion === 'configuracion') cargarConfiguracion();
}

// Función global para actualizar el estado, categoría y urgencia de un ticket desde el panel
window.actualizarTicket = async function(id) {
    const estadoSelect = document.getElementById(`estado-${id}`);
    const categoriaSelect = document.getElementById(`categoria-${id}`);
    const urgenciaSelect = document.getElementById(`urgencia-${id}`);

    const nuevoEstado = estadoSelect.value;
    const nuevaCategoria = categoriaSelect.value;
    const nuevaUrgencia = urgenciaSelect.value;

    const { data: ticketsActualizados, error } = await supabase
        .from('tickets')
        .update({ 
            estado: nuevoEstado, 
            categoria: nuevaCategoria, 
            urgencia: nuevaUrgencia 
        })
        .eq('id', id)
        .select();

    if (error) {
        console.error('Error al actualizar el ticket:', error);
        alert('Hubo un error al actualizar los datos: ' + error.message);
        return;
    }

    const t = ticketsActualizados && ticketsActualizados.length > 0 ? ticketsActualizados[0] : null;

    if (t && t.correo) {
        try {
            await emailjs.send('service_lgevwzi', 'template_bracaxp', {
                to_name: t.solicitante,
                to_email: t.correo,
                folio: t.id,
                sucursal: t.sucursal,
                estado: t.estado,
                respuesta: `Tu ticket ha sido actualizado. Nuevo estado: ${t.estado}, Urgencia: ${t.urgencia}, Categoría: ${t.categoria}`
            });
            alert("¡Ticket actualizado y notificación enviada por correo al usuario!");
        } catch (mailError) {
            console.error("Error al enviar el correo de respuesta:", mailError);
            alert("¡Ticket actualizado correctamente en Supabase, pero falló el envío del correo!");
        }
    } else {
        alert("¡Ticket actualizado correctamente!");
    }

    cargarTickets();
}

// Función para alternar el acordeón de descripción en la tabla
window.toggleAcordeon = function(id) {
    const filaAcordeon = document.getElementById(`acordeon-${id}`);
    const flecha = document.getElementById(`flecha-${id}`);
    if (filaAcordeon.classList.contains('hidden')) {
        filaAcordeon.classList.remove('hidden');
        flecha.style.transform = 'rotate(180deg)';
    } else {
        filaAcordeon.classList.add('hidden');
        flecha.style.transform = 'rotate(0deg)';
    }
}

// Cargar listado de tickets en el Dashboard con opciones editables y formato compacto
async function cargarTickets() {
    const tbody = document.getElementById('tablaTickets');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">Cargando tickets...</td></tr>`;

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar tickets:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-red-500">Error al cargar los datos de Supabase.</td></tr>`;
        return;
    }

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">No hay tickets registrados todavía.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    tickets.forEach(ticket => {
        const fechaFormateada = new Date(ticket.created_at).toLocaleDateString();

        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/60 transition align-top">
                <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500">#${ticket.id}<br>${fechaFormateada}</td>
                <td class="py-2.5 px-3 font-semibold text-slate-900">${ticket.sucursal}</td>
                <td class="py-2.5 px-3">${ticket.solicitante}<br><span class="text-[11px] text-slate-400">${ticket.correo}</span></td>
                
                <!-- Categoría / Tipo de Problema (Editable) -->
                <td class="py-2.5 px-3">
                    <input type="text" id="categoria-${ticket.id}" value="${ticket.categoria || ''}" class="border border-slate-300 rounded px-2 py-1 text-xs w-full bg-white">
                </td>

                <!-- Urgencia (Editable) -->
                <td class="py-2.5 px-3">
                    <select id="urgencia-${ticket.id}" class="border border-slate-300 rounded px-2 py-1 text-xs bg-white font-medium">
                        <option value="🟢 Bajo" ${ticket.urgencia?.includes('Bajo') ? 'selected' : ''}>🟢 Bajo</option>
                        <option value="🟡 Medio" ${ticket.urgencia?.includes('Medio') ? 'selected' : ''}>🟡 Medio</option>
                        <option value="🔴 Alto" ${ticket.urgencia?.includes('Alto') ? 'selected' : ''}>🔴 Alto</option>
                    </select>
                </td>

                <!-- Descripción con Acordeón -->
                <td class="py-2.5 px-3">
                    <button onclick="toggleAcordeon(${ticket.id})" class="text-indigo-600 hover:text-indigo-900 font-medium underline flex items-center gap-1 cursor-pointer">
                        <span>Ver descripción</span>
                        <span id="flecha-${ticket.id}" class="transition-transform duration-200">▼</span>
                    </button>
                </td>
                
                <!-- Estado (Editable) + Botón de Guardar -->
                <td class="py-2.5 px-3 space-y-1.5">
                    <select id="estado-${ticket.id}" class="border border-slate-300 rounded px-2 py-1 text-xs bg-white font-semibold text-sky-800">
                        <option value="Abierto" ${ticket.estado === 'Abierto' ? 'selected' : ''}>Abierto</option>
                        <option value="En Proceso" ${ticket.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                        <option value="Cerrado" ${ticket.estado === 'Cerrado' ? 'selected' : ''}>Cerrado</option>
                    </select>
                    <br>
                    <button onclick="actualizarTicket(${ticket.id})" class="bg-slate-900 text-white px-2.5 py-1 rounded text-xs font-semibold hover:bg-slate-800 transition cursor-pointer">
                        Guardar
                    </button>
                </td>
            </tr>
            <!-- Fila Acordeón Oculta -->
            <tr id="acordeon-${ticket.id}" class="hidden bg-slate-100/50 border-t border-slate-100">
                <td colspan="7" class="p-3">
                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-1">
                        <span class="font-bold text-slate-900">Descripción detallada de la incidencia:</span>
                        <p class="whitespace-pre-wrap leading-relaxed">${ticket.descripcion}</p>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Cargar reporte de usuarios únicos
async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;
    
    const { data: tickets } = await supabase.from('tickets').select('solicitante, correo');
    const mapa = {};
    
    tickets?.forEach(t => {
        let k = t.correo?.toLowerCase() || 'desc';
        if (!mapa[k]) mapa[k] = { nombre: t.solicitante, correo: t.correo, total: 0 };
        mapa[k].total++;
    });
    
    const unicos = Object.values(mapa);
    if (!unicos.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400">Sin usuarios registrados.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    unicos.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/60 transition">
                <td class="py-2.5 px-3 font-semibold text-slate-900">${u.nombre}</td>
                <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px]">${u.correo}</td>
                <td class="py-2.5 px-3 font-mono"><span class="bg-slate-200 text-slate-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">${u.total} ticket(s)</span></td>
            </tr>
        `;
    });
}

// Cargar configuraciones dinámicas
async function cargarConfiguracion() {
    const ulSuc = document.getElementById('listaSucursales');
    if (ulSuc) {
        const { data: sucs, error: errSuc } = await supabase.from('config_sucursales').select('*').order('id');
        if (errSuc || !sucs || sucs.length === 0) {
            ulSuc.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin sucursales</li>';
        } else {
            ulSuc.innerHTML = sucs.map(s => `
                <li class="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">🏢 ${s.nombre}</span>
                    <button onclick="eliminarConfig('config_sucursales', ${s.id})" class="text-[11px] text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }

    const ulCat = document.getElementById('listaCategorias');
    if (ulCat) {
        const { data: cats, error: errCat } = await supabase.from('config_categorias').select('*').order('id');
        if (errCat || !cats || cats.length === 0) {
            ulCat.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin categorías</li>';
        } else {
            ulCat.innerHTML = cats.map(c => `
                <li class="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">🏷️ ${c.nombre}</span>
                    <button onclick="eliminarConfig('config_categorias', ${c.id})" class="text-[11px] text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }

    const ulDep = document.getElementById('listaDepartamentos');
    if (ulDep) {
        const { data: deps, error: errDep } = await supabase.from('config_departamentos').select('*').order('id');
        if (errDep || !deps || deps.length === 0) {
            ulDep.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin departamentos</li>';
        } else {
            ulDep.innerHTML = deps.map(d => `
                <li class="bg-white p-2.5 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">📂 ${d.nombre}</span>
                    <button onclick="eliminarConfig('config_departamentos', ${d.id})" class="text-[11px] text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }
}

const formSucursal = document.getElementById('formSucursal');
if (formSucursal) {
    formSucursal.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nuevaSucursal');
        const nombre = input.value.trim();
        if (!nombre) return;
        const { error } = await supabase.from('config_sucursales').insert([{ nombre }]);
        if (!error) { input.value = ''; cargarConfiguracion(); } else { alert('Error: ' + error.message); }
    });
}

const formCategoria = document.getElementById('formCategoria');
if (formCategoria) {
    formCategoria.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nuevaCategoria');
        const nombre = input.value.trim();
        if (!nombre) return;
        const { error } = await supabase.from('config_categorias').insert([{ nombre }]);
        if (!error) { input.value = ''; cargarConfiguracion(); } else { alert('Error: ' + error.message); }
    });
}

const formDepartamento = document.getElementById('formDepartamento');
if (formDepartamento) {
    formDepartamento.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('nuevoDepartamento');
        const nombre = input.value.trim();
        if (!nombre) return;
        const { error } = await supabase.from('config_departamentos').insert([{ nombre }]);
        if (!error) { input.value = ''; cargarConfiguracion(); } else { alert('Error: ' + error.message); }
    });
}

window.eliminarConfig = async function(tabla, id) {
    if (confirm("¿Estás seguro de eliminar este elemento?")) {
        const { error } = await supabase.from(tabla).delete().eq('id', id);
        if (!error) {
            cargarConfiguracion();
        } else {
            alert('Error al eliminar el elemento');
        }
    }
}

cargarTickets();
cargarConfiguracion();

const btnActualizar = document.getElementById('btnActualizar');
if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarTickets);
}