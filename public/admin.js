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

    document.getElementById('nav-dashboard').className = "px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";
    document.getElementById('nav-usuarios').className = "px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";
    document.getElementById('nav-configuracion').className = "px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer";

    document.getElementById(`seccion-${seccion}`).classList.remove('hidden');
    document.getElementById(`nav-${seccion}`).className = "px-4 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 shadow-sm transition cursor-pointer";

    if (seccion === 'usuarios') cargarUsuarios();
    if (seccion === 'configuracion') cargarConfiguracion();
}

// Cargar listado de tickets en el Dashboard
async function cargarTickets() {
    const tbody = document.getElementById('tablaTickets');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">Cargando tickets...</td></tr>`;

    const { data: tickets, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar tickets:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-red-500">Error al cargar los datos de Supabase.</td></tr>`;
        return;
    }

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-slate-400">No hay tickets registrados todavía.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    tickets.forEach(ticket => {
        const fechaFormateada = new Date(ticket.created_at).toLocaleString();

        let badgeUrgencia = '';
        if (ticket.urgencia?.includes('Alto')) {
            badgeUrgencia = `<span class="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">🔴 Alto</span>`;
        } else if (ticket.urgencia?.includes('Medio')) {
            badgeUrgencia = `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">🟡 Medio</span>`;
        } else {
            badgeUrgencia = `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">🟢 Bajo</span>`;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/60 transition">
                <td class="p-4 font-mono text-xs text-slate-500">#${ticket.id}<br>${fechaFormateada}</td>
                <td class="p-4 font-semibold text-slate-900">${ticket.sucursal}</td>
                <td class="p-4">${ticket.solicitante}<br><span class="text-xs text-slate-400">${ticket.correo}</span></td>
                <td class="p-4 text-xs font-medium">${ticket.categoria}</td>
                <td class="p-4">${badgeUrgencia}</td>
                <td class="p-4 max-w-xs truncate" title="${ticket.descripcion}">${ticket.descripcion}</td>
                <td class="p-4">
                    <span class="bg-sky-100 text-sky-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        ${ticket.estado || 'Abierto'}
                    </span>
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
        tbody.innerHTML = `<tr><td colspan="3" class="p-6 text-center text-slate-400">Sin usuarios registrados.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    unicos.forEach(u => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-100/60 transition">
                <td class="p-4 font-semibold text-slate-900">${u.nombre}</td>
                <td class="p-4 text-slate-600 font-mono text-xs">${u.correo}</td>
                <td class="p-4 font-mono"><span class="bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-full font-bold">${u.total} ticket(s)</span></td>
            </tr>
        `;
    });
}

// Cargar las configuraciones dinámicas (Sucursales, Categorías y Departamentos)
async function cargarConfiguracion() {
    // 1. Sucursales
    const ulSuc = document.getElementById('listaSucursales');
    if (ulSuc) {
        const { data: sucs, error: errSuc } = await supabase.from('config_sucursales').select('*').order('id');
        if (errSuc || !sucs || sucs.length === 0) {
            ulSuc.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin sucursales</li>';
        } else {
            ulSuc.innerHTML = sucs.map(s => `
                <li class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">🏢 ${s.nombre}</span>
                    <button onclick="eliminarConfig('config_sucursales', ${s.id})" class="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }

    // 2. Categorías
    const ulCat = document.getElementById('listaCategorias');
    if (ulCat) {
        const { data: cats, error: errCat } = await supabase.from('config_categorias').select('*').order('id');
        if (errCat || !cats || cats.length === 0) {
            ulCat.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin categorías</li>';
        } else {
            ulCat.innerHTML = cats.map(c => `
                <li class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">🏷️ ${c.nombre}</span>
                    <button onclick="eliminarConfig('config_categorias', ${c.id})" class="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }

    // 3. Departamentos
    const ulDep = document.getElementById('listaDepartamentos');
    if (ulDep) {
        const { data: deps, error: errDep } = await supabase.from('config_departamentos').select('*').order('id');
        if (errDep || !deps || deps.length === 0) {
            ulDep.innerHTML = '<li class="text-slate-400 text-center py-2 bg-white rounded-xl border border-slate-200">Sin departamentos</li>';
        } else {
            ulDep.innerHTML = deps.map(d => `
                <li class="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-xs">
                    <span class="font-medium text-slate-800">📂 ${d.nombre}</span>
                    <button onclick="eliminarConfig('config_departamentos', ${d.id})" class="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer">Eliminar</button>
                </li>
            `).join('');
        }
    }
}

// Event Listeners para formularios de inserción
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

// Función global para eliminar elementos de configuración
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

// Inicialización de la vista
cargarTickets();
cargarConfiguracion();

const btnActualizar = document.getElementById('btnActualizar');
if (btnActualizar) {
    btnActualizar.addEventListener('click', cargarTickets);
}