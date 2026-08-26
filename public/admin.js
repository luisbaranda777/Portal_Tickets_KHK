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

let ticketActualCompleto = null;

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

// Abrir modal flotante para contestar ticket por correo
window.abrirModalResponder = function(ticketEncoded) {
    ticketActualCompleto = JSON.parse(decodeURIComponent(ticketEncoded));

    document.getElementById('modalTicketId').innerText = `#${ticketActualCompleto.id}`;
    document.getElementById('modalSolicitante').innerText = ticketActualCompleto.solicitante;
    document.getElementById('modalCorreo').innerText = ticketActualCompleto.correo;
    document.getElementById('modalMensaje').value = '';
    document.getElementById('modalArchivo').value = '';

    document.getElementById('modalResponder').classList.remove('hidden');
}

window.cerrarModalResponder = function() {
    document.getElementById('modalResponder').classList.add('hidden');
}

// Enviar respuesta vía EmailJS
window.enviarRespuestaEmail = async function() {
    const mensaje = document.getElementById('modalMensaje').value.trim();
    const archivoInput = document.getElementById('modalArchivo');
    const btnEnviar = document.getElementById('btnEnviarRespuesta');

    if (!mensaje) {
        alert('Por favor escribe un mensaje de respuesta.');
        return;
    }

    if (!ticketActualCompleto) {
        alert('No se ha seleccionado ningún ticket.');
        return;
    }

    btnEnviar.disabled = true;
    btnEnviar.innerText = 'Enviando...';

    let archivoBase64 = '';
    if (archivoInput.files.length > 0) {
        const archivo = archivoInput.files[0];
        archivoBase64 = await toBase64(archivo);
    }

    const templateParams = {
        email: ticketActualCompleto.correo,
        to_name: ticketActualCompleto.solicitante,
        folio: ticketActualCompleto.id,
        sucursal: ticketActualCompleto.sucursal,
        estado: 'Resuelto',
        respuesta: mensaje,
        attachment: archivoBase64
    };

    emailjs.send('service_lgevwzi', 'template_bracaxp', templateParams)
        .then(async function(response) {
            alert('¡Respuesta y correo enviados con éxito!');
            await supabase.from('tickets').update({ estado: 'Resuelto' }).eq('id', ticketActualCompleto.id);
            cerrarModalResponder();
            cargarTickets();
        }, function(error) {
            alert('Error al enviar el correo: ' + JSON.stringify(error));
        })
        .finally(() => {
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<span>📤 Enviar Respuesta</span>';
        });
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Cambiar estado desde el select directo en la tabla
window.cambiarEstadoSelect = async function(id, selectElement) {
    const nuevoEstado = selectElement.value;
    const { error } = await supabase.from('tickets').update({ estado: nuevoEstado }).eq('id', id);
    if (!error) {
        cargarTickets();
    } else {
        alert('Error al actualizar el estado: ' + error.message);
    }
}

// Eliminar ticket
window.eliminarTicket = async function(id) {
    if(confirm("¿Estás seguro de eliminar este ticket?")) {
        const { error } = await supabase.from('tickets').delete().eq('id', id);
        if (!error) {
            cargarTickets();
        } else {
            alert('Error al eliminar el ticket');
        }
    }
}

// Cargar listado de tickets en el Dashboard
async function cargarTickets() {
    const tbody = document.getElementById('tablaTickets');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400">Cargando tickets...</td></tr>`;

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-slate-400">No hay tickets registrados.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    tickets.forEach(t => {
        let badge = t.urgencia?.includes('Alto') ? `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">🔴 Alto</span>` : t.urgencia?.includes('Medio') ? `<span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">🟡 Medio</span>` : `<span class="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[11px] font-semibold">🟢 Bajo</span>`;
       
        let estadoSelect = `
            <select onchange="cambiarEstadoSelect(${t.id}, this)" class="text-xs font-semibold px-2 py-1 rounded-full border outline-none cursor-pointer transition ${
                t.estado === 'Resuelto' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : t.estado === 'En Proceso'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-sky-100 text-sky-800 border-sky-300'
            }">
                <option value="Abierto" ${t.estado === 'Abierto' ? 'selected' : ''}>Abierto</option>
                <option value="En Proceso" ${t.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
                <option value="Resuelto" ${t.estado === 'Resuelto' ? 'selected' : ''}>Resuelto</option>
            </select>
        `;

        const ticketJson = encodeURIComponent(JSON.stringify(t));

        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/60 transition">
                <td class="py-2.5 px-3 font-mono text-[11px] text-slate-500">#${t.id}<br>${new Date(t.created_at).toLocaleDateString()}</td>
                <td class="py-2.5 px-3 font-semibold text-slate-900">${t.sucursal}</td>
                <td class="py-2.5 px-3">${t.solicitante}<br><span class="text-[11px] text-slate-400">${t.correo}</span></td>
                <td class="py-2.5 px-3 font-medium">${t.categoria}</td>
                <td class="py-2.5 px-3">${badge}</td>
                <td class="py-2.5 px-3">
                    <button onclick="toggleAcordeon(${t.id})" class="text-indigo-600 hover:text-indigo-900 font-medium underline flex items-center gap-1 cursor-pointer">
                        <span>Ver descripción</span>
                        <span id="flecha-${t.id}" class="transition-transform duration-200">▼</span>
                    </button>
                </td>
                <td class="py-2.5 px-3">${estadoSelect}</td>
                <td class="py-2.5 px-3">
                    <div class="flex items-center gap-1.5">
                        <button onclick="abrirModalResponder('${ticketJson}')" title="Contestar y enviar correo" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-1.5 rounded-xl transition cursor-pointer border border-indigo-200">
                            ✉️
                        </button>
                        <button onclick="eliminarTicket(${t.id})" class="text-red-600 hover:bg-red-50 p-1.5 rounded-xl transition cursor-pointer border border-red-200" title="Eliminar ticket">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
            <tr id="acordeon-${t.id}" class="hidden bg-slate-100/50 border-t border-slate-100">
                <td colspan="8" class="p-3">
                    <div class="bg-white p-3 rounded-xl border border-slate-200 text-slate-700 text-xs space-y-1">
                        <span class="font-bold text-slate-900">Descripción detallada de la incidencia:</span>
                        <p class="whitespace-pre-wrap leading-relaxed">${t.descripcion}</p>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Cargar reporte de tickets agrupados por Agencia / Sucursal
async function cargarUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;
    
    // Consultamos sucursal, solicitante y correo de los tickets
    const { data: tickets, error } = await supabase.from('tickets').select('sucursal, solicitante, correo');
    
    if (error) {
        console.error('Error al cargar datos para el reporte de agencias:', error);
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500">Error al cargar los datos.</td></tr>`;
        return;
    }

    const mapaSucursales = {};
    
    tickets?.forEach(t => {
        const suc = t.sucursal ? t.sucursal.trim() : 'Sin sucursal';
        if (!mapaSucursales[suc]) {
            mapaSucursales[suc] = {
                totalTickets: 0,
                solicitantesMap: {}
            };
        }
        
        mapaSucursales[suc].totalTickets++;

        const correoKey = t.correo ? t.correo.toLowerCase() : 'sin-correo';
        if (!mapaSucursales[suc].solicitantesMap[correoKey]) {
            mapaSucursales[suc].solicitantesMap[correoKey] = {
                nombre: t.solicitante || 'Anónimo',
                correo: t.correo || '',
                cantidad: 0
            };
        }
        mapaSucursales[suc].solicitantesMap[correoKey].cantidad++;
    });
    
    const sucursalesArray = Object.keys(mapaSucursales).map(suc => ({
        nombreSucursal: suc,
        total: mapaSucursales[suc].totalTickets,
        solicitantes: Object.values(mapaSucursales[suc].solicitantesMap)
    }));

    if (!sucursalesArray.length) {
        tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-400">Sin registros de agencias todavía.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    sucursalesArray.forEach(item => {
        // Generamos la lista de solicitantes para esta sucursal
        const listaSolicitantesHTML = item.solicitantes.map(s => `
            <div class="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 mb-1 last:mb-0">
                <div>
                    <span class="font-semibold text-slate-900">${s.nombre}</span>
                    <span class="text-[11px] text-slate-400 ml-1">(${s.correo})</span>
                </div>
                <span class="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    ${s.cantidad} ticket(s)
                </span>
            </div>
        `).join('');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/40 transition align-top">
                <td class="p-4 font-bold text-slate-900 flex items-center gap-1.5">
                    🏢 ${item.nombreSucursal}
                </td>
                <td class="p-4 font-mono">
                    <span class="bg-slate-900 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                        ${item.total} total
                    </span>
                </td>
                <td class="p-4">
                    <div class="space-y-1 max-w-md">
                        ${listaSolicitantesHTML}
                    </div>
                </td>
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

// Carga inicial
cargarTickets();
cargarConfiguracion();

const btnActualizar = document.getElementById('btnActualizar');
if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarTickets);
}