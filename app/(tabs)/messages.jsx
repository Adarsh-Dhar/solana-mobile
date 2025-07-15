import {
  View,
  Text,
  Image,
  Platform,
  ScrollView,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import logo from "../../assets/images/dinetimelogo.png";
import banner from "../../assets/images/homeBanner.png";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import sample1 from "../../assets/images/sample1.jpg";
import sample2 from "../../assets/images/sample2.jpg";
import sample3 from "../../assets/images/sample3.jpg";

export default function Messages() {
  const router = useRouter();
  // Demo messages data
  const [messages, setMessages] = useState([
    {
      id: "1",
      name: "Alice",
      avatar: sample1,
      message: "Hey! Are you coming to the dinner tonight?",
      unread: true,
    },
    {
      id: "2",
      name: "Bella",
      avatar: sample2,
      message: "Loved your last post! Let's catch up soon.",
      unread: false,
    },
    {
      id: "3",
      name: "Cara",
      avatar: sample3,
      message: "Can you share the menu for tomorrow?",
      unread: true,
    },
    {
      id: "4",
      name: "David",
      avatar: sample2,
      message: "Thanks for the invite! See you there.",
      unread: false,
    },
  ]);

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      className={`flex-row items-center p-4 mb-2 rounded-xl bg-[#232323] border-b border-[#fb9b33] ${item.unread ? "bg-[#353535]" : ""}`}
      onPress={() => router.push(`/messages/${item.id}`)}
      activeOpacity={0.8}
    >
      {/* Removed avatar image */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className={`text-lg font-semibold ${item.unread ? "text-white" : "text-gray-300"}`}>{item.name}</Text>
          {item.unread && <View className="ml-2 w-2 h-2 bg-[#fb9b33] rounded-full" />}
        </View>
        <Text className={`text-base ${item.unread ? "font-bold text-white" : "text-gray-300"}`} numberOfLines={1}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#2b2b2b] px-4 pt-2">
      <View className="flex items-center mb-4">
        <View className="bg-[#5f5f5f] w-11/12 rounded-lg shadow-lg justify-between items-center flex flex-row p-2">
          <View className="flex flex-row">
            <Text
              className={`text-base h-10 ${Platform.OS == "ios" ? "pt-[8px]" : "pt-1"} align-middle text-white`}
            >
              Messages
            </Text>
            <Image resizeMode="cover" className={"w-20 h-12"} source={logo} />
          </View>
        </View>
      </View>
      {messages.length > 0 ? (
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <ActivityIndicator animating color={"#fb9b33"} />
      )}
    </SafeAreaView>
  );
}
