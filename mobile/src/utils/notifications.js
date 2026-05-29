import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchProjects } from './api';

const BACKGROUND_TASK = 'CHECK_NOTIFICATIONS';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const projects = await fetchProjects();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const allTasks = projects.flatMap(p =>
    p.milestones.flatMap(m =>
      m.tasks.map(t => ({ ...t, projectName: p.name, projectId: p.id }))
    )
  );

  // Morning briefing at 7am
  const dueToday = allTasks.filter(t => !t.completed && t.due_date === today);
  const overdue = allTasks.filter(t => !t.completed && t.due_date && t.due_date < today);

  if (dueToday.length > 0 || overdue.length > 0) {
    const morningTrigger = new Date();
    morningTrigger.setHours(7, 0, 0, 0);
    if (morningTrigger < new Date()) morningTrigger.setDate(morningTrigger.getDate() + 1);

    const parts = [];
    if (dueToday.length > 0) parts.push(`${dueToday.length} due today`);
    if (overdue.length > 0) parts.push(`${overdue.length} overdue`);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Morning Briefing',
        body: parts.join(' · '),
        data: { type: 'briefing' },
      },
      trigger: morningTrigger,
    });
  }

  // Day-before reminders
  for (const task of allTasks) {
    if (task.completed || task.due_date !== tomorrow) continue;
    const trigger = new Date();
    trigger.setHours(9, 0, 0, 0);
    if (trigger < new Date()) trigger.setDate(trigger.getDate() + 1);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Due Tomorrow: ${task.name}`,
        body: `${task.projectName} · ${task.priority} priority`,
        data: { type: 'reminder', taskId: task.id, projectId: task.projectId },
      },
      trigger,
    });
  }

  // Overdue alerts (notify now if just opened app)
  for (const task of overdue.slice(0, 5)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Overdue: ${task.name}`,
        body: `${task.projectName} — was due ${task.due_date}`,
        data: { type: 'overdue', taskId: task.id, projectId: task.projectId },
      },
      trigger: null, // immediate
    });
  }
}

export function useNotificationNav(navigation) {
  Notifications.useLastNotificationResponse(response => {
    if (!response) return;
    const data = response.notification.request.content.data;
    if (data?.projectId) {
      navigation.navigate('Project', { projectId: data.projectId });
    }
  });
}
