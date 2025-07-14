import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import logo from "../../assets/images/dinetimelogo.png";
const entryImg = require("../../assets/images/Frame.png");
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../../utils/auth";

const Signin = () => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleGuest = async () => {
    await AsyncStorage.setItem("isGuest", "true");
    router.push("/home");
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      const result = await authService.loginWithWallet();
      await AsyncStorage.setItem("isGuest", "false");
      // Instead of going to home, go to onboarding name step
      router.push("/onboarding/name");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Failed to sign in with wallet. Please try again.",
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
            Sign in with your Solana wallet
          </Text>

          <View className="w-5/6">
            <TouchableOpacity
              onPress={handleConnectWallet}
              disabled={isConnecting}
              className={`p-4 my-4 rounded-lg flex-row justify-center items-center ${
                isConnecting ? "bg-gray-500" : "bg-[#f49b33]"
              }`}
            >
              {isConnecting ? (
                <ActivityIndicator color="#2b2b2b" size="small" />
              ) : (
                <Text className="text-lg font-semibold text-center text-black">
                  Connect Wallet & Sign In
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
              onPress={() => router.push("/signup")}
              className="p-4 my-4 bg-transparent"
            >
              <Text className="text-lg font-semibold text-center text-[#f49b33]">
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signin;
