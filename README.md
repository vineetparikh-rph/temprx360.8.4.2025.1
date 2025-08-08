# 🏥 Georgies Pharmacy Admin Dashboard

A comprehensive pharmacy management system built with Next.js, featuring real-time temperature monitoring, sensor management, and compliance reporting for pharmaceutical operations.

## 🌟 Features

### 📊 **Dashboard & Analytics**
- Real-time temperature and humidity monitoring
- Interactive charts and metrics
- Predictive analytics for equipment maintenance
- Performance tracking and KPI monitoring

### 🏪 **Pharmacy Management**
- Multi-location pharmacy management
- Pharmacy status monitoring
- Assignment and configuration management
- Compliance tracking

### 🌡️ **Sensor & Hub Management**
- SensorPush API integration for real-time data
- Hub and sensor device management
- Temperature threshold configuration
- Battery and connectivity monitoring

### 🚨 **Alert System**
- Real-time temperature/humidity alerts
- Configurable alert thresholds
- Alert history and resolution tracking
- Email and SMS notifications

### 📋 **Reports & Compliance**
- Daily temperature reports
- Compliance documentation
- Audit trail and activity logs
- PDF report generation
- Data export capabilities

### 🔐 **Security & Authentication**
- NextAuth.js authentication system
- Role-based access control
- Secure API endpoints
- Session management

### 📱 **Modern UI/UX**
- Responsive design for all devices
- Dark/light mode support
- Interactive data visualizations
- Clean, professional interface

## 🚀 **Tech Stack**

- **Frontend:** Next.js 15, React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js
- **Charts:** Recharts
- **Icons:** Lucide React
- **API Integration:** SensorPush API
- **Deployment:** Vercel-ready

## 📦 **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/georgies-pharmacy-admin.git
   cd georgies-pharmacy-admin
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file with:
   ```env
   DATABASE_URL="file:./pharmacy.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   SENSORPUSH_API_KEY="your-sensorpush-api-key"
   SENSORPUSH_API_SECRET="your-sensorpush-api-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 **Default Login**

- **Email:** admin@georgies.com
- **Password:** admin123

## 📁 **Project Structure**

```
src/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin dashboard pages
│   ├── (full-width-pages)/ # Auth pages
│   └── api/               # API routes
├── components/            # Reusable components
├── lib/                   # Utility functions
├── types/                 # TypeScript definitions
└── context/               # React contexts

prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
```

## 🌐 **API Endpoints**

- `/api/sensors` - Sensor data management
- `/api/alerts` - Alert system
- `/api/reports` - Report generation
- `/api/admin/*` - Admin management functions
- `/api/auth/*` - Authentication (NextAuth.js)

## 🚀 **Deployment**

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vineetparikh-rph/TempRx360.8.4.2025&env=DATABASE_URL,NEXTAUTH_SECRET,NEXTAUTH_URL&envDescription=Required%20environment%20variables%20for%20the%20pharmacy%20admin%20dashboard&envLink=https://github.com/vineetparikh-rph/TempRx360.8.4.2025#environment-variables)

### Manual Vercel Deployment

1. **Push to GitHub** ✅ (Already done!)
2. **Connect to Vercel**
3. **Configure environment variables**
4. **Deploy automatically**

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 **Configuration**

### Temperature Thresholds
Configure alert thresholds in the admin settings:
- Low: 2°C
- High: 8°C  
- Critical: 10°C

### SensorPush Integration
1. Create account at [SensorPush](https://www.sensorpush.com/)
2. Get API credentials
3. Add to environment variables
4. Configure sensors in the dashboard

## 📊 **Features Overview**

| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | Real-time monitoring | ✅ |
| Sensors | Device management | ✅ |
| Alerts | Notification system | ✅ |
| Reports | PDF generation | ✅ |
| Analytics | Data insights | ✅ |
| Multi-pharmacy | Location management | ✅ |
| Mobile responsive | All devices | ✅ |

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- Create an issue on GitHub
- Email: support@georgiespharmacy.com

## 🏆 **Acknowledgments**

- Built for Georgies Pharmacy operations
- SensorPush API integration
- Next.js and React community
- Tailwind CSS framework

---

**🏥 Georgies Pharmacy Admin Dashboard** - Professional pharmacy management made simple.