async function testAuth() {
    console.log('--- Testing Register ---');
    const registerRes = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: 'Test Admin',
            email: 'test@barberia.com',
            password: 'password123',
            nombreBarberia: 'Barberia Test',
        }),
    });
    const registerData = await registerRes.json();
    console.log('Register Response:', registerRes.status, registerData);

    console.log('\n--- Testing Login ---');
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'test@barberia.com',
            password: 'password123',
        }),
    });
    const loginData = await loginRes.json();
    console.log('Login Response:', loginRes.status, loginData);
}

testAuth();
