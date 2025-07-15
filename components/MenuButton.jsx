import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MenuButton({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-12 h-12 rounded-full bg-[#2b2b2b] border border-[#f49b33] justify-center items-center shadow-lg ml-2 mt-2"
      style={{ elevation: 6 }}
      activeOpacity={0.7}
    >
      <Ionicons name="menu" size={28} color="#f49b33" />
    </TouchableOpacity>
  );
} 