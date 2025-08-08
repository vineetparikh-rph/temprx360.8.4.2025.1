import jsPDF from 'jspdf';

interface PharmacyInfo {
  name: string;
  address: string;
  pharmacistInCharge: string;
  licenseNumber?: string;
  phone?: string;
  fax?: string;
  npi?: string;
  njbop?: string;
  dea?: string;
  ncpdp?: string;
  effectiveDate?: string;
}

export class PolicyGenerator {
  
  /**
   * Generate Temperature Monitoring & Excursion Policy PDF
   */
  static generateTemperaturePolicy(pharmacyInfo: PharmacyInfo): Buffer {
    const doc = new jsPDF();
    const effectiveDate = pharmacyInfo.effectiveDate || new Date().toLocaleDateString();
    
    // Header with pharmacy name
    this.addPolicyHeader(doc, pharmacyInfo.name);
    
    let yPosition = 40;
    
    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`🧊 ${pharmacyInfo.name} Temperature Monitoring & Excursion Policy`, 20, yPosition);

    yPosition += 15;

    // Policy metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Effective Date: ${effectiveDate}`, 20, yPosition);
    // Pharmacy details instead of "Applies To"
    doc.text(`Pharmacy: ${pharmacyInfo.name}`, 20, yPosition + 5);
    doc.text(`Address: ${pharmacyInfo.address}`, 20, yPosition + 10);
    doc.text(`Phone: ${pharmacyInfo.phone || 'Not specified'}`, 20, yPosition + 15);
    doc.text(`Fax: ${pharmacyInfo.fax || 'Not specified'}`, 20, yPosition + 20);
    doc.text(`NPI: ${pharmacyInfo.npi || 'Not specified'}`, 20, yPosition + 25);
    doc.text(`NJBOP: ${pharmacyInfo.njbop || 'Not specified'}`, 20, yPosition + 30);
    doc.text(`DEA: ${pharmacyInfo.dea || 'Not specified'}`, 20, yPosition + 35);
    doc.text(`NCPDP: ${pharmacyInfo.ncpdp || 'Not specified'}`, 20, yPosition + 40);
    doc.text(`Authorized By: ${pharmacyInfo.pharmacistInCharge}`, 20, yPosition + 45);
    doc.text(`Review Cycle: Annual`, 20, yPosition + 50);

    yPosition += 65;
    
    // 1. Purpose
    this.addSection(doc, '1. Purpose', yPosition);
    yPosition += 10;
    
    const purposeText = `To ensure safe storage, handling, transport, and delivery of prescription drugs and chemicals by maintaining temperature control in accordance with:

• N.J. Admin. Code § 13:39-5.11
• FDA Good Distribution Practices (GDP)
• USP Chapter <1079>
• CDC Vaccine Storage and Handling Toolkit (for applicable products)`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(purposeText, 20, yPosition, { maxWidth: 170 });
    yPosition += 35;
    
    // 2. Scope
    this.addSection(doc, '2. Scope', yPosition);
    yPosition += 10;
    
    const scopeText = `Applies to:
• All pharmacy-permitted areas
• All refrigerators and freezers
• All delivery and shipment of medications
• All pharmacy personnel involved in storage, transport, or dispensing`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(scopeText, 20, yPosition, { maxWidth: 170 });
    yPosition += 30;
    
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    // 3. Storage Requirements
    this.addSection(doc, '3. Storage Requirements', yPosition);
    yPosition += 10;
    
    const storageText = `Follow manufacturer's temperature guidelines. If unspecified:

• Ambient: 20–25 °C (68–77 °F)
• Refrigerated: 2–8 °C (36–46 °F)
• Frozen: −25 to −10 °C (−13 to 14 °F)

Temperatures must be logged twice daily and maintained within range.`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(storageText, 20, yPosition, { maxWidth: 170 });
    yPosition += 40;
    
    // 4. Temperature Mapping
    this.addSection(doc, '4. Temperature Mapping', yPosition);
    yPosition += 10;
    
    const mappingText = `• Conduct prior to using new storage units or after moving equipment
• Use NIST-traceable calibrated data loggers
• Map for at least 48 hours to identify temperature fluctuations`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(mappingText, 20, yPosition, { maxWidth: 170 });
    yPosition += 25;
    
    // 5. Monitoring Requirements
    this.addSection(doc, '5. Monitoring Requirements', yPosition);
    yPosition += 10;
    
    const monitoringText = `• Record temperatures minimum twice daily, ≥8 hours apart
• Use continuous digital monitors with alerts for critical storage
• Logs must contain: Date, time, temperature, initials
• Notations on excursions or issues
• Keep all records for 2 years minimum`;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(monitoringText, 20, yPosition, { maxWidth: 170 });
    yPosition += 35;
    
    // Check if we need a new page
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 30;
    }
    
    // Continue with remaining sections...
    this.addRemainingPolicySections(doc, yPosition, pharmacyInfo);
    
    // Add Quick Reference Table
    this.addQuickReferenceTable(doc);
    
    // Footer
    this.addPolicyFooter(doc, pharmacyInfo);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Add remaining policy sections
   */
  private static addRemainingPolicySections(doc: jsPDF, startY: number, pharmacyInfo: PharmacyInfo): void {
    let yPosition = startY;
    
    // 6. Calibration
    this.addSection(doc, '6. Calibration', yPosition);
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Calibrate all temperature-monitoring devices annually or per manufacturer guidelines\n• Maintain NIST-traceable calibration certificates', 20, yPosition, { maxWidth: 170 });
    yPosition += 20;
    
    // 7. Transport & Delivery
    this.addSection(doc, '7. Transport & Delivery', yPosition);
    yPosition += 10;
    const transportText = `• Use insulated and validated packaging for deliveries requiring temperature control
• Follow USP <1079> and CDC transport guidance
• Include with shipments: Temperature indicators, Recipient instructions for checking and reporting excursions`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(transportText, 20, yPosition, { maxWidth: 170 });
    yPosition += 30;
    
    // 8. Excursion Protocol
    this.addSection(doc, '8. Excursion Protocol', yPosition);
    yPosition += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('A. Immediate Response', 25, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Quarantine affected items and label "Do Not Use – Under Review"\n• Stabilize equipment and notify pharmacist-in-charge', 25, yPosition, { maxWidth: 165 });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('B. Documentation', 25, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Log: Start/end time, Temperature range, Affected products (lot/expiry), Equipment and location', 25, yPosition, { maxWidth: 165 });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('C. Evaluation', 25, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Assess excursion risk using manufacturer data and FDA stability guidance\n• For vaccines, use CDC guidelines\n• Obtain manufacturer written verification if >72 hours', 25, yPosition, { maxWidth: 165 });
    yPosition += 20;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('D. Reporting', 25, yPosition);
    yPosition += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Notify the NJ Board of Pharmacy if excursion lasts 24+ hours (within 48 hours of awareness)\n• Do not dispense if excursion >72 hours without manufacturer clearance', 25, yPosition, { maxWidth: 165 });
    yPosition += 20;
    
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 30;
    }
    
    // 9. CAPA
    this.addSection(doc, '9. Corrective & Preventive Actions (CAPA)', yPosition);
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Conduct root cause analysis for excursions\n• Take corrective steps: retraining, equipment replacement, SOP changes\n• Document and incorporate into quality audits', 20, yPosition, { maxWidth: 170 });
    yPosition += 25;
    
    // 10. Staff Training
    this.addSection(doc, '10. Staff Training', yPosition);
    yPosition += 10;
    const trainingText = `All staff handling temperature-sensitive drugs must be trained on:
• Storage protocols
• Excursion procedures  
• Packaging & delivery for cold chain

Training frequency: Upon hire, Annually, After excursion or SOP updates
Training logs must be retained for 2 years.`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(trainingText, 20, yPosition, { maxWidth: 170 });
    yPosition += 40;
    
    // 11. Audit & Compliance
    this.addSection(doc, '11. Audit & Compliance', yPosition);
    yPosition += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('• Conduct quarterly reviews of logs and excursions\n• Perform annual audits of storage practices and SOP adherence\n• Retain all records and findings for ≥2 years', 20, yPosition, { maxWidth: 170 });
    yPosition += 25;
    
    // 12. Definitions
    this.addSection(doc, '12. Definitions', yPosition);
    yPosition += 10;
    const definitionsText = `Temperature Excursion: Any deviation from required storage range
Quarantine: Isolation of impacted inventory until cleared
NIST-Traceable: Calibrated to standards set by the National Institute of Standards and Technology`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(definitionsText, 20, yPosition, { maxWidth: 170 });
  }

  /**
   * Add quick reference table
   */
  private static addQuickReferenceTable(doc: jsPDF): void {
    doc.addPage();
    
    this.addSection(doc, '13. Quick Reference', 30);
    
    const tableData = [
      ['Item', 'Standard'],
      ['Ambient Temp Range', '20–25 °C (68–77 °F)'],
      ['Refrigerated Temp Range', '2–8 °C (36–46 °F)'],
      ['Frozen Temp Range', '−25 to −10 °C (−13 to 14 °F)'],
      ['Temperature Monitoring Frequency', 'At least twice daily'],
      ['Excursion Report to Board (≥24 hrs)', 'Within 48 hours'],
      ['Manufacturer Clearance (≥72 hrs)', 'Required before dispensing'],
      ['Calibration Frequency', 'Annually'],
      ['Training Frequency', 'Hire, annual, and post-excursion'],
      ['Record Retention', '2 years']
    ];

    // Quick Reference Table (text-based)
    let yPosition = 45;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item', 25, yPosition);
    doc.text('Standard', 120, yPosition);

    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const tableRows = [
      ['Ambient Temp Range', '20–25 °C (68–77 °F)'],
      ['Refrigerated Temp Range', '2–8 °C (36–46 °F)'],
      ['Frozen Temp Range', '−25 to −10 °C (−13 to 14 °F)'],
      ['Temperature Monitoring Frequency', 'At least twice daily'],
      ['Excursion Report to Board (≥24 hrs)', 'Within 48 hours'],
      ['Manufacturer Clearance (≥72 hrs)', 'Required before dispensing'],
      ['Calibration Frequency', 'Annually'],
      ['Training Frequency', 'Hire, annual, and post-excursion'],
      ['Record Retention', '2 years']
    ];

    for (const [item, standard] of tableRows) {
      doc.text(item, 25, yPosition);
      doc.text(standard, 120, yPosition);
      yPosition += 8;
    }

    yPosition += 10;

    // 14. References
    this.addSection(doc, '14. References', yPosition);
    yPosition += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const referencesText = `• N.J. Admin. Code § 13:39-5.11:
  https://dspace.njstatelib.org/bitstreams/e8ab889f-fd08-472a-aaf7-bd19d540e6c4/download

• FDA Good Distribution Practices:
  https://www.fda.gov/drugs/drug-supply-chain-integrity/drug-supply-chain-security-act-dscsa

• USP Chapter <1079>:
  https://www.usp.org/sites/default/files/usp/document/supply-chain/apec-toolkit/USP%20GC1079.pdf

• CDC Vaccine Storage Toolkit:
  https://www.cdc.gov/vaccines/hcp/admin/storage/toolkit/storage-handling-toolkit.pdf`;
    doc.text(referencesText, 20, yPosition, { maxWidth: 170 });
  }

  /**
   * Add section header
   */
  private static addSection(doc: jsPDF, title: string, yPosition: number): void {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(title, 20, yPosition);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
  }

  /**
   * Add policy header
   */
  private static addPolicyHeader(doc: jsPDF, pharmacyName: string): void {
    // Header background
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 25, 'F');
    
    // Logo/Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('TempRx360', 20, 15);

    // Pharmacy name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${pharmacyName}`, 120, 15);
    
    // Reset colors
    doc.setTextColor(0, 0, 0);
  }

  /**
   * Add policy footer
   */
  private static addPolicyFooter(doc: jsPDF, pharmacyInfo: PharmacyInfo): void {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(20, 280, 190, 280);
      
      // Footer text
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`${pharmacyInfo.name} - Temperature Monitoring Policy`, 20, 285);
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 105, 285, { align: 'center' });
    }
  }

  /**
   * Generate policies for all pharmacies
   */
  static async generateAllPharmacyPolicies(pharmacies: any[]): Promise<{ [key: string]: Buffer }> {
    const policies: { [key: string]: Buffer } = {};
    
    for (const pharmacy of pharmacies) {
      const pharmacyInfo: PharmacyInfo = {
        name: pharmacy.name,
        address: pharmacy.address || 'Address not specified',
        pharmacistInCharge: pharmacy.pharmacistInCharge || 'Pharmacist-in-Charge',
        effectiveDate: pharmacy.effectiveDate || new Date().toLocaleDateString(),
        phone: pharmacy.phone || 'Not specified',
        fax: pharmacy.fax || 'Not specified',
        npi: pharmacy.npi || 'Not specified',
        njbop: pharmacy.licenseNumber || 'Not specified',
        dea: pharmacy.dea || 'Not specified',
        ncpdp: pharmacy.ncpdp || 'Not specified'
      };
      
      policies[pharmacy.id] = this.generateTemperaturePolicy(pharmacyInfo);
    }
    
    return policies;
  }
}
