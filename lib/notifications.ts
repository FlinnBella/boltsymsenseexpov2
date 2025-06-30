import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  // Skip notifications in Expo Go to avoid errors
  try {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Push notification permissions not granted');
      return;
    }

    if (Platform.OS !== 'web') {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    return token;
  } catch (error) {
    console.warn('Notifications not available in Expo Go:', error);
    return null;
  }
}

export async function scheduleMedicationReminder(
  medicationName: string,
  time: Date,
  frequency: 'daily' | 'weekly' | 'monthly'
) {
  const trigger = {
    hour: time.getHours(),
    minute: time.getMinutes(),
    repeats: true,
  } as Notifications.CalendarTriggerInput;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Medication Reminder',
      body: `Time to take your ${medicationName}`,
      data: { type: 'medication', medication: medicationName },
    },
    //what the hell does the trigger do here even??
    trigger,
  });
}

export async function scheduleAppointmentReminder(
  appointmentType: string,
  appointmentTime: Date
) {
  const reminderTime = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Appointment Reminder',
      body: `You have a ${appointmentType} appointment tomorrow`,
      data: { type: 'appointment', appointmentType },
    },
    trigger: { date: reminderTime } as Notifications.DateTriggerInput,
  });
}

export async function sendAchievementNotification(achievement: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎉 Achievement Unlocked!',
      body: achievement,
      data: { type: 'achievement' },
    },
    trigger: null,
  });
}

export async function sendHealthAlert(message: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚠️ Health Alert',
      body: message,
      data: { type: 'health_alert' },
    },
    trigger: null,
  });
}