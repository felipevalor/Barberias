import dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import staffRoutes from './routes/staff.routes';
import servicioRoutes from './routes/servicio.routes';
import turnoRoutes from './routes/turno.routes';
import clienteRoutes from './routes/cliente.routes';
import posRoutes from './routes/pos.routes';
import productoRoutes from './routes/producto.routes';
import reporteRoutes from './routes/reporte.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pos', posRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (req: Request, res: Response) => {
    res.send('Server is healthy');
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`[server]: Server is running at http://localhost:${port}`);
    });
}

export default app;
