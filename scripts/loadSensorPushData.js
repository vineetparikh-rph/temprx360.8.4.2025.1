import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = 'https://api.sensorpush.com/api/v1';
const SENSORPUSH_EMAIL = process.env.SENSORPUSH_EMAIL;
const SENSORPUSH_PASSWORD = process.env.SENSORPUSH_PASSWORD;

let accessToken = null;
let refreshToken = null;

async function login() {
  try {
    console.log('Attempting to log in...');
    const response = await axios.post(
      `${API_BASE}/oauth/authorize`,
      {
        email: SENSORPUSH_EMAIL,
        password: SENSORPUSH_PASSWORD,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    const { authorization } = response.data;
    console.log('Authorization code received:', authorization);

    const tokenResponse = await axios.post(
      `${API_BASE}/oauth/accesstoken`,
      { authorization },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    const { access_token, refresh_token } = tokenResponse.data;
    accessToken = access_token;
    refreshToken = refresh_token;
    console.log('Access token and refresh token acquired.');
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
    throw new Error('Login failed');
  }
}

async function getAuthHeaders() {
  if (!accessToken) await login();
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
}

async function fetchGateways() {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE}/devices/gateways`,
      {},
      { headers }
    );
    return response.data.gateways;
  } catch (error) {
    console.error('Failed to fetch gateways:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch gateways');
  }
}

async function fetchSensors(gatewayId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE}/devices/sensors`,
      { gatewayId },
      { headers }
    );
    return response.data.sensors;
  } catch (error) {
    console.error(`Failed to fetch sensors for gateway ${gatewayId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch sensors for gateway ${gatewayId}`);
  }
}

async function fetchLatestReading(sensorId) {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE}/samples`,
      { sensors: [sensorId], limit: 1 },
      { headers }
    );
    return response.data.samples[0];
  } catch (error) {
    console.error(`Failed to fetch latest reading for sensor ${sensorId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Failed to fetch latest reading for sensor ${sensorId}`);
  }
}

async function loadAllSensorPushData() {
  try {
    console.log('Loading all SensorPush data...');
    const gateways = await fetchGateways();
    for (const gateway of gateways) {
      console.log(`Gateway: ${gateway.name} (last seen: ${gateway.lastSeen})`);
      const sensors = await fetchSensors(gateway.id);
      for (const sensor of sensors) {
        const latestReading = await fetchLatestReading(sensor.id);
        console.log(`Sensor: ${sensor.name} - Temp: ${latestReading.temperature}°F, Humidity: ${latestReading.humidity}%`);
        // TODO: Save/update sensor and reading in your local database here
      }
    }
  } catch (error) {
    console.error('Error loading SensorPush data:', error.message);
  }
}

loadAllSensorPushData();
