import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendCredentials(email: string, username: string, tempPassword: string) {
    const mailOptions = {
      from: '"ZKP Identity System" <noreply@zkp-identity.local>',
      to: email,
      subject: 'Your Account Credentials - ZKP Identity System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6366f1;">Welcome to ZKP Identity System</h2>
          <p>Your account has been created. Please use the following credentials to log in:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #ef4444;"><strong>Important:</strong> You will be required to change your password on first login.</p>
          <p>After login, you will need to:</p>
          <ol>
            <li>Change your password</li>
            <li>Register your face for biometric verification</li>
            <li>Connect your MetaMask wallet</li>
            <li>Complete ZKP identity registration</li>
          </ol>
          <hr style="border: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">This is an automated message. Do not reply.</p>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${email}: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`📧 Email failed to ${email}:`, error.message);
      // Don't throw - email failure shouldn't block user creation
      console.log(`📧 Credentials for ${username}: password=${tempPassword}`);
      return null;
    }
  }
}
