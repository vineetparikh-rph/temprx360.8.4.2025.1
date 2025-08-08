# 🚀 Vercel Deployment Guide

## Quick Deploy (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Import your GitHub repository:**
   - Select `georgies-pharmacy-admin`
   - Click "Import"

## Environment Variables Setup

In Vercel dashboard, add these environment variables:

### Required Variables:
```env
DATABASE_URL=file:./pharmacy.db
NEXTAUTH_SECRET=your-super-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=https://your-app-name.vercel.app
```

### Optional (for SensorPush integration):
```env
SENSORPUSH_API_KEY=your-sensorpush-api-key
SENSORPUSH_API_SECRET=your-sensorpush-api-secret
SENSORPUSH_EMAIL=your-sensorpush-email
SENSORPUSH_PASSWORD=your-sensorpush-password
```

## Deployment Settings

Vercel will automatically detect:
- ✅ Framework: Next.js
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `.next`
- ✅ Install Command: `npm install`

## 🎉 After Deployment

Your app will be available at:
- **URL:** `https://your-app-name.vercel.app`
- **Login:** admin@georgies.com / admin123

## 🔧 Custom Domain (Optional)

1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain
4. Update NEXTAUTH_URL to your custom domain

## 📊 Features Available After Deployment

✅ Real-time temperature monitoring
✅ Multi-pharmacy management
✅ Alert system
✅ Analytics and reporting
✅ User authentication
✅ Mobile responsive design
✅ All 35+ functional pages

## 🆘 Troubleshooting

**Build Errors:**
- Check environment variables are set
- Ensure all required variables are present

**Database Issues:**
- SQLite works automatically on Vercel
- No additional database setup needed

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain