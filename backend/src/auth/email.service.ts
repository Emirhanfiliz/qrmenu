import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged to console only');
    }
  }

  async sendVerificationEmail(to: string, code: string) {
    const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const appName = process.env.APP_NAME || 'QRMenu';

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#10b981">${appName}</h2>
        <p>Email adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
        <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#111">${code}</span>
        </div>
        <p style="color:#6b7280;font-size:14px">Bu kod 1 saat geçerlidir. Eğer bu isteği siz yapmadıysanız görmezden gelin.</p>
      </div>
    `;

    if (!this.resend) {
      this.logger.log(`[DEV] Verification email to ${to} — code: ${code}`);
      return;
    }

    await this.resend.emails.send({
      from,
      to,
      subject: `${appName} — Email doğrulama kodunuz`,
      html,
    });
  }
}
