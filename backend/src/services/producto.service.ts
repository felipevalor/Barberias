import { prisma } from '../config/db';

export class ProductoService {
    async getProductos(barberiaId: string, search?: string) {
        const where: any = { barberiaId, activo: true };
        if (search) {
            where.nombre = { contains: search };
        }
        return prisma.producto.findMany({
            where,
            orderBy: { nombre: 'asc' }
        });
    }

    async createProducto(barberiaId: string, data: any) {
        return prisma.producto.create({
            data: {
                ...data,
                barberiaId
            }
        });
    }

    async updateProducto(id: string, barberiaId: string, data: any) {
        const producto = await prisma.producto.findFirst({ where: { id, barberiaId } });
        if (!producto) throw new Error('Producto no encontrado');

        return prisma.producto.update({
            where: { id },
            data
        });
    }

    async deleteProducto(id: string, barberiaId: string) {
        const producto = await prisma.producto.findFirst({ where: { id, barberiaId } });
        if (!producto) throw new Error('Producto no encontrado');

        return prisma.producto.update({
            where: { id },
            data: { activo: false } // Baja lógica
        });
    }

    // RF-27: Descuento Automático de Stock
    async venderProducto(barberiaId: string, productoId: string, cantidad: number, metodoPagoId: string) {
        return prisma.$transaction(async (tx) => {
            const producto = await tx.producto.findFirst({ where: { id: productoId, barberiaId } });

            if (!producto) throw new Error('Producto no encontrado');
            if (producto.stockActual < cantidad) throw new Error(`Stock insuficiente. Solo quedan ${producto.stockActual} unidades.`);

            // Descontar stock
            const updatedProducto = await tx.producto.update({
                where: { id: productoId },
                data: { stockActual: producto.stockActual - cantidad }
            });

            // Crear transacción de ingreso en caja (POS)
            const transaccion = await tx.transaccion.create({
                data: {
                    barberiaId,
                    monto: producto.precioVenta * cantidad,
                    tipo: 'INGRESO',
                    metodoPagoId,
                    descripcion: `Venta Directa: ${cantidad}x ${producto.nombre}`
                }
            });

            return { producto: updatedProducto, transaccion };
        });
    }
}

export const productoService = new ProductoService();
