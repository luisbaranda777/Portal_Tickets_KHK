// Script principal para el Portal de Tickets TI - KHK

document.getElementById('ticketForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita que la página se recargue

    // Capturar los valores del formulario
    const sucursal = document.getElementById('sucursal').value;
    const solicitante = document.getElementById('solicitante').value;
    const categoria = document.getElementById('categoria').value;
    const descripcion = document.getElementById('descripcion').value;

    // Objeto simulado del ticket (Aquí es donde después conectaremos Supabase)
    const nuevoTicket = {
        sucursal,
        solicitante,
        categoria,
        descripcion,
        fecha: new Date().toLocaleString(),
        estado: 'Abierto'
    };

    console.log("Ticket generado:", nuevoTicket);

    // Mostrar una alerta visual moderna de éxito
    alert(`¡Ticket creado con éxito!\n\nSucursal: ${sucursal}\nSolicitante: ${solicitante}\nCategoría: ${categoria}`);

    // Limpiar el formulario
    document.getElementById('ticketForm').reset();
});