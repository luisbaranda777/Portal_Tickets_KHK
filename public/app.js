document.getElementById('ticketForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const sucursal = document.getElementById('sucursal').value;
    const solicitante = document.getElementById('solicitante').value;
    const correo = document.getElementById('correo').value;
    const categoria = document.getElementById('categoria').value;
    const urgencia = document.getElementById('urgencia').value;
    const descripcion = document.getElementById('descripcion').value;
    const archivoInput = document.getElementById('adjunto');
    const archivoNombre = archivoInput.files.length > 0 ? archivoInput.files[0].name : "Ninguno";

    const nuevoTicket = {
        sucursal,
        solicitante,
        correo,
        categoria,
        urgencia,
        descripcion,
        archivo: archivoNombre,
        fecha: new Date().toLocaleString(),
        estado: 'Abierto'
    };

    console.log("Ticket generado:", nuevoTicket);

    alert(`¡Ticket creado con éxito!\n\nSucursal: ${sucursal}\nSolicitante: ${solicitante}\nUrgencia: ${urgencia}\nArchivo: ${archivoNombre}`);

    document.getElementById('ticketForm').reset();
});
