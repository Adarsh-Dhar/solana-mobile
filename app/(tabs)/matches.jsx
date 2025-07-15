import { View, Text, TouchableOpacity, Animated, Dimensions, ScrollView, Image } from "react-native";
import React, { useRef } from "react";
import { FontAwesome, Feather, Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.75;
const TOP_SPACE = SCREEN_HEIGHT * 0.10;
const BOTTOM_SPACE = SCREEN_HEIGHT * 0.15;

const images = [
  require('../../assets/images/sample1.jpg'),
  require('../../assets/images/sample2.jpg'),
  require('../../assets/images/sample3.jpg'),
];

const BUTTONS = [
  {
    key: 'reject',
    icon: <FontAwesome name="close" size={28} color="#fff" />, // cross
    bg: 'bg-red-500',
  },
  {
    key: 'like',
    icon: <FontAwesome name="heart" size={28} color="#fff" />, // heart
    bg: 'bg-green-500',
  },
  {
    key: 'message',
    icon: <Feather name="send" size={28} color="#fff" />, // paper plane
    bg: 'bg-blue-500',
  },
];

export default function Matches() {
  // Animation refs for each button
  const anims = [useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current, useRef(new Animated.Value(1)).current];

  const handlePress = (idx) => {
    Animated.sequence([
      Animated.timing(anims[idx], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anims[idx], {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <View className="flex-1 bg-[#2b2b2b]">
      <ScrollView
        contentContainerStyle={{
          paddingTop: TOP_SPACE,
          paddingBottom: BOTTOM_SPACE,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {images.map((img, idx) => (
          <View key={idx} className="mb-8">
            <Image
              source={img}
              style={{
                width: '100%',
                height: IMAGE_HEIGHT,
                borderRadius: 24,
              }}
              resizeMode="cover"
              className="mx-auto"
            />
          </View>
        ))}
      </ScrollView>
      {/* Fixed Button Group */}
      <View
        className="absolute left-0 right-0"
        style={{
          bottom: BOTTOM_SPACE * 0.5,
          height: 80,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 32,
        }}
      >
        {BUTTONS.map((btn, idx) => (
          <Animated.View
            key={btn.key}
            style={{
              transform: [{ scale: anims[idx] }],
              marginHorizontal: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => handlePress(idx)}
              activeOpacity={0.7}
              className={`w-16 h-16 rounded-full ${btn.bg} justify-center items-center shadow-lg`}
              style={{ elevation: 6 }}
            >
              {btn.icon}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
