async function testPOS() {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@barberia.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('--- 2. Crear Método de Pago ---');
    await fetch('http://localhost:3001/api/pos/metodos', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ nombre: 'Efectivo USD' })
    });

    const metodosRes = await fetch('http://localhost:3001/api/pos/metodos', { headers: authHeader });
    const metodos = await metodosRes.json();
    console.log('Métodos Activos:', metodos);
    const metodoId = metodos[0]?.id;

    console.log('--- 3. Obtener un turno pendiente ---');
    const turnosRes = await fetch('http://localhost:3001/api/turnos', { headers: authHeader });
    const turnos = await turnosRes.json();
    const turnoPendiente = turnos.find((t: any) => t.estado === 'PENDIENTE');

    if (!turnoPendiente || !metodoId) {
        return console.log('Se necesita al menos un turno pendiente y un método de pago.');
    }

    console.log('--- 4. Checkout del Turno ---');
    const checkoutRes = await fetch(`http://localhost:3001/api/pos/checkout/${turnoPendiente.id}`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
            metodoPagoId: metodoId,
            montoCobrado: 20, // Simulamos un precio cobrado
            propina: 5
        })
    });
    const result = await checkoutRes.json();
    console.log('Checkout Result (Transaccion):', result);

    console.log('--- 5. Ver Flujo de Caja Hoy ---');
    const flujoRes = await fetch('http://localhost:3001/api/pos/flujo', { headers: authHeader });
    console.log(JSON.stringify(await flujoRes.json(), null, 2));
}

testPOS();
