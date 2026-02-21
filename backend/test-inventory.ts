async function testInventory() {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@barberia.com', password: 'password123' }),
    });
    const { token } = await loginRes.json();
    const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

    console.log('--- 2. Crear un Producto (Pomada) ---');
    const createRes = await fetch('http://localhost:3001/api/productos', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
            nombre: 'Pomada Suavecito Firme',
            descripcion: 'Fijación fuerte y brillo medio.',
            precioVenta: 18.50,
            stockActual: 10,
            stockMinimo: 3
        })
    });
    const nuevoProducto = await createRes.json();
    console.log('Producto Creado:', nuevoProducto);

    if (!nuevoProducto.id) return console.log('Error creating product');

    console.log('--- 3. Obtener Método de Pago ---');
    const metodosRes = await fetch('http://localhost:3001/api/pos/metodos', { headers: authHeader });
    const metodos = await metodosRes.json();
    const metodoId = metodos[0]?.id;

    if (!metodoId) return console.log('Sin método de pago, no se puede vender.');

    console.log('--- 4. Vender 2 unidades de Pomada ---');
    const ventaRes = await fetch(`http://localhost:3001/api/productos/${nuevoProducto.id}/vender`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ cantidad: 2, metodoPagoId: metodoId })
    });
    const ventaResult = await ventaRes.json();
    console.log('Venta:', ventaResult);

    console.log('--- 5. Ver Stock Actualizado (Debe ser 8) ---');
    const listRes = await fetch('http://localhost:3001/api/productos', { headers: authHeader });
    const list = await listRes.json();
    const prod = list.find((p: any) => p.id === nuevoProducto.id);
    console.log(`Stock Actual de ${prod.nombre}:`, prod.stockActual);
}

testInventory();
