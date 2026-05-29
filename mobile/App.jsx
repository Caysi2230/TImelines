import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import ProjectsScreen from './src/screens/ProjectsScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ProjectsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#111' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' }
      }}
    >
      <Stack.Screen name="Projects" component={ProjectsScreen} options={{ title: 'Timelines' }} />
      <Stack.Screen
        name="Project"
        component={ProjectScreen}
        options={({ route }) => ({ title: route.params?.projectName || 'Project' })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.projectId && navigationRef.current) {
        navigationRef.current.navigate('ProjectsTab', {
          screen: 'Project',
          params: { projectId: data.projectId }
        });
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: '#111', borderTopColor: '#333' },
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#666',
        }}
      >
        <Tab.Screen
          name="ProjectsTab"
          component={ProjectsStack}
          options={{ title: 'Projects', tabBarLabel: 'Projects' }}
        />
        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            title: 'Settings',
            headerShown: true,
            headerStyle: { backgroundColor: '#111' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
