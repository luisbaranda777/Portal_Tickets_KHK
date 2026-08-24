import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://pbqeepnxthppgpdpbzwu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JZmwSp6d8vF0WV-hChz9EQ_KQozWIt5';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cargarTickets() {
    const tbody = document.getElementById('tablaTickets');
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
        // Formatear la fecha
        const fechaFormateada = new Date(ticket.created_at).toLocaleString();

        // Estilos según urgencia
        let badgeUrgencia = '';
        if (ticket.urgencia?.includes('Alto')) {
            badgeUrgencia = `<span class="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">🔴 Alto</span>`;
        } else if (ticket.urgencia?.includes('Medio')) {
            badgeUrgencia = `<span class="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">🟡 Medio</span>`;
        } else {
            badgeUrgencia = `<span class="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold">🟢 Bajo</span>`;
        }

        const fila = `
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
        tbody.innerHTML += fila;
    });
}

// Cargar al abrir la página
cargarTickets();

// Botón de actualizar
document.getElementById('btnActualizar').addEventListener('click', cargarTickets);