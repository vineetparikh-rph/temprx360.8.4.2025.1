"use client";

export default function AddSensorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Sensor</h1>
        <p className="text-gray-600 mt-1">Configure new temperature sensors for your pharmacy locations</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Add New Sensor</h3>
            <p className="text-blue-800 mt-1">
              This feature will allow you to configure new temperature sensors for monitoring.
            </p>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
            Coming Soon
          </button>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Configuration Features</h3>
        <ul className="space-y-2 text-gray-600">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Register new SensorPush devices
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Assign sensors to pharmacy locations
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Set temperature thresholds and alerts
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Configure monitoring schedules
          </li>
        </ul>
      </div>
    </div>
  );
}