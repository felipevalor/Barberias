import nodemailer from 'nodemailer';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isInitialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            // Usar Ethereal para testing (Genera correos de prueba visibles en URL)
            const testAccount = await nodemailer.createTestAccount();

            this.transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });

            this.isInitialized = true;
            console.log('📧 Email Service Initialized (Ethereal Testing)');
        } catch (error) {
            console.error('Error initializing Email Service:', error);
        }
    }

    async sendTurnoConfirmation(clienteEmail: string, clienteNombre: string, fechaHora: Date, servicioNombre: string) {
        if (!this.isInitialized || !this.transporter) {
            console.log('Skipping email send: Service not initialized');
            return;
        }

        try {
            const info = await this.transporter.sendMail({
                from: '"Tu Barbería" <no-reply@barberia.com>',
                to: clienteEmail,
                subject: "Confirmación de Turno ✔",
                text: `Hola ${clienteNombre}, tu turno para ${servicioNombre} ha sido confirmado para el día ${fechaHora.toLocaleString()}.`,
                html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>¡Turno Confirmado! 🎉</h2>
            <p>Hola <strong>${clienteNombre}</strong>,</p>
            <p>Tu turno ha agendado exitosamente.</p>
            <ul>
              <li><strong>Servicio:</strong> ${servicioNombre}</li>
              <li><strong>Fecha y Hora:</strong> ${fechaHora.toLocaleString()}</li>
            </ul>
            <p>¡Te esperamos!</p>
          </div>
        `,
            });

            console.log("Mensaje enviado: %s", info.messageId);
            // Nodemailer URL para previsualizar correos de prueba
            console.log("Previsualizar en URL: %s", nodemailer.getTestMessageUrl(info));

            return nodemailer.getTestMessageUrl(info);
        } catch (error) {
            console.error('Error sending confirmation email:', error);
        }
    }
}

export const emailService = new EmailService();
