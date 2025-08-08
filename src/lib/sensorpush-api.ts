// src/lib/sensorpush-api.ts
class SensorPushAPI {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private baseURL = 'https://api.sensorpush.com/api/v1';

  async authenticate() {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      // Step 1: Get authorization
      const authResponse = await fetch(`${this.baseURL}/oauth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.SENSORPUSH_EMAIL,
          password: process.env.SENSORPUSH_PASSWORD
        })
      });

      if (!authResponse.ok) {
        throw new Error('Failed to authenticate with SensorPush');
      }

      const { authorization } = await authResponse.json();

      // Step 2: Get access token
      const tokenResponse = await fetch(`${this.baseURL}/oauth/accesstoken`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorization })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token');
      }

      const { accesstoken } = await tokenResponse.json();
      this.accessToken = accesstoken;
      this.tokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      return accesstoken;
    } catch (error) {
      console.error('SensorPush authentication failed:', error);
      throw error;
    }
  }

  async getSensors() {
    const token = await this.authenticate();
    
    try {
      const response = await fetch(`${this.baseURL}/devices/sensors`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sensors');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch sensors:', error);
      throw error;
    }
  }

  async getSensorData(sensorIds: string[], startTime?: Date, endTime?: Date) {
    const token = await this.authenticate();

    try {
      const payload: any = {
        sensors: sensorIds,
        limit: 100
      };

      if (startTime) {
        payload.startTime = startTime.toISOString();
      }
      if (endTime) {
        payload.endTime = endTime.toISOString();
      }

      const response = await fetch(`${this.baseURL}/samples`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sensor data');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
      throw error;
    }
  }

  async getGateways() {
    const token = await this.authenticate();

    try {
      const response = await fetch(`${this.baseURL}/devices/gateways`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gateways');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch gateways:', error);
      throw error;
    }
  }
}

export const sensorPushAPI = new SensorPushAPI();