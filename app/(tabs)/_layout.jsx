import React, { useState } from "react";
import { View, Text } from "react-native";
import { Tabs } from "expo-router";
import { Colors } from "../../assets/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";
import MenuButton from "../../components/MenuButton";
import MenuModal from "../../components/MenuModal";

const CustomHeader = ({ onMenuPress }) => (
  <View className="flex-row items-center bg-[#2b2b2b] h-16 px-2 pt-2">
    <MenuButton onPress={onMenuPress} />
    <Text className="text-2xl font-bold text-[#f49b33] ml-2">DineTime</Text>
  </View>
);

const TabLayout = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <>
      <CustomHeader onMenuPress={() => setMenuVisible(true)} />
      <MenuModal visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.PRIMARY,
          tabBarInActiveTintColor: Colors.dark.text,
          tabBarStyle: {
            backgroundColor: Colors.SECONDARY,
            paddingBottom: 14,
            height: 75,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "bold" },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => (
              <Ionicons name="time" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-sharp" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
};

export default TabLayout;
