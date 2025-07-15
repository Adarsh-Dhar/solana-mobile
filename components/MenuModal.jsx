import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MenuModal({ visible, onClose }) {
  const router = useRouter();
  const menuOptions = [
    { label: 'Notifications', icon: 'notifications-outline', route: '/(tabs)/menu/notifications' },
    { label: 'Profile', icon: 'person-outline', route: '/(tabs)/menu/profile' },
    { label: 'Settings', icon: 'settings-outline', route: '/(tabs)/menu/settings' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose}>
        <View className="absolute top-16 left-4 right-16 bg-[#2b2b2b] rounded-2xl shadow-lg p-4 border border-[#f49b33]">
          {menuOptions.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              className="flex-row items-center py-3 px-2 rounded-xl hover:bg-[#f49b33]/10"
              onPress={() => {
                onClose();
                router.push(opt.route);
              }}
            >
              <Ionicons name={opt.icon} size={22} color="#f49b33" className="mr-3" />
              <Text className="text-lg text-white font-semibold">{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
} 