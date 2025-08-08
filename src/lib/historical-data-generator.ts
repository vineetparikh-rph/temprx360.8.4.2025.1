import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TemperatureProfile {
  location: string;
  baseTemp: number;
  variance: number;
  seasonalVariance: number;
  dailyVariance: number;
  alertProbability: number; // Probability of generating an alert condition
}

// Temperature profiles for different storage types
const TEMPERATURE_PROFILES: TemperatureProfile[] = [
  {
    location: 'refrigerator',
    baseTemp: 4.0,      // 4°C base temperature
    variance: 1.0,      // ±1°C normal variance
    seasonalVariance: 0.5, // ±0.5°C seasonal variance
    dailyVariance: 0.3,    // ±0.3°C daily variance
    alertProbability: 0.02 // 2% chance of alert condition
  },
  {
    location: 'freezer',
    baseTemp: -20.0,    // -20°C base temperature
    variance: 2.0,      // ±2°C normal variance
    seasonalVariance: 1.0, // ±1°C seasonal variance
    dailyVariance: 0.5,    // ±0.5°C daily variance
    alertProbability: 0.015 // 1.5% chance of alert condition
  },
  {
    location: 'storage',
    baseTemp: 20.0,     // 20°C base temperature
    variance: 2.0,      // ±2°C normal variance
    seasonalVariance: 3.0, // ±3°C seasonal variance
    dailyVariance: 1.0,    // ±1°C daily variance
    alertProbability: 0.01 // 1% chance of alert condition
  }
];

export class HistoricalDataGenerator {
  
  /**
   * Generate historical temperature data for all sensors from 2019 onwards
   */
  static async generateHistoricalData(): Promise<void> {
    console.log('🔄 Starting historical data generation...');
    
    try {
      // Get all sensor assignments
      const assignments = await prisma.sensorAssignment.findMany({
        include: {
          pharmacy: true
        }
      });

      if (assignments.length === 0) {
        console.log('⚠️ No sensor assignments found');
        return;
      }

      const startDate = new Date('2019-01-01');
      const endDate = new Date(); // Today
      
      console.log(`📅 Generating data from ${startDate.toDateString()} to ${endDate.toDateString()}`);
      console.log(`🔢 Processing ${assignments.length} sensors`);

      for (const assignment of assignments) {
        await this.generateSensorData(assignment, startDate, endDate);
      }

      console.log('✅ Historical data generation completed');
      
    } catch (error) {
      console.error('❌ Error generating historical data:', error);
      throw error;
    }
  }

  /**
   * Generate data for a specific sensor
   */
  private static async generateSensorData(assignment: any, startDate: Date, endDate: Date): Promise<void> {
    console.log(`📊 Generating data for sensor: ${assignment.sensorName} (${assignment.locationType})`);
    
    const profile = this.getProfileForLocation(assignment.locationType);
    const readings: any[] = [];
    const alerts: any[] = [];
    
    const currentDate = new Date(startDate);
    let readingCount = 0;
    let alertCount = 0;

    while (currentDate <= endDate) {
      // Generate 24 readings per day (every hour)
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(currentDate);
        timestamp.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        const temperature = this.generateTemperature(profile, timestamp);
        const humidity = this.generateHumidity(assignment.locationType, timestamp);
        
        readings.push({
          sensorId: assignment.sensorPushId,
          temperature,
          humidity,
          timestamp,
          archived: timestamp < new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // Archive data older than 20 days
        });
        
        readingCount++;
        
        // Check if this reading should generate an alert
        if (this.shouldGenerateAlert(profile, temperature)) {
          const alertType = temperature > (profile.baseTemp + profile.variance) ? 'temperature_high' : 'temperature_low';
          const severity = this.calculateSeverity(temperature, profile);
          
          alerts.push({
            sensorId: assignment.sensorPushId,
            pharmacyId: assignment.pharmacyId,
            type: alertType,
            severity,
            message: `${alertType === 'temperature_high' ? 'High' : 'Low'} temperature detected: ${temperature.toFixed(1)}°C`,
            currentValue: temperature,
            thresholdValue: alertType === 'temperature_high' 
              ? profile.baseTemp + profile.variance 
              : profile.baseTemp - profile.variance,
            location: assignment.locationType,
            resolved: Math.random() > 0.1, // 90% of alerts are eventually resolved
            resolvedAt: Math.random() > 0.1 ? new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
            resolvedNote: Math.random() > 0.5 ? 'Temperature returned to normal range' : 'Manually resolved by staff',
            createdAt: timestamp
          });
          
          alertCount++;
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Batch insert readings (in chunks to avoid memory issues)
    const chunkSize = 1000;
    for (let i = 0; i < readings.length; i += chunkSize) {
      const chunk = readings.slice(i, i + chunkSize);
      await prisma.reading.createMany({
        data: chunk,
        skipDuplicates: true
      });
    }

    // Batch insert alerts
    if (alerts.length > 0) {
      for (let i = 0; i < alerts.length; i += chunkSize) {
        const chunk = alerts.slice(i, i + chunkSize);
        await prisma.alert.createMany({
          data: chunk,
          skipDuplicates: true
        });
      }
    }

    console.log(`✅ Generated ${readingCount} readings and ${alertCount} alerts for ${assignment.sensorName}`);
  }

  /**
   * Generate realistic temperature based on profile and time
   */
  private static generateTemperature(profile: TemperatureProfile, timestamp: Date): number {
    const dayOfYear = this.getDayOfYear(timestamp);
    const hourOfDay = timestamp.getHours();
    
    // Base temperature
    let temperature = profile.baseTemp;
    
    // Seasonal variation (sine wave over the year)
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI);
    temperature += seasonalFactor * profile.seasonalVariance;
    
    // Daily variation (sine wave over the day)
    const dailyFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI);
    temperature += dailyFactor * profile.dailyVariance;
    
    // Random variance
    temperature += (Math.random() - 0.5) * 2 * profile.variance;
    
    // Occasionally generate alert conditions
    if (Math.random() < profile.alertProbability) {
      const alertDirection = Math.random() > 0.5 ? 1 : -1;
      temperature += alertDirection * (profile.variance + Math.random() * 3);
    }
    
    return Math.round(temperature * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Generate realistic humidity
   */
  private static generateHumidity(locationType: string, timestamp: Date): number {
    const baseHumidity = locationType === 'freezer' ? 60 : 55;
    const variance = 10;
    
    const hourOfDay = timestamp.getHours();
    const dailyFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI);
    
    let humidity = baseHumidity;
    humidity += dailyFactor * 5; // Daily variation
    humidity += (Math.random() - 0.5) * 2 * variance;
    
    return Math.max(0, Math.min(100, Math.round(humidity * 10) / 10));
  }

  /**
   * Check if temperature should generate an alert
   */
  private static shouldGenerateAlert(profile: TemperatureProfile, temperature: number): boolean {
    const upperThreshold = profile.baseTemp + profile.variance + 1;
    const lowerThreshold = profile.baseTemp - profile.variance - 1;
    
    return temperature > upperThreshold || temperature < lowerThreshold;
  }

  /**
   * Calculate alert severity based on temperature deviation
   */
  private static calculateSeverity(temperature: number, profile: TemperatureProfile): string {
    const deviation = Math.abs(temperature - profile.baseTemp);
    
    if (deviation > profile.variance + 4) return 'critical';
    if (deviation > profile.variance + 2) return 'high';
    if (deviation > profile.variance + 1) return 'medium';
    return 'low';
  }

  /**
   * Get profile for location type
   */
  private static getProfileForLocation(locationType: string): TemperatureProfile {
    return TEMPERATURE_PROFILES.find(p => p.location === locationType) || TEMPERATURE_PROFILES[2]; // Default to storage
  }

  /**
   * Get day of year (1-365)
   */
  private static getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Generate sample data for testing (last 7 days only)
   */
  static async generateSampleData(): Promise<void> {
    console.log('🔄 Generating sample data for last 7 days...');
    
    const assignments = await prisma.sensorAssignment.findMany({
      include: { pharmacy: true }
    });

    if (assignments.length === 0) {
      console.log('⚠️ No sensor assignments found');
      return;
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    for (const assignment of assignments) {
      await this.generateSensorData(assignment, startDate, endDate);
    }

    console.log('✅ Sample data generation completed');
  }
}
