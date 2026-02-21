async function testServicio() {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@barberia.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('--- 2. Obtener Barberos de prueba ---');
    const staffRes = await fetch('http://localhost:3001/api/staff', { headers: authHeader });
    const barberos = await staffRes.json();
    const barberoIds = barberos.map((b: any) => b.BarberoProfile?.id).filter(Boolean);

    console.log('--- 3. Crear Servicio ---');
    const createRes = await fetch('http://localhost:3001/api/servicios', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
            nombre: 'Corte Premium',
            descripcion: 'Corte + Lavado + Productos',
            precio: 15.0,
            duracionMinutos: 45,
            barberoIds: barberoIds // Asignar a todos los barberos encontrados
        }),
    });
    const servicio = await createRes.json();
    console.log('Created Servicio:', servicio);

    console.log('\n--- 4. Listar Servicios ---');
    const listRes = await fetch('http://localhost:3001/api/servicios', { headers: authHeader });
    console.log('Lista de Servicios:', await listRes.json());
}

testServicio();
