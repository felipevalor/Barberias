async function testTurno() {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@barberia.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    // Fetch Barberos
    const staffRes = await fetch('http://localhost:3001/api/staff', { headers: authHeader });
    const barberos = await staffRes.json();
    const barbero = barberos[0];
    const barberoProfileId = barbero?.BarberoProfile?.id;

    // Fetch Servicios
    const servRes = await fetch('http://localhost:3001/api/servicios', { headers: authHeader });
    const servicios = await servRes.json();
    const servicioId = servicios[0]?.id;

    if (!barberoProfileId || !servicioId) return console.log('Necesitas primero barberos y servicios en DB');

    console.log('--- 2. Crear Turno ---');
    // Usamos una fecha ficticia de inicio
    const fechaInicio = new Date();
    fechaInicio.setHours(fechaInicio.getHours() + 1); // Turno en 1 hora

    const turnoData = {
        barberoId: barberoProfileId,
        servicioId,
        nombreCliente: 'Cliente Ficticio',
        telefonoCliente: '555-5555',
        fechaHoraInicio: fechaInicio.toISOString()
    };

    const createRes = await fetch('http://localhost:3001/api/turnos', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(turnoData),
    });
    console.log('Created Turno:', await createRes.json());

    console.log('--- 3. Intentar crear turno solapado ---');
    const overlapRes = await fetch('http://localhost:3001/api/turnos', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify(turnoData),
    });
    console.log('Overlap Result (Debe dar Error 400):', await overlapRes.json());
}

testTurno();
