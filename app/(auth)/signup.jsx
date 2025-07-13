import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/dinetimelogo.png";
const entryImg = require("../../assets/images/Frame.png");
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../../utils/auth";

const Signup = () => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [username, setUsername] = useState("");

  const handleGuest = async () => {
    await AsyncStorage.setItem("isGuest", "true");
    router.push("/home");
  };

  const handleConnectWallet = async () => {
    if (!username.trim()) {
      Alert.alert("Username Required", "Please enter a username to continue.");
      return;
    }

    setIsConnecting(true);
    try {
      console.log("Starting wallet registration...");
      const result = await authService.registerWithWallet(username.trim());
      console.log("Registration result:", result);
      
      await AsyncStorage.setItem("isGuest", "false");
      
      Alert.alert(
        "Registration Successful!",
        `Successfully registered with wallet: ${result.user.solanaAddress.slice(0, 8)}...${result.user.solanaAddress.slice(-4)}`,
        [{ text: "OK", onPress: () => router.push("/home") }]
      );
    } catch (error) {
      console.error("Registration error:", error);
      Alert.alert(
        "Registration Failed",
        error.message || "Failed to register with wallet. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <SafeAreaView className={`bg-[#2b2b2b]`}>
      <ScrollView contentContainerStyle={{ height: "100%" }}>
        <View className="m-2 flex justify-center items-center">
          <Image source={logo} style={{ width: 200, height: 100 }} />
          <Text className="text-lg text-center text-white font-bold mb-10">
            Create your account with Solana wallet
          </Text>

          <View className="w-5/6">
            <TextInput
              placeholder="Enter username"
              placeholderTextColor="#666"
              value={username}
              onChangeText={setUsername}
              className="p-4 mb-4 bg-white rounded-lg text-black"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={handleConnectWallet}
              disabled={isConnecting || !username.trim()}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${
                isConnecting || !username.trim() ? "bg-gray-500" : "bg-[#f49b33]"
              }`}
            >
              {isConnecting ? (
                <ActivityIndicator color="#2b2b2b" size="small" />
              ) : (
                <Text className="text-lg font-semibold text-center text-black">
                  Connect Wallet & Register
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGuest}
              className="p-4 my-4 bg-transparent border border-white rounded-lg"
            >
              <Text className="text-lg font-semibold text-center text-white">
                Continue as Guest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/signin")}
              className="p-4 my-4 bg-transparent"
            >
              <Text className="text-lg font-semibold text-center text-[#f49b33]">
                Already have an account? Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;
