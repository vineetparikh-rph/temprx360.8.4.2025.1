import { PrismaClient } from '@prisma/client';
import { sensorPushAPI } from './sensorpush-api';

const prisma = new PrismaClient();

interface AlertThreshold {
  location: string;
  minTemp: number;
  maxTemp: number;
  minHumidity?: number;
  maxHumidity?: number;
}

// Default temperature thresholds for different storage types
const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    location: 'refrigerator',
    minTemp: 2.0,   // 36°F
    maxTemp: 8.0,   // 46°F
    minHumidity: 45,
    maxHumidity: 75
  },
  {
    location: 'freezer',
    minTemp: -25.0, // -13°F
    maxTemp: -15.0, // 5°F
    minHumidity: 45,
    maxHumidity: 75
  },
  {
    location: 'storage',
    minTemp: 15.0,  // 59°F
    maxTemp: 25.0,  // 77°F
    minHumidity: 35,
    maxHumidity: 65
  },
  {
    location: 'other',
    minTemp: 15.0,  // 59°F
    maxTemp: 25.0,  // 77°F
    minHumidity: 35,
    maxHumidity: 65
  }
];

export class AlertService {
  
  /**
   * Check all sensors for temperature/humidity violations and create alerts
   */
  static async checkAllSensors(): Promise<void> {
    try {
      console.log('🔍 AlertService: Starting sensor check...');
      
      // Get all sensor assignments from database
      const assignments = await prisma.sensorAssignment.findMany({
        include: {
          pharmacy: true
        }
      });

      if (assignments.length === 0) {
        console.log('⚠️ AlertService: No sensor assignments found');
        return;
      }

      // Get current readings from SensorPush
      const sensorsData = await sensorPushAPI.getSensors();
      const sensorIds = Object.keys(sensorsData);
      
      if (sensorIds.length === 0) {
        console.log('⚠️ AlertService: No sensors found in SensorPush');
        return;
      }

      // Get latest readings
      const readings = await sensorPushAPI.getLatestReadings(sensorIds);
      
      // Check each assigned sensor
      for (const assignment of assignments) {
        const sensorData = sensorsData[assignment.sensorPushId];
        const reading = readings[assignment.sensorPushId];
        
        if (!sensorData || !reading) {
          // Create offline alert
          await this.createOfflineAlert(assignment);
          continue;
        }

        // Check temperature and humidity thresholds
        await this.checkTemperatureThresholds(assignment, reading);
        await this.checkHumidityThresholds(assignment, reading);
        await this.checkBatteryLevel(assignment, sensorData);
      }

      console.log('✅ AlertService: Sensor check completed');
      
    } catch (error) {
      console.error('❌ AlertService: Error checking sensors:', error);
    }
  }

  /**
   * Check temperature thresholds for a sensor
   */
  private static async checkTemperatureThresholds(assignment: any, reading: any): Promise<void> {
    const thresholds = this.getThresholdsForLocation(assignment.locationType);
    const currentTemp = reading.temperature;

    // Check if temperature is out of range
    if (currentTemp < thresholds.minTemp) {
      await this.createAlert({
        sensorAssignment: assignment,
        type: 'temperature_low',
        severity: this.getSeverity(currentTemp, thresholds.minTemp, 'low'),
        currentValue: currentTemp,
        thresholdValue: thresholds.minTemp,
        message: `Temperature too low: ${currentTemp.toFixed(1)}°C (min: ${thresholds.minTemp}°C)`
      });
    } else if (currentTemp > thresholds.maxTemp) {
      await this.createAlert({
        sensorAssignment: assignment,
        type: 'temperature_high',
        severity: this.getSeverity(currentTemp, thresholds.maxTemp, 'high'),
        currentValue: currentTemp,
        thresholdValue: thresholds.maxTemp,
        message: `Temperature too high: ${currentTemp.toFixed(1)}°C (max: ${thresholds.maxTemp}°C)`
      });
    } else {
      // Temperature is normal, resolve any existing temperature alerts
      await this.resolveExistingAlerts(assignment.sensorPushId, ['temperature_high', 'temperature_low']);
    }
  }

  /**
   * Check humidity thresholds for a sensor
   */
  private static async checkHumidityThresholds(assignment: any, reading: any): Promise<void> {
    if (!reading.humidity) return;

    const thresholds = this.getThresholdsForLocation(assignment.locationType);
    const currentHumidity = reading.humidity;

    if (thresholds.minHumidity && currentHumidity < thresholds.minHumidity) {
      await this.createAlert({
        sensorAssignment: assignment,
        type: 'humidity',
        severity: 'medium',
        currentValue: currentHumidity,
        thresholdValue: thresholds.minHumidity,
        message: `Humidity too low: ${currentHumidity.toFixed(1)}% (min: ${thresholds.minHumidity}%)`
      });
    } else if (thresholds.maxHumidity && currentHumidity > thresholds.maxHumidity) {
      await this.createAlert({
        sensorAssignment: assignment,
        type: 'humidity',
        severity: 'medium',
        currentValue: currentHumidity,
        thresholdValue: thresholds.maxHumidity,
        message: `Humidity too high: ${currentHumidity.toFixed(1)}% (max: ${thresholds.maxHumidity}%)`
      });
    } else {
      // Humidity is normal, resolve any existing humidity alerts
      await this.resolveExistingAlerts(assignment.sensorPushId, ['humidity']);
    }
  }

  /**
   * Check battery level for a sensor
   */
  private static async checkBatteryLevel(assignment: any, sensorData: any): Promise<void> {
    const batteryLevel = sensorData.battery_voltage || 0;
    const lowBatteryThreshold = 2.4; // Volts

    if (batteryLevel < lowBatteryThreshold) {
      await this.createAlert({
        sensorAssignment: assignment,
        type: 'battery_low',
        severity: 'low',
        currentValue: batteryLevel,
        thresholdValue: lowBatteryThreshold,
        message: `Low battery: ${batteryLevel.toFixed(2)}V (threshold: ${lowBatteryThreshold}V)`
      });
    } else {
      // Battery is normal, resolve any existing battery alerts
      await this.resolveExistingAlerts(assignment.sensorPushId, ['battery_low']);
    }
  }

  /**
   * Create offline alert for sensor
   */
  private static async createOfflineAlert(assignment: any): Promise<void> {
    await this.createAlert({
      sensorAssignment: assignment,
      type: 'offline',
      severity: 'high',
      message: `Sensor offline: ${assignment.sensorName}`
    });
  }

  /**
   * Create an alert if it doesn't already exist
   */
  private static async createAlert(alertData: {
    sensorAssignment: any;
    type: string;
    severity: string;
    currentValue?: number;
    thresholdValue?: number;
    message: string;
  }): Promise<void> {
    const { sensorAssignment, type, severity, currentValue, thresholdValue, message } = alertData;

    // Check if similar unresolved alert already exists
    const existingAlert = await prisma.alert.findFirst({
      where: {
        sensorId: sensorAssignment.sensorPushId,
        pharmacyId: sensorAssignment.pharmacyId,
        type: type,
        resolved: false
      }
    });

    if (existingAlert) {
      // Update existing alert with new values
      await prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          currentValue,
          message,
          updatedAt: new Date()
        }
      });
      console.log(`🔄 AlertService: Updated existing ${type} alert for sensor ${sensorAssignment.sensorName}`);
    } else {
      // Create new alert
      await prisma.alert.create({
        data: {
          sensorId: sensorAssignment.sensorPushId,
          pharmacyId: sensorAssignment.pharmacyId,
          type,
          severity,
          message,
          currentValue,
          thresholdValue,
          location: sensorAssignment.locationType
        }
      });
      console.log(`🚨 AlertService: Created new ${type} alert for sensor ${sensorAssignment.sensorName}`);
    }
  }

  /**
   * Resolve existing alerts of specified types for a sensor
   */
  private static async resolveExistingAlerts(sensorId: string, alertTypes: string[]): Promise<void> {
    await prisma.alert.updateMany({
      where: {
        sensorId: sensorId,
        type: { in: alertTypes },
        resolved: false
      },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedNote: 'Auto-resolved: Values returned to normal range'
      }
    });
  }

  /**
   * Get thresholds for a specific location type
   */
  private static getThresholdsForLocation(locationType: string): AlertThreshold {
    return DEFAULT_THRESHOLDS.find(t => t.location === locationType) || DEFAULT_THRESHOLDS[3]; // Default to 'other'
  }

  /**
   * Calculate severity based on how far the value is from threshold
   */
  private static getSeverity(currentValue: number, threshold: number, direction: 'high' | 'low'): string {
    const difference = direction === 'high' 
      ? currentValue - threshold 
      : threshold - currentValue;

    if (difference > 5) return 'critical';
    if (difference > 2) return 'high';
    if (difference > 1) return 'medium';
    return 'low';
  }

  /**
   * Get all active alerts for a pharmacy
   */
  static async getActiveAlerts(pharmacyId?: string): Promise<any[]> {
    const where: any = { resolved: false };
    if (pharmacyId) {
      where.pharmacyId = pharmacyId;
    }

    return await prisma.alert.findMany({
      where,
      include: {
        pharmacy: true
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Resolve an alert manually
   */
  static async resolveAlert(alertId: string, userId: string, note?: string): Promise<void> {
    await prisma.alert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: userId,
        resolvedNote: note || 'Manually resolved'
      }
    });
  }
}
