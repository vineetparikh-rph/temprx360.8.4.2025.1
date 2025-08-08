import { PrismaClient } from '@prisma/client';
import { PDFGenerator } from './pdf-generator';
import { EmailService } from './email-service';

const prisma = new PrismaClient();

export class ReportScheduler {
  
  /**
   * Generate and send monthly reports on the 1st of each month
   * This should be called by a cron job or scheduled task
   */
  static async sendMonthlyReports(): Promise<void> {
    console.log('🔄 Starting monthly report generation...');
    
    try {
      const pharmacies = await prisma.pharmacy.findMany({
        include: {
          userPharmacies: {
            include: {
              user: true
            }
          },
          sensorAssignments: true
        }
      });

      if (pharmacies.length === 0) {
        console.log('⚠️ No pharmacies found');
        return;
      }

      // Get last month's date range
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      console.log(`📅 Generating reports for: ${lastMonth.toDateString()} to ${endOfLastMonth.toDateString()}`);

      let reportsGenerated = 0;
      let emailsSent = 0;

      for (const pharmacy of pharmacies) {
        if (pharmacy.sensorAssignments.length === 0) {
          console.log(`⚠️ Skipping ${pharmacy.name} - no sensors assigned`);
          continue;
        }

        console.log(`📊 Processing ${pharmacy.name}...`);

        // Get 10 AM and 5 PM readings for the month
        const readings = await this.getMonthlyReadings(
          pharmacy.sensorAssignments.map(a => a.sensorPushId),
          lastMonth,
          endOfLastMonth
        );

        if (readings.length === 0) {
          console.log(`⚠️ No readings found for ${pharmacy.name}`);
          continue;
        }

        // Calculate summary statistics
        const temperatures = readings.map(r => r.temperature);
        const summary = {
          totalReadings: readings.length,
          averageTemp: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
          minTemp: Math.min(...temperatures),
          maxTemp: Math.max(...temperatures),
          alertsCount: await this.getAlertsCount(pharmacy.id, lastMonth, endOfLastMonth),
          compliancePercentage: this.calculateCompliance(readings, pharmacy.sensorAssignments)
        };

        // Prepare report data
        const reportData = {
          title: 'Monthly Temperature Compliance Report',
          pharmacyName: pharmacy.name,
          startDate: lastMonth.toISOString().split('T')[0],
          endDate: endOfLastMonth.toISOString().split('T')[0],
          readings: readings.map(r => ({
            timestamp: r.timestamp.toISOString(),
            temperature: r.temperature,
            humidity: r.humidity,
            sensorName: pharmacy.sensorAssignments.find(a => a.sensorPushId === r.sensorId)?.sensorName || r.sensorId,
            location: pharmacy.sensorAssignments.find(a => a.sensorPushId === r.sensorId)?.locationType || 'unknown',
            pharmacy: pharmacy.name
          })),
          summary
        };

        // Generate PDF report
        const pdfBuffer = PDFGenerator.generateMonthlyReport(reportData);
        reportsGenerated++;

        // Email to all users with access to this pharmacy
        for (const userPharmacy of pharmacy.userPharmacies) {
          try {
            const emailSent = await EmailService.sendMonthlyReport(
              userPharmacy.user.email,
              pharmacy.name,
              summary,
              pdfBuffer
            );

            if (emailSent) {
              emailsSent++;
              console.log(`✅ Monthly report emailed to ${userPharmacy.user.email} for ${pharmacy.name}`);
            } else {
              console.log(`❌ Failed to email report to ${userPharmacy.user.email} for ${pharmacy.name}`);
            }
          } catch (error) {
            console.error(`❌ Error emailing report to ${userPharmacy.user.email}:`, error);
          }
        }
      }

      console.log(`✅ Monthly report generation completed:`);
      console.log(`   - Reports generated: ${reportsGenerated}`);
      console.log(`   - Emails sent: ${emailsSent}`);

    } catch (error) {
      console.error('❌ Error in monthly report generation:', error);
      throw error;
    }
  }

  /**
   * Get temperature readings for 10 AM and 5 PM for the specified month
   */
  private static async getMonthlyReadings(
    sensorIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // Get all readings for the month
    const allReadings = await prisma.reading.findMany({
      where: {
        sensorId: { in: sensorIds },
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    // Filter for 10 AM and 5 PM readings (within 30 minutes of target times)
    const filteredReadings = allReadings.filter(reading => {
      const hour = reading.timestamp.getHours();
      const minute = reading.timestamp.getMinutes();
      
      // 10 AM readings (9:30 AM - 10:30 AM)
      const is10AM = (hour === 9 && minute >= 30) || (hour === 10 && minute <= 30);
      
      // 5 PM readings (4:30 PM - 5:30 PM)
      const is5PM = (hour === 16 && minute >= 30) || (hour === 17 && minute <= 30);
      
      return is10AM || is5PM;
    });

    return filteredReadings;
  }

  /**
   * Get alerts count for a pharmacy in the specified period
   */
  private static async getAlertsCount(
    pharmacyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const alertsCount = await prisma.alert.count({
      where: {
        pharmacyId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    return alertsCount;
  }

  /**
   * Calculate compliance percentage based on readings and thresholds
   */
  private static calculateCompliance(readings: any[], sensorAssignments: any[]): number {
    if (readings.length === 0) return 100;

    let compliantReadings = 0;

    for (const reading of readings) {
      const assignment = sensorAssignments.find(a => a.sensorPushId === reading.sensorId);
      if (!assignment) continue;

      // Define thresholds based on location type
      let minTemp: number, maxTemp: number;
      
      switch (assignment.locationType) {
        case 'refrigerator':
          minTemp = 2.0;
          maxTemp = 8.0;
          break;
        case 'freezer':
          minTemp = -25.0;
          maxTemp = -15.0;
          break;
        case 'storage':
        default:
          minTemp = 15.0;
          maxTemp = 25.0;
          break;
      }

      // Check if reading is within acceptable range
      if (reading.temperature >= minTemp && reading.temperature <= maxTemp) {
        compliantReadings++;
      }
    }

    return (compliantReadings / readings.length) * 100;
  }

  /**
   * Test the monthly report generation (for development)
   */
  static async testMonthlyReports(): Promise<void> {
    console.log('🧪 Testing monthly report generation...');
    
    try {
      // Generate reports for the current month instead of last month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      console.log(`📅 Test period: ${startOfMonth.toDateString()} to ${endOfMonth.toDateString()}`);
      
      // Temporarily modify the method to use current month
      await this.sendMonthlyReports();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }
}

// Export a function that can be called by API routes or cron jobs
export async function runMonthlyReports(): Promise<void> {
  await ReportScheduler.sendMonthlyReports();
}

export async function testMonthlyReports(): Promise<void> {
  await ReportScheduler.testMonthlyReports();
}
