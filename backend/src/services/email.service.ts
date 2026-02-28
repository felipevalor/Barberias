import nodemailer from 'nodemailer';

// Offset de zona horaria para formatear fechas en los emails
const TZ_OFFSET_HOURS = parseInt(process.env.TIMEZONE_OFFSET || '-3', 10);

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isInitialized = false;

    constructor() {
        this.init();
    }

    private async init() {
        try {
            const hasSmtpConfig = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

            if (hasSmtpConfig) {
                // Producción: usar SMTP configurado desde .env
                this.transporter = nodemailer.createTransport({
                    host: process.env.EMAIL_HOST,
                    port: parseInt(process.env.EMAIL_PORT || '587', 10),
                    secure: process.env.EMAIL_PORT === '465',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                this.isInitialized = true;
                console.log(`📧 Email Service Initialized (SMTP: ${process.env.EMAIL_HOST})`);
            } else {
                // Desarrollo: usar Ethereal para testing
                const testAccount = await nodemailer.createTestAccount();

                this.transporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });

                this.isInitialized = true;
                console.log('📧 Email Service Initialized (Ethereal Testing)');
            }
        } catch (error) {
            console.error('Error initializing Email Service:', error);
        }
    }

    /**
     * Formatea una fecha UTC a string legible en hora local.
     */
    private formatLocalDate(utcDate: Date): string {
        const localMs = utcDate.getTime() + TZ_OFFSET_HOURS * 60 * 60 * 1000;
        const local = new Date(localMs);
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dia = dias[local.getUTCDay()];
        const fecha = local.getUTCDate();
        const mes = meses[local.getUTCMonth()];
        const anio = local.getUTCFullYear();
        const hora = String(local.getUTCHours()).padStart(2, '0');
        const minuto = String(local.getUTCMinutes()).padStart(2, '0');
        return `${dia} ${fecha} de ${mes} ${anio}, ${hora}:${minuto} hs`;
    }

    async sendTurnoConfirmation(
        clienteEmail: string,
        clienteNombre: string,
        fechaHora: Date,
        servicioNombre: string,
        barberoNombre: string
    ) {
        if (!this.isInitialized || !this.transporter) {
            console.log('Skipping email send: Service not initialized');
            return;
        }

        const fromAddress = process.env.EMAIL_FROM || '"Tu Barbería" <no-reply@barberia.com>';
        const fechaFormateada = this.formatLocalDate(fechaHora);

        try {
            const info = await this.transporter.sendMail({
                from: fromAddress,
                to: clienteEmail,
                subject: 'Confirmación de Turno ✔',
                text: `Hola ${clienteNombre}, tu turno para ${servicioNombre} con ${barberoNombre} ha sido confirmado para el ${fechaFormateada}.`,
                html: `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #fafafa; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="margin: 0; font-size: 22px; color: #111;">¡Turno Confirmado! ✂️</h2>
            </div>
            <p style="font-size: 15px; color: #333; margin: 0 0 20px;">
              Hola <strong>${clienteNombre}</strong>, tu reserva ha sido agendada exitosamente.
            </p>
            <div style="background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <table style="width: 100%; font-size: 14px; color: #444; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #888; width: 120px;">Servicio</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #111;">${servicioNombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #888;">Barbero</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #111;">${barberoNombre}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; color: #888;">Fecha y Hora</td>
                  <td style="padding: 8px 0; font-weight: 700; color: #111;">${fechaFormateada}</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
              ¡Te esperamos! 🙌
            </p>
          </div>
        `,
            });

            console.log('Mensaje enviado: %s', info.messageId);
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log('Previsualizar en URL: %s', previewUrl);
            }

            return previewUrl || info.messageId;
        } catch (error) {
            // El fallo en el envío de email NO debe afectar al turno guardado
            console.error('Error sending confirmation email:', error);
        }
    }
}

export const emailService = new EmailService();
