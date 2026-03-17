import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../theme';
import { useAppStore } from '../store';

// Onboarding
import WelcomeScreen from '../screens/onboarding/WelcomeScreen';
import ResidencySetupScreen from '../screens/onboarding/ResidencySetupScreen';
import JurisdictionSetupScreen from '../screens/onboarding/JurisdictionSetupScreen';
import TrackingPermissionsScreen from '../screens/onboarding/TrackingPermissionsScreen';

// Main Tabs
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import TaxPlanningScreen from '../screens/planning/TaxPlanningScreen';
import DocumentsScreen from '../screens/documents/DocumentsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';

// Detail Screens
import JurisdictionDetailScreen from '../screens/dashboard/JurisdictionDetailScreen';
import DayDetailScreen from '../screens/calendar/DayDetailScreen';
import AddLocationScreen from '../screens/calendar/AddLocationScreen';
import DocumentDetailScreen from '../screens/documents/DocumentDetailScreen';
import AddDocumentScreen from '../screens/documents/AddDocumentScreen';
import ManageJurisdictionsScreen from '../screens/settings/ManageJurisdictionsScreen';
import JurisdictionEditScreen from '../screens/settings/JurisdictionEditScreen';
import ImportDataScreen from '../screens/settings/ImportDataScreen';

const RootStack = createNativeStackNavigator();
const OnboardingStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const DashboardStack = createNativeStackNavigator();
const CalendarStack = createNativeStackNavigator();
const DocumentsStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} />
      <OnboardingStack.Screen name="ResidencySetup" component={ResidencySetupScreen} />
      <OnboardingStack.Screen name="JurisdictionSetup" component={JurisdictionSetupScreen} />
      <OnboardingStack.Screen name="TrackingPermissions" component={TrackingPermissionsScreen} />
    </OnboardingStack.Navigator>
  );
}

function DashboardNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="JurisdictionDetail" component={JurisdictionDetailScreen} />
    </DashboardStack.Navigator>
  );
}

function CalendarNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={{ headerShown: false }}>
      <CalendarStack.Screen name="CalendarHome" component={CalendarScreen} />
      <CalendarStack.Screen name="DayDetail" component={DayDetailScreen} />
      <CalendarStack.Screen name="AddLocation" component={AddLocationScreen} />
    </CalendarStack.Navigator>
  );
}

function DocumentsNavigator() {
  return (
    <DocumentsStack.Navigator screenOptions={{ headerShown: false }}>
      <DocumentsStack.Screen name="DocumentsHome" component={DocumentsScreen} />
      <DocumentsStack.Screen name="DocumentDetail" component={DocumentDetailScreen} />
      <DocumentsStack.Screen name="AddDocument" component={AddDocumentScreen} />
    </DocumentsStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
      <SettingsStack.Screen name="ManageJurisdictions" component={ManageJurisdictionsScreen} />
      <SettingsStack.Screen name="JurisdictionEdit" component={JurisdictionEditScreen} />
      <SettingsStack.Screen name="ImportData" component={ImportDataScreen} />
    </SettingsStack.Navigator>
  );
}

function TabIcon({ name, focused, label }: { name: string; focused: boolean; label: string }) {
  return (
    <View style={styles.tabItem}>
      <Ionicons
        name={name as any}
        size={22}
        color={focused ? Colors.primary : Colors.textTertiary}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} label="Overview" />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'calendar' : 'calendar-outline'} focused={focused} label="Calendar" />
          ),
        }}
      />
      <Tab.Screen
        name="Planning"
        component={TaxPlanningScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'trending-up' : 'trending-up-outline'} focused={focused} label="Planning" />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'folder' : 'folder-outline'} focused={focused} label="Evidence" />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { userProfile, hasHydrated } = useAppStore();

  if (!hasHydrated) return null;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!userProfile?.onboardingCompleted ? (
          <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.backgroundSecondary,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.primary,
  },
});
