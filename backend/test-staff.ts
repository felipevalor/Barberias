async function testStaff() {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@barberia.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('--- 2. Create Barbero ---');
    const createRes = await fetch('http://localhost:3001/api/staff', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
            nombre: 'Barbero de Prueba',
            email: 'barbero@barberia.com',
            telefono: '1122334455',
            especialidad: 'Corte Clásico',
        }),
    });
    const barbero = await createRes.json();
    console.log('Created Barbero:', barbero);

    if (!barbero.profile) return;
    const profileId = barbero.profile.id;

    console.log('\n--- 3. Set Horarios ---');
    const horarios = [
        {
            diaSemana: 1, // Lunes
            horaInicio: '09:00',
            horaFin: '18:00',
            descansos: [{ horaInicio: '13:00', horaFin: '14:00' }]
        }
    ];

    const horariosRes = await fetch(`http://localhost:3001/api/staff/${profileId}/horarios`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ horarios }),
    });
    console.log('Horarios Set:', await horariosRes.json());
}

testStaff();
