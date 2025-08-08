import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      // Check if SMTP credentials are configured
      const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

      if (hasSmtpConfig) {
        // Real SMTP configuration
        console.log('📧 Configuring Gmail SMTP with:', {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER,
          from: process.env.SMTP_FROM
        });

        const config: EmailConfig = {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // false for TLS (587), true for SSL (465)
          auth: {
            user: process.env.SMTP_USER!,
            pass: process.env.SMTP_PASS!
          }
        };

        this.transporter = nodemailer.createTransporter(config);
      } else {
        // Mock transporter for development/testing
        console.log('📧 Using mock email transporter (emails will be logged)');
        this.transporter = nodemailer.createTransporter({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
      }
    }

    return this.transporter;
  }

  /**
   * Send email with optional PDF attachment
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

      const mailOptions = {
        from: process.env.SMTP_FROM || 'TempRx360 <noreply@temprx360.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || []
      };

      const result = await transporter.sendMail(mailOptions);

      if (hasSmtpConfig) {
        // Real email sent via Gmail SMTP
        console.log('✅ Email sent successfully via Gmail SMTP:');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Message ID:', result.messageId);
        console.log('   Attachments:', options.attachments?.length || 0);
        return true;
      } else {
        // Mock email (development mode)
        console.log('📧 Mock email (would be sent in production):');
        console.log('   To:', options.to);
        console.log('   Subject:', options.subject);
        console.log('   Attachments:', options.attachments?.length || 0);
        console.log('   HTML Preview:', options.html.substring(0, 200) + '...');
        return true;
      }

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      console.error('   Error details:', error);
      return false;
    }
  }

  /**
   * Send monthly temperature report
   */
  static async sendMonthlyReport(
    userEmail: string,
    pharmacyName: string,
    reportData: any,
    pdfBuffer: Buffer
  ): Promise<boolean> {
    const currentDate = new Date();
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .summary { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; }
          .logo { font-size: 24px; font-weight: bold; }
          .highlight { color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TempRx360</div>
          <p>Monthly Temperature Monitoring Report</p>
        </div>
        
        <div class="content">
          <h2>Dear ${pharmacyName} Team,</h2>
          
          <p>Please find attached your monthly temperature monitoring report for <span class="highlight">${monthName}</span>.</p>
          
          <div class="summary">
            <h3>Report Summary:</h3>
            <ul>
              <li><strong>Reporting Period:</strong> ${monthName}</li>
              <li><strong>Total Readings:</strong> ${reportData.totalReadings || 'N/A'}</li>
              <li><strong>Sensors Monitored:</strong> ${reportData.sensorsCount || 'N/A'}</li>
              <li><strong>Compliance Status:</strong> <span class="highlight">${reportData.complianceStatus || 'Good'}</span></li>
            </ul>
          </div>
          
          <p>This report includes:</p>
          <ul>
            <li>Daily temperature readings at 10:00 AM and 5:00 PM</li>
            <li>Temperature trend analysis</li>
            <li>Alert summary and resolution status</li>
            <li>Compliance verification</li>
          </ul>
          
          <p>If you have any questions about this report or need additional information, please contact our support team.</p>
          
          <p>Best regards,<br>
          <strong>TempRx360 Monitoring Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This is an automated report from TempRx360 Temperature Monitoring System</p>
          <p>© ${currentDate.getFullYear()} TempRx360. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: userEmail,
      subject: `TempRx360 Monthly Report - ${pharmacyName} - ${monthName}`,
      html,
      attachments: [{
        filename: `TempRx360_Monthly_Report_${pharmacyName.replace(/\s+/g, '_')}_${monthName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });
  }

  /**
   * Send custom report
   */
  static async sendCustomReport(
    userEmail: string,
    reportTitle: string,
    reportData: any,
    pdfBuffer?: Buffer,
    csvBuffer?: Buffer
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .summary { background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; }
          .logo { font-size: 24px; font-weight: bold; }
          .highlight { color: #2563eb; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TempRx360</div>
          <p>Temperature Monitoring Report</p>
        </div>
        
        <div class="content">
          <h2>${reportTitle}</h2>
          
          <div class="summary">
            <h3>Report Details:</h3>
            <ul>
              <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Date Range:</strong> ${reportData.startDate} to ${reportData.endDate}</li>
              <li><strong>Sensors:</strong> ${reportData.sensorsCount || 'N/A'}</li>
              <li><strong>Total Readings:</strong> ${reportData.totalReadings || 'N/A'}</li>
            </ul>
          </div>
          
          <p>Please find your requested temperature monitoring report attached.</p>
          
          <p>Best regards,<br>
          <strong>TempRx360 Team</strong></p>
        </div>
        
        <div class="footer">
          <p>This report was generated from TempRx360 Temperature Monitoring System</p>
        </div>
      </body>
      </html>
    `;

    const attachments: any[] = [];
    
    if (pdfBuffer) {
      attachments.push({
        filename: `${reportTitle.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }
    
    if (csvBuffer) {
      attachments.push({
        filename: `${reportTitle.replace(/\s+/g, '_')}.csv`,
        content: csvBuffer,
        contentType: 'text/csv'
      });
    }

    return await this.sendEmail({
      to: userEmail,
      subject: `TempRx360 Report: ${reportTitle}`,
      html,
      attachments
    });
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

      if (!hasSmtpConfig) {
        console.log('📧 Email service is in mock mode (no SMTP credentials configured)');
        return true;
      }

      console.log('🔍 Testing Gmail SMTP connection...');
      await transporter.verify();
      console.log('✅ Gmail SMTP configuration is valid and connected');
      return true;

    } catch (error) {
      console.error('❌ Gmail SMTP configuration test failed:', error);
      console.error('   Make sure your Gmail App Password is correct and 2FA is enabled');
      return false;
    }
  }

  /**
   * Send a test email to verify the configuration
   */
  static async sendTestEmail(testEmail: string): Promise<boolean> {
    const testHtml = `
      <h2>TempRx360 Email Test</h2>
      <p>This is a test email to verify your Gmail SMTP configuration is working correctly.</p>
      <p><strong>Configuration Details:</strong></p>
      <ul>
        <li>SMTP Host: ${process.env.SMTP_HOST}</li>
        <li>SMTP Port: ${process.env.SMTP_PORT}</li>
        <li>From Address: ${process.env.SMTP_FROM}</li>
        <li>Test Time: ${new Date().toLocaleString()}</li>
      </ul>
      <p>If you received this email, your email configuration is working perfectly!</p>
    `;

    return await this.sendEmail({
      to: testEmail,
      subject: 'TempRx360 Email Configuration Test',
      html: testHtml
    });
  }
}
