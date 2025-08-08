import jsPDF from 'jspdf';

interface TemperatureReading {
  timestamp: string;
  temperature: number;
  humidity?: number;
  sensorName: string;
  location: string;
  pharmacy: string;
}

interface ReportData {
  title: string;
  pharmacyName: string;
  startDate: string;
  endDate: string;
  readings: TemperatureReading[];
  summary: {
    totalReadings: number;
    averageTemp: number;
    minTemp: number;
    maxTemp: number;
    alertsCount: number;
    compliancePercentage: number;
  };
}

export class PDFGenerator {
  
  /**
   * Generate monthly compliance report PDF
   */
  static generateMonthlyReport(reportData: ReportData): Buffer {
    const doc = new jsPDF();
    
    // Header
    this.addHeader(doc, 'Monthly Temperature Compliance Report');
    
    // Report Info
    let yPosition = 40;
    doc.setFontSize(12);
    doc.text(`Pharmacy: ${reportData.pharmacyName}`, 20, yPosition);
    doc.text(`Report Period: ${reportData.startDate} to ${reportData.endDate}`, 20, yPosition + 7);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 14);
    
    // Summary Section
    yPosition += 30;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Executive Summary', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const summaryData = [
      ['Total Readings', reportData.summary.totalReadings.toString()],
      ['Average Temperature', `${reportData.summary.averageTemp.toFixed(1)}°C`],
      ['Temperature Range', `${reportData.summary.minTemp.toFixed(1)}°C to ${reportData.summary.maxTemp.toFixed(1)}°C`],
      ['Alerts Generated', reportData.summary.alertsCount.toString()],
      ['Compliance Rate', `${reportData.summary.compliancePercentage.toFixed(1)}%`]
    ];

    // Summary table (simplified)
    doc.setFontSize(10);
    doc.text('Report Summary:', 20, yPosition);
    yPosition += 10;

    for (const [metric, value] of summaryData) {
      doc.text(`${metric}: ${value}`, 25, yPosition);
      yPosition += 8;
    }

    yPosition += 10;

    // Temperature Readings Table
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Daily Temperature Readings (10 AM & 5 PM)', 20, yPosition);
    
    yPosition += 10;
    
    // Prepare readings data for table
    const readingsData = reportData.readings.map(reading => [
      new Date(reading.timestamp).toLocaleDateString(),
      new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reading.sensorName,
      reading.location,
      `${reading.temperature.toFixed(1)}°C`,
      reading.humidity ? `${reading.humidity.toFixed(1)}%` : 'N/A'
    ]);

    // Temperature readings (simplified)
    doc.text('Temperature Readings:', 20, yPosition);
    yPosition += 10;
    doc.text(`Total readings: ${readingsData.length}`, 25, yPosition);
    yPosition += 20;

    // Compliance Statement
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Compliance Statement', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const complianceText = reportData.summary.compliancePercentage >= 95 
      ? 'This pharmacy has maintained excellent temperature compliance during the reporting period.'
      : reportData.summary.compliancePercentage >= 90
      ? 'This pharmacy has maintained good temperature compliance with minor deviations noted.'
      : 'This pharmacy has experienced temperature compliance issues that require attention.';
    
    doc.text(complianceText, 20, yPosition, { maxWidth: 170 });

    // Footer
    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Generate custom temperature report PDF
   */
  static generateCustomReport(reportData: ReportData): Buffer {
    const doc = new jsPDF();
    
    // Header
    this.addHeader(doc, reportData.title);
    
    // Report Info
    let yPosition = 40;
    doc.setFontSize(12);
    doc.text(`Pharmacy: ${reportData.pharmacyName}`, 20, yPosition);
    doc.text(`Date Range: ${reportData.startDate} to ${reportData.endDate}`, 20, yPosition + 7);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 14);
    
    // Summary Section
    yPosition += 30;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Report Summary', 20, yPosition);
    
    yPosition += 10;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    const summaryData = [
      ['Total Readings', reportData.summary.totalReadings.toString()],
      ['Average Temperature', `${reportData.summary.averageTemp.toFixed(1)}°C`],
      ['Minimum Temperature', `${reportData.summary.minTemp.toFixed(1)}°C`],
      ['Maximum Temperature', `${reportData.summary.maxTemp.toFixed(1)}°C`],
      ['Temperature Range', `${(reportData.summary.maxTemp - reportData.summary.minTemp).toFixed(1)}°C`],
      ['Alerts Generated', reportData.summary.alertsCount.toString()]
    ];

    // Summary table (simplified)
    doc.setFontSize(10);
    doc.text('Report Summary:', 20, yPosition);
    yPosition += 10;

    for (const [metric, value] of summaryData) {
      doc.text(`${metric}: ${value}`, 25, yPosition);
      yPosition += 8;
    }

    yPosition += 10;

    // Temperature Readings Table
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Temperature Readings', 20, yPosition);
    
    yPosition += 10;
    
    // Prepare readings data for table
    const readingsData = reportData.readings.map(reading => [
      new Date(reading.timestamp).toLocaleDateString(),
      new Date(reading.timestamp).toLocaleTimeString(),
      reading.sensorName,
      reading.location,
      `${reading.temperature.toFixed(1)}°C`,
      reading.humidity ? `${reading.humidity.toFixed(1)}%` : 'N/A'
    ]);

    // Temperature readings (simplified)
    doc.text('Temperature Readings:', 20, yPosition);
    yPosition += 10;
    doc.text(`Total readings: ${readingsData.length}`, 25, yPosition);
    yPosition += 10;

    // Footer
    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Generate CSV data
   */
  static generateCSV(reportData: ReportData): Buffer {
    const headers = ['Date', 'Time', 'Sensor', 'Location', 'Temperature (°C)', 'Humidity (%)', 'Pharmacy'];
    
    const csvData = [
      headers.join(','),
      ...reportData.readings.map(reading => [
        new Date(reading.timestamp).toLocaleDateString(),
        new Date(reading.timestamp).toLocaleTimeString(),
        `"${reading.sensorName}"`,
        `"${reading.location}"`,
        reading.temperature.toFixed(1),
        reading.humidity ? reading.humidity.toFixed(1) : '',
        `"${reading.pharmacy}"`
      ].join(','))
    ].join('\n');

    return Buffer.from(csvData, 'utf-8');
  }

  /**
   * Add header to PDF
   */
  private static addHeader(doc: jsPDF, title: string): void {
    // Logo/Title
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('TempRx360', 20, 20);
    
    // Subtitle
    doc.setFontSize(14);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, 30);
    
    // Line
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);
  }

  /**
   * Add footer to PDF
   */
  private static addFooter(doc: jsPDF): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('TempRx360 Temperature Monitoring System', 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
    }
  }
}
