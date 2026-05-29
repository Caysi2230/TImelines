# Timelines Mobile

React Native / Expo companion app for the Timelines desktop app.

## Requirements

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS or Android)

## Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Connecting to the desktop app

1. Make sure the desktop app is running (`npm start` from the root)
2. Open the mobile app → Settings tab
3. Enter the IP address of your desktop: `http://192.168.x.x:3000`
   - Mac: run `ipconfig getifaddr en0` in Terminal
   - Windows: run `ipconfig` and look for IPv4 Address
4. Tap Save

Both devices must be on the same Wi-Fi network.

## Push Notifications

In the Settings tab, tap "Enable Notifications" to set up:
- Morning briefing at 7am with today's tasks
- Day-before reminders for upcoming tasks
- Overdue task alerts
- Tap any notification to open the relevant project

## Offline Support

The app caches project data locally. When offline, you can still read all projects, milestones, and tasks. Changes (like completing tasks) sync back when the connection is restored.
